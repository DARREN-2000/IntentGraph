import type {
  ActionContext,
  ActionResult,
  AuditEvent,
  WorkflowRun,
  WorkflowSpec,
  WorkflowStep,
  WorkflowStepRun,
} from './types';

/**
 * The universal action plugin contract.
 */
export interface ActionPlugin<I = unknown, O = unknown> {
  key: string;
  risk: import('./types').RiskLevel;
  effects: import('./types').EffectCategory[];
  description: string;
  preview(ctx: ActionContext, input: I): Promise<ActionResult<O>>;
  execute(ctx: ActionContext, input: I): Promise<ActionResult<O>>;
  compensate?(ctx: ActionContext, payload: unknown): Promise<void>;
}

interface PluginRegistry {
  get(actionKey: string): ActionPlugin<unknown, unknown> | null;
}

interface ApprovalChecker {
  check(step: WorkflowStep, context: ActionContext, preview: unknown): Promise<boolean>;
}

export class WorkflowRuntime {
  private plugins: PluginRegistry;
  private approvalChecker: ApprovalChecker;

  constructor(plugins: PluginRegistry, approvalChecker: ApprovalChecker) {
    this.plugins = plugins;
    this.approvalChecker = approvalChecker;
  }

  async runWorkflow(spec: WorkflowSpec, context: ActionContext): Promise<WorkflowRun> {
    const run: WorkflowRun = {
      id: context.requestId,
      workflowId: spec.id,
      specId: spec.id,
      status: 'running',
      currentStepIndex: 0,
      results: {},
      stepRuns: [],
      startedAt: new Date().toISOString(),
      context,
    };

    await this.emitAudit(context, {
      type: 'workflow.started',
      timestamp: run.startedAt,
      userId: context.userId,
      sessionId: context.sessionId,
      workflowId: run.id,
      workflowRunId: run.id,
      actorId: context.userId,
      data: { specId: spec.id, stepCount: spec.steps.length },
    });

    for (let i = 0; i < spec.steps.length; i += 1) {
      const step = spec.steps[i];
      run.currentStepIndex = i;

      const result = await this.executeStep(step, context, run);
      if (run.results) {
        run.results[step.id] = result;
      }

      if (!result.ok) {
        run.status = 'failed';
        await this.rollback(run, spec, context, i);
        break;
      }

      if (i === spec.steps.length - 1) {
        run.status = 'completed';
      }
    }

    run.completedAt = new Date().toISOString();
    await this.emitAudit(context, {
      type: `workflow.${run.status}`,
      timestamp: run.completedAt,
      userId: context.userId,
      sessionId: context.sessionId,
      workflowId: run.id,
      workflowRunId: run.id,
      actorId: context.userId,
      data: { status: run.status },
    });

    return run;
  }

  private async executeStep(
    step: WorkflowStep,
    context: ActionContext,
    run: WorkflowRun,
  ): Promise<ActionResult<unknown>> {
    const plugin = this.plugins.get(step.action);
    const stepRun: WorkflowStepRun = {
      stepId: step.id,
      action: step.action,
      status: 'previewing',
      retryCount: 0,
      startedAt: new Date().toISOString(),
    };
    run.stepRuns.push(stepRun);

    if (!plugin) {
      stepRun.status = 'failed';
      stepRun.error = `Missing action plugin: ${step.action}`;
      stepRun.completedAt = new Date().toISOString();
      await this.emitAudit(context, {
        type: 'step.failed',
        timestamp: new Date().toISOString(),
        userId: context.userId,
        sessionId: context.sessionId,
        workflowId: run.id,
        workflowRunId: run.id,
        stepId: step.id,
        actorId: context.userId,
        data: { error: stepRun.error },
      });
      return { ok: false, error: stepRun.error };
    }

    const previewResult = await plugin.preview({ ...context, dryRun: true }, step.input);
    stepRun.preview = previewResult.preview ?? previewResult.output ?? null;
    await this.emitAudit(context, {
      type: 'step.preview',
      timestamp: new Date().toISOString(),
      userId: context.userId,
      sessionId: context.sessionId,
      workflowId: run.id,
      workflowRunId: run.id,
      stepId: step.id,
      actorId: context.userId,
      data: { action: step.action, preview: stepRun.preview },
    });

    if (!previewResult.ok) {
      stepRun.status = 'failed';
      stepRun.error = previewResult.error || 'Preview failed';
      stepRun.completedAt = new Date().toISOString();
      return previewResult;
    }

    if (step.requiresApproval) {
      stepRun.status = 'waiting-approval';
      await this.emitAudit(context, {
        type: 'step.approval.requested',
        timestamp: new Date().toISOString(),
        userId: context.userId,
        sessionId: context.sessionId,
        workflowId: run.id,
        workflowRunId: run.id,
        stepId: step.id,
        actorId: context.userId,
        data: { action: step.action },
      });

      const approved = await this.approvalChecker.check(step, context, stepRun.preview);
      if (!approved) {
        stepRun.status = 'failed';
        stepRun.error = `Approval denied for ${step.action}`;
        stepRun.completedAt = new Date().toISOString();
        await this.emitAudit(context, {
          type: 'step.approval.denied',
          timestamp: new Date().toISOString(),
          userId: context.userId,
          sessionId: context.sessionId,
          workflowId: run.id,
          workflowRunId: run.id,
          stepId: step.id,
          actorId: context.userId,
        });
        return { ok: false, error: 'Approval denied' };
      }

      await this.emitAudit(context, {
        type: 'step.approval.granted',
        timestamp: new Date().toISOString(),
        userId: context.userId,
        sessionId: context.sessionId,
        workflowId: run.id,
        workflowRunId: run.id,
        stepId: step.id,
        actorId: context.userId,
      });
    }

    stepRun.status = 'executing';
    const maxRetries = step.maxRetries ?? 0;
    let lastError: unknown;
    let executeResult: ActionResult<unknown> | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        executeResult = await plugin.execute({ ...context, dryRun: false }, step.input);
        stepRun.retryCount = attempt;
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        stepRun.retryCount = attempt + 1;
      }
    }

    if (lastError || !executeResult) {
      const message =
        lastError instanceof Error ? lastError.message : String(lastError ?? 'Unknown error');
      stepRun.status = 'failed';
      stepRun.error = message;
      stepRun.completedAt = new Date().toISOString();
      await this.emitAudit(context, {
        type: 'step.failed',
        timestamp: new Date().toISOString(),
        userId: context.userId,
        sessionId: context.sessionId,
        workflowId: run.id,
        workflowRunId: run.id,
        stepId: step.id,
        actorId: context.userId,
        data: { error: message, retries: stepRun.retryCount },
      });
      return { ok: false, error: message };
    }

    stepRun.status = 'completed';
    stepRun.output = executeResult.output;
    stepRun.compensation = executeResult.compensation;
    stepRun.completedAt = new Date().toISOString();

    await this.emitAudit(context, {
      type: 'step.executed',
      timestamp: new Date().toISOString(),
      userId: context.userId,
      sessionId: context.sessionId,
      workflowId: run.id,
      workflowRunId: run.id,
      stepId: step.id,
      actorId: context.userId,
      data: { action: step.action, output: executeResult.output },
    });

    return executeResult;
  }

  private async rollback(
    run: WorkflowRun,
    spec: WorkflowSpec,
    context: ActionContext,
    failedIndex: number,
  ): Promise<void> {
    for (let i = failedIndex - 1; i >= 0; i -= 1) {
      const step = spec.steps[i];
      const result = run.results?.[step.id] as ActionResult<unknown> | undefined;
      if (!result?.compensation) {
        continue;
      }

      const plugin = this.plugins.get(step.action) || this.plugins.get(result.compensation.action);
      if (!plugin?.compensate) {
        continue;
      }

      try {
        await plugin.compensate(context, result.compensation.payload);
        const existingStepRun = run.stepRuns.find((s) => s.stepId === step.id);
        if (existingStepRun) {
          existingStepRun.status = 'compensated';
        }
        await this.emitAudit(context, {
          type: 'step.compensated',
          timestamp: new Date().toISOString(),
          userId: context.userId,
          sessionId: context.sessionId,
          workflowId: run.id,
          workflowRunId: run.id,
          stepId: step.id,
          actorId: context.userId,
          data: { action: step.action },
        });
      } catch (error) {
        await this.emitAudit(context, {
          type: 'step.failed',
          timestamp: new Date().toISOString(),
          userId: context.userId,
          sessionId: context.sessionId,
          workflowId: run.id,
          workflowRunId: run.id,
          stepId: step.id,
          actorId: context.userId,
          data: { phase: 'compensation', error: String(error) },
        });
      }
    }

    run.status = 'rolled-back';
    await this.emitAudit(context, {
      type: 'workflow.rolled-back',
      timestamp: new Date().toISOString(),
      userId: context.userId,
      sessionId: context.sessionId,
      workflowId: run.id,
      workflowRunId: run.id,
      actorId: context.userId,
    });
  }

  private async emitAudit(context: ActionContext, event: AuditEvent): Promise<void> {
    if (context.audit) {
      await context.audit.log(event);
    }
  }
}

export type ApprovalCallback = (step: WorkflowStep, preview: unknown) => Promise<boolean>;
export type AuditEmitter = (event: Omit<AuditEvent, 'id' | 'timestamp'>) => void;

export interface RunWorkflowOptions {
  approve: ApprovalCallback;
  onAuditEvent?: AuditEmitter;
  onStepComplete?: (stepRun: WorkflowStepRun) => void;
  signal?: AbortSignal;
}

export function createRuntime(
  plugins: PluginRegistry,
  approvalChecker: ApprovalChecker,
): WorkflowRuntime {
  return new WorkflowRuntime(plugins, approvalChecker);
}

export async function runWorkflow(
  spec: WorkflowSpec,
  ctx: ActionContext,
  registry: Record<string, ActionPlugin<any, any>>,
  options: RunWorkflowOptions,
): Promise<WorkflowRun> {
  const { approve, onAuditEvent, onStepComplete, signal } = options;

  if (signal?.aborted) {
    return {
      id: ctx.requestId,
      workflowId: spec.id,
      status: 'cancelled',
      stepRuns: [],
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      context: ctx,
    };
  }

  const wrappedContext: ActionContext = {
    ...ctx,
    sessionId: ctx.sessionId || ctx.requestId,
    audit: onAuditEvent
      ? {
          log(event: AuditEvent): void {
            onAuditEvent({
              type: event.type,
              workflowRunId: event.workflowRunId || event.workflowId || ctx.requestId,
              stepId: event.stepId,
              actorId: event.actorId || event.userId || ctx.userId,
              data: event.data,
            });
          },
        }
      : undefined,
  };

  const runtime = createRuntime(
    {
      get(actionKey: string): ActionPlugin<unknown, unknown> | null {
        return registry[actionKey] || null;
      },
    },
    {
      async check(step: WorkflowStep, context: ActionContext, preview: unknown): Promise<boolean> {
        void context;
        return approve(step, preview);
      },
    },
  );

  const result = await runtime.runWorkflow(spec, wrappedContext);

  if (onStepComplete) {
    for (const stepRun of result.stepRuns) {
      if (stepRun.status === 'completed') {
        onStepComplete(stepRun);
      }
    }
  }

  return result;
}
