import type {
  ActionContext,
  ActionResult,
  Compensation,
  WorkflowSpec,
  WorkflowStep,
  WorkflowRun,
  WorkflowStepRun,
  AuditEvent,
} from './types';

/**
 * The universal action plugin contract.
 * Every connector and action must implement this interface.
 *
 * - preview(): show what will happen without side effects
 * - execute(): perform the action
 * - compensate(): reverse the action (best-effort rollback)
 */
export interface ActionPlugin<I = unknown, O = unknown> {
  /** Unique key identifying this action (e.g. "gmail.send_draft") */
  key: string;
  /** Risk classification */
  risk: import('./types').RiskLevel;
  /** Effect categories */
  effects: import('./types').EffectCategory[];
  /** Human-readable description */
  description: string;
  /** Preview what the action would do (must NOT produce side effects) */
  preview(ctx: ActionContext, input: I): Promise<ActionResult<O>>;
  /** Execute the action */
  execute(ctx: ActionContext, input: I): Promise<ActionResult<O>>;
  /** Reverse the action using compensation data from a prior execute() */
  compensate?(ctx: ActionContext, payload: unknown): Promise<void>;
}

/**
 * Approval callback signature.
 * Returns true if the step is approved, false if denied.
 */
export type ApprovalCallback = (
  step: WorkflowStep,
  preview: unknown,
) => Promise<boolean>;

/**
 * Audit event emitter callback.
 */
export type AuditEmitter = (event: Omit<AuditEvent, 'id' | 'timestamp'>) => void;

/**
 * Options for the workflow runner.
 */
export interface RunWorkflowOptions {
  /** Called when a step requires human approval */
  approve: ApprovalCallback;
  /** Called for every audit-worthy event */
  onAuditEvent?: AuditEmitter;
  /** Called when a step completes */
  onStepComplete?: (stepRun: WorkflowStepRun) => void;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Execute a workflow spec step-by-step with preview, approval gating,
 * durable execution, and automatic rollback on failure.
 */
export async function runWorkflow(
  spec: WorkflowSpec,
  ctx: ActionContext,
  registry: Record<string, ActionPlugin<any, any>>,
  options: RunWorkflowOptions,
): Promise<WorkflowRun> {
  const { approve, onAuditEvent, onStepComplete, signal } = options;

  const run: WorkflowRun = {
    id: ctx.requestId,
    workflowId: spec.id,
    status: 'running',
    stepRuns: [],
    startedAt: new Date().toISOString(),
    context: ctx,
  };

  const emit = (event: Omit<AuditEvent, 'id' | 'timestamp'>) => {
    if (onAuditEvent) {
      onAuditEvent(event);
    }
  };

  emit({
    type: 'workflow.started',
    workflowRunId: run.id,
    actorId: ctx.userId,
    data: { workflowId: spec.id, title: spec.title },
  });

  const completed: Array<{ plugin: ActionPlugin<any, any>; comp?: Compensation; stepId: string }> =
    [];

  for (const step of spec.steps) {
    // Check for cancellation
    if (signal?.aborted) {
      run.status = 'cancelled';
      break;
    }

    const plugin = registry[step.action];
    if (!plugin) {
      run.status = 'failed';
      const stepRun: WorkflowStepRun = {
        stepId: step.id,
        action: step.action,
        status: 'failed',
        error: `Missing action plugin: ${step.action}`,
        retryCount: 0,
      };
      run.stepRuns.push(stepRun);
      emit({
        type: 'step.failed',
        workflowRunId: run.id,
        stepId: step.id,
        actorId: ctx.userId,
        data: { error: stepRun.error },
      });

      // Rollback completed steps
      await rollback(completed, ctx, emit, run);
      run.completedAt = new Date().toISOString();
      return run;
    }

    const stepRun: WorkflowStepRun = {
      stepId: step.id,
      action: step.action,
      status: 'previewing',
      retryCount: 0,
      startedAt: new Date().toISOString(),
    };

    // 1. Preview
    const previewResult = await plugin.preview({ ...ctx, dryRun: true }, step.input);
    stepRun.preview = previewResult.preview ?? previewResult.output ?? null;

    emit({
      type: 'step.preview',
      workflowRunId: run.id,
      stepId: step.id,
      actorId: ctx.userId,
      data: { preview: stepRun.preview },
    });

    // 2. Approval gating
    if (step.requiresApproval) {
      stepRun.status = 'waiting-approval';
      run.status = 'waiting-approval';

      emit({
        type: 'step.approval.requested',
        workflowRunId: run.id,
        stepId: step.id,
        actorId: ctx.userId,
        data: { action: step.action, preview: stepRun.preview },
      });

      const allowed = await approve(step, stepRun.preview);

      if (!allowed) {
        stepRun.status = 'failed';
        stepRun.error = `Approval denied for ${step.action}`;
        stepRun.completedAt = new Date().toISOString();
        run.stepRuns.push(stepRun);
        run.status = 'failed';

        emit({
          type: 'step.approval.denied',
          workflowRunId: run.id,
          stepId: step.id,
          actorId: ctx.userId,
        });

        await rollback(completed, ctx, emit, run);
        run.completedAt = new Date().toISOString();
        return run;
      }

      emit({
        type: 'step.approval.granted',
        workflowRunId: run.id,
        stepId: step.id,
        actorId: ctx.userId,
      });

      run.status = 'running';
    }

    // 3. Execute with retry
    stepRun.status = 'executing';
    const maxRetries = step.maxRetries ?? 0;
    let lastError: unknown;
    let result: ActionResult | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        result = await plugin.execute({ ...ctx, dryRun: false }, step.input);
        lastError = undefined;
        break;
      } catch (err) {
        lastError = err;
        stepRun.retryCount = attempt + 1;
      }
    }

    if (lastError || !result) {
      const errorMessage =
        lastError instanceof Error ? lastError.message : String(lastError ?? 'Unknown error');
      stepRun.status = 'failed';
      stepRun.error = errorMessage;
      stepRun.completedAt = new Date().toISOString();
      run.stepRuns.push(stepRun);
      run.status = 'failed';

      emit({
        type: 'step.failed',
        workflowRunId: run.id,
        stepId: step.id,
        actorId: ctx.userId,
        data: { error: errorMessage, retries: stepRun.retryCount },
      });

      await rollback(completed, ctx, emit, run);
      run.completedAt = new Date().toISOString();
      return run;
    }

    // Success
    stepRun.status = 'completed';
    stepRun.output = result.output;
    stepRun.compensation = result.compensation;
    stepRun.completedAt = new Date().toISOString();
    run.stepRuns.push(stepRun);

    completed.push({ plugin, comp: result.compensation, stepId: step.id });

    emit({
      type: 'step.executed',
      workflowRunId: run.id,
      stepId: step.id,
      actorId: ctx.userId,
      data: { output: result.output },
    });

    if (onStepComplete) {
      onStepComplete(stepRun);
    }
  }

  if (run.status === 'running') {
    run.status = 'completed';
  }
  run.completedAt = new Date().toISOString();

  emit({
    type: run.status === 'completed' ? 'workflow.completed' : 'workflow.failed',
    workflowRunId: run.id,
    actorId: ctx.userId,
  });

  return run;
}

/**
 * Rollback completed steps in reverse order.
 */
async function rollback(
  completed: Array<{ plugin: ActionPlugin<any, any>; comp?: Compensation; stepId: string }>,
  ctx: ActionContext,
  emit: (event: Omit<AuditEvent, 'id' | 'timestamp'>) => void,
  run: WorkflowRun,
): Promise<void> {
  for (const item of [...completed].reverse()) {
    if (item.plugin.compensate && item.comp) {
      try {
        await item.plugin.compensate(ctx, item.comp.payload);

        // Update the step run status
        const stepRun = run.stepRuns.find((sr) => sr.stepId === item.stepId);
        if (stepRun) {
          stepRun.status = 'compensated';
        }

        emit({
          type: 'step.compensated',
          workflowRunId: run.id,
          stepId: item.stepId,
          actorId: ctx.userId,
        });
      } catch {
        // Compensation failures are logged but don't stop the rollback
        emit({
          type: 'step.failed',
          workflowRunId: run.id,
          stepId: item.stepId,
          actorId: ctx.userId,
          data: { phase: 'compensation' },
        });
      }
    }
  }

  if (run.status === 'failed') {
    run.status = 'rolled-back';
    emit({
      type: 'workflow.rolled-back',
      workflowRunId: run.id,
      actorId: ctx.userId,
    });
  }
}
