import { describe, expect, it } from 'vitest';
import { PlannerService } from '../src';

describe('PlannerService', () => {
  it('plans a known GitHub issue intent', async () => {
    const planner = new PlannerService();

    const result = await planner.plan({
      userId: 'user-1',
      intent: 'Create an issue in github repo: my-repo title: Login bug',
    });

    expect(result.success).toBe(true);
    expect(result.workflow).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.workflow?.steps).toHaveLength(1);
    expect(result.workflow?.steps[0].action).toBe('github.create_issue');
  });

  it('requires approval for high-risk pull request action', async () => {
    const planner = new PlannerService();

    const result = await planner.plan({
      userId: 'user-1',
      intent: 'Create a pull request in github repo: my-repo title: Improve auth from: feat/auth to: main',
    });

    expect(result.success).toBe(true);
    expect(result.workflow?.steps[0].requiresApproval).toBe(true);
    expect(result.warnings).toContain('This workflow contains high-risk actions requiring approval');
  });

  it('returns a helpful error for unknown intents', async () => {
    const planner = new PlannerService();

    const result = await planner.plan({
      userId: 'user-1',
      intent: 'do the thing somehow',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Could not understand intent');
  });

  it('allows registering a custom action', () => {
    const planner = new PlannerService();

    planner.registerAction({
      key: 'custom.low_risk_action',
      description: 'Custom low risk action',
      inputSchema: {
        value: { type: 'string', required: true, description: 'Input value' },
      },
      risk: 'low',
      effects: ['read'],
    });

    const actions = planner.getAvailableActions();
    expect(actions.find((action) => action.key === 'custom.low_risk_action')).toBeDefined();
  });
});
