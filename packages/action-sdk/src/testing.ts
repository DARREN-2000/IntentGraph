import type { ActionContext } from '@intentgraph/workflow-spec';
import { randomUUID } from 'crypto';

/**
 * Create a mock ActionContext for testing action plugins.
 */
export function createMockContext(
  overrides: Partial<ActionContext> = {},
): ActionContext {
  return {
    userId: 'test-user',
    workspaceId: 'test-workspace',
    requestId: randomUUID(),
    dryRun: false,
    idempotencyKey: randomUUID(),
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}
