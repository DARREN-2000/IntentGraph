import { runWorkflow } from '../src/runtime';
import type { ActionPlugin } from '../src/runtime';
import type { WorkflowSpec, ActionContext, AuditEvent } from '../src/types';

function makeCtx(overrides: Partial<ActionContext> = {}): ActionContext {
  return {
    userId: 'user-1',
    workspaceId: 'ws-1',
    requestId: 'req-1',
    dryRun: false,
    idempotencyKey: 'idem-1',
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function makePlugin(
  key: string,
  overrides: Partial<ActionPlugin> = {},
): ActionPlugin {
  return {
    key,
    risk: 'low',
    effects: ['write'],
    description: `Test plugin: ${key}`,
    preview: jest.fn().mockResolvedValue({ ok: true, preview: { action: key } }),
    execute: jest.fn().mockResolvedValue({
      ok: true,
      output: { result: 'done' },
      compensation: { action: `${key}.undo`, payload: { id: '123' } },
    }),
    compensate: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('runWorkflow', () => {
  it('should execute a simple single-step workflow', async () => {
    const plugin = makePlugin('test.action');
    const spec: WorkflowSpec = {
      id: 'wf-1',
      title: 'Simple Workflow',
      steps: [
        { id: 's1', action: 'test.action', input: { x: 1 }, requiresApproval: false },
      ],
    };

    const result = await runWorkflow(spec, makeCtx(), { 'test.action': plugin }, {
      approve: jest.fn(),
    });

    expect(result.status).toBe('completed');
    expect(result.stepRuns).toHaveLength(1);
    expect(result.stepRuns[0].status).toBe('completed');
    expect(plugin.preview).toHaveBeenCalled();
    expect(plugin.execute).toHaveBeenCalled();
  });

  it('should execute a multi-step workflow in order', async () => {
    const callOrder: string[] = [];
    const plugin1 = makePlugin('action1', {
      execute: jest.fn().mockImplementation(async () => {
        callOrder.push('action1');
        return { ok: true, output: { step: 1 } };
      }),
    });
    const plugin2 = makePlugin('action2', {
      execute: jest.fn().mockImplementation(async () => {
        callOrder.push('action2');
        return { ok: true, output: { step: 2 } };
      }),
    });

    const spec: WorkflowSpec = {
      id: 'wf-2',
      title: 'Multi-step',
      steps: [
        { id: 's1', action: 'action1', input: {}, requiresApproval: false },
        { id: 's2', action: 'action2', input: {}, requiresApproval: false },
      ],
    };

    const result = await runWorkflow(
      spec,
      makeCtx(),
      { action1: plugin1, action2: plugin2 },
      { approve: jest.fn() },
    );

    expect(result.status).toBe('completed');
    expect(callOrder).toEqual(['action1', 'action2']);
  });

  it('should gate on approval and succeed when approved', async () => {
    const plugin = makePlugin('risky.action');
    const spec: WorkflowSpec = {
      id: 'wf-3',
      title: 'Approval Workflow',
      steps: [
        { id: 's1', action: 'risky.action', input: {}, requiresApproval: true },
      ],
    };

    const approve = jest.fn().mockResolvedValue(true);
    const result = await runWorkflow(spec, makeCtx(), { 'risky.action': plugin }, { approve });

    expect(approve).toHaveBeenCalled();
    expect(result.status).toBe('completed');
  });

  it('should fail when approval is denied', async () => {
    const plugin = makePlugin('risky.action');
    const spec: WorkflowSpec = {
      id: 'wf-4',
      title: 'Denied Workflow',
      steps: [
        { id: 's1', action: 'risky.action', input: {}, requiresApproval: true },
      ],
    };

    const approve = jest.fn().mockResolvedValue(false);
    const result = await runWorkflow(spec, makeCtx(), { 'risky.action': plugin }, { approve });

    expect(result.status).toBe('rolled-back');
    expect(result.stepRuns[0].error).toContain('Approval denied');
  });

  it('should rollback completed steps on failure', async () => {
    const plugin1 = makePlugin('step1');
    const plugin2 = makePlugin('step2', {
      execute: jest.fn().mockRejectedValue(new Error('Boom')),
    });

    const spec: WorkflowSpec = {
      id: 'wf-5',
      title: 'Rollback Workflow',
      steps: [
        { id: 's1', action: 'step1', input: {}, requiresApproval: false },
        { id: 's2', action: 'step2', input: {}, requiresApproval: false },
      ],
    };

    const result = await runWorkflow(
      spec,
      makeCtx(),
      { step1: plugin1, step2: plugin2 },
      { approve: jest.fn() },
    );

    expect(result.status).toBe('rolled-back');
    expect(plugin1.compensate).toHaveBeenCalled();
  });

  it('should fail gracefully for missing plugin', async () => {
    const spec: WorkflowSpec = {
      id: 'wf-6',
      title: 'Missing Plugin',
      steps: [
        { id: 's1', action: 'nonexistent', input: {}, requiresApproval: false },
      ],
    };

    const result = await runWorkflow(spec, makeCtx(), {}, { approve: jest.fn() });

    expect(result.status).toBe('rolled-back');
    expect(result.stepRuns[0].error).toContain('Missing action plugin');
  });

  it('should emit audit events', async () => {
    const plugin = makePlugin('audited.action');
    const spec: WorkflowSpec = {
      id: 'wf-7',
      title: 'Audit Workflow',
      steps: [
        { id: 's1', action: 'audited.action', input: {}, requiresApproval: false },
      ],
    };

    const events: Array<Omit<AuditEvent, 'id' | 'timestamp'>> = [];
    const result = await runWorkflow(
      spec,
      makeCtx(),
      { 'audited.action': plugin },
      {
        approve: jest.fn(),
        onAuditEvent: (e) => events.push(e),
      },
    );

    expect(result.status).toBe('completed');
    expect(events.some((e) => e.type === 'workflow.started')).toBe(true);
    expect(events.some((e) => e.type === 'step.preview')).toBe(true);
    expect(events.some((e) => e.type === 'step.executed')).toBe(true);
    expect(events.some((e) => e.type === 'workflow.completed')).toBe(true);
  });

  it('should retry on failure when maxRetries is set', async () => {
    let attempts = 0;
    const plugin = makePlugin('flaky.action', {
      execute: jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) throw new Error('Transient failure');
        return { ok: true, output: { recovered: true } };
      }),
    });

    const spec: WorkflowSpec = {
      id: 'wf-8',
      title: 'Retry Workflow',
      steps: [
        { id: 's1', action: 'flaky.action', input: {}, requiresApproval: false, maxRetries: 3 },
      ],
    };

    const result = await runWorkflow(
      spec,
      makeCtx(),
      { 'flaky.action': plugin },
      { approve: jest.fn() },
    );

    expect(result.status).toBe('completed');
    expect(attempts).toBe(3);
  });

  it('should call onStepComplete callback', async () => {
    const plugin = makePlugin('callback.action');
    const spec: WorkflowSpec = {
      id: 'wf-9',
      title: 'Callback Workflow',
      steps: [
        { id: 's1', action: 'callback.action', input: {}, requiresApproval: false },
      ],
    };

    const completedSteps: string[] = [];
    const result = await runWorkflow(
      spec,
      makeCtx(),
      { 'callback.action': plugin },
      {
        approve: jest.fn(),
        onStepComplete: (stepRun) => completedSteps.push(stepRun.stepId),
      },
    );

    expect(result.status).toBe('completed');
    expect(completedSteps).toEqual(['s1']);
  });
});
