import { defineAction } from '../src/define-action';
import { createMockContext } from '../src/testing';

describe('defineAction', () => {
  it('should create an action plugin with all required fields', () => {
    const plugin = defineAction<{ message: string }, { sent: boolean }>({
      key: 'test.send',
      risk: 'medium',
      effects: ['external-communication'],
      description: 'Send a test message',
      async preview(_ctx, input) {
        return { ok: true, preview: { willSend: input.message } };
      },
      async execute(_ctx, input) {
        return {
          ok: true,
          output: { sent: true },
          compensation: { action: 'test.unsend', payload: { message: input.message } },
        };
      },
      async compensate(_ctx, _payload) {
        // no-op for test
      },
    });

    expect(plugin.key).toBe('test.send');
    expect(plugin.risk).toBe('medium');
    expect(plugin.effects).toContain('external-communication');
    expect(plugin.description).toBe('Send a test message');
    expect(typeof plugin.preview).toBe('function');
    expect(typeof plugin.execute).toBe('function');
    expect(typeof plugin.compensate).toBe('function');
  });

  it('should work without compensate', () => {
    const plugin = defineAction({
      key: 'test.read',
      risk: 'low',
      effects: ['read-only'],
      description: 'Read something',
      async preview() {
        return { ok: true, preview: {} };
      },
      async execute() {
        return { ok: true, output: {} };
      },
    });

    expect(plugin.compensate).toBeUndefined();
  });

  it('preview should return correct data', async () => {
    const plugin = defineAction<{ query: string }, { results: string[] }>({
      key: 'test.search',
      risk: 'low',
      effects: ['read-only'],
      description: 'Search for something',
      async preview(_ctx, input) {
        return { ok: true, preview: { willSearch: input.query } };
      },
      async execute(_ctx, input) {
        return { ok: true, output: { results: [`result for ${input.query}`] } };
      },
    });

    const ctx = createMockContext({ dryRun: true });
    const result = await plugin.preview(ctx, { query: 'hello' });
    expect(result.ok).toBe(true);
    expect(result.preview).toEqual({ willSearch: 'hello' });
  });

  it('execute should return output and compensation', async () => {
    const plugin = defineAction<{ data: string }, { id: string }>({
      key: 'test.create',
      risk: 'medium',
      effects: ['write'],
      description: 'Create a resource',
      async preview(_ctx, input) {
        return { ok: true, preview: { willCreate: input.data } };
      },
      async execute(_ctx, _input) {
        const id = 'created-123';
        return {
          ok: true,
          output: { id },
          compensation: { action: 'test.delete', payload: { id } },
        };
      },
      async compensate(_ctx, _payload) {
        // would delete the resource
      },
    });

    const ctx = createMockContext();
    const result = await plugin.execute(ctx, { data: 'test-data' });
    expect(result.ok).toBe(true);
    expect(result.output).toEqual({ id: 'created-123' });
    expect(result.compensation).toEqual({
      action: 'test.delete',
      payload: { id: 'created-123' },
    });
  });
});

describe('createMockContext', () => {
  it('should create a context with defaults', () => {
    const ctx = createMockContext();
    expect(ctx.userId).toBe('test-user');
    expect(ctx.workspaceId).toBe('test-workspace');
    expect(ctx.dryRun).toBe(false);
    expect(ctx.requestId).toBeTruthy();
    expect(ctx.idempotencyKey).toBeTruthy();
    expect(ctx.timestamp).toBeTruthy();
  });

  it('should allow overrides', () => {
    const ctx = createMockContext({ userId: 'custom-user', dryRun: true });
    expect(ctx.userId).toBe('custom-user');
    expect(ctx.dryRun).toBe(true);
    expect(ctx.workspaceId).toBe('test-workspace');
  });
});
