import { checkPolicy } from '../src/index';
import type { WorkflowStep, EffectCategory, RiskLevel } from '@intentgraph/workflow-spec';

function makeStep(overrides: Partial<WorkflowStep> = {}): WorkflowStep {
  return {
    id: 'step-1',
    action: 'test.action',
    input: {},
    requiresApproval: false,
    ...overrides,
  };
}

describe('checkPolicy', () => {
  it('should allow read-only operations', () => {
    const result = checkPolicy(makeStep(), 'low', ['read-only']);
    expect(result.allowed).toBe(true);
    expect(result.requiresApproval).toBe(false);
  });

  it('should require approval for money movement', () => {
    const result = checkPolicy(makeStep(), 'low', ['money-movement']);
    expect(result.requiresApproval).toBe(true);
  });

  it('should require approval for deletion', () => {
    const result = checkPolicy(makeStep(), 'low', ['deletion']);
    expect(result.requiresApproval).toBe(true);
  });

  it('should require approval for access changes', () => {
    const result = checkPolicy(makeStep(), 'low', ['access-change']);
    expect(result.requiresApproval).toBe(true);
  });

  it('should block critical deletion actions', () => {
    const result = checkPolicy(makeStep(), 'critical', ['deletion']);
    expect(result.allowed).toBe(false);
    expect(result.blockReasons.length).toBeGreaterThan(0);
  });

  it('should require approval for high-risk external communication', () => {
    const result = checkPolicy(makeStep(), 'high', ['external-communication']);
    expect(result.requiresApproval).toBe(true);
  });

  it('should warn on provisioning', () => {
    const result = checkPolicy(makeStep(), 'low', ['provisioning']);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should require approval for medium-risk external communication', () => {
    const result = checkPolicy(makeStep(), 'medium', ['external-communication']);
    expect(result.requiresApproval).toBe(true);
  });

  it('should not require approval for low-risk writes', () => {
    const result = checkPolicy(makeStep(), 'low', ['write']);
    expect(result.requiresApproval).toBe(false);
  });

  it('should use custom rules when provided', () => {
    const customRules = [
      {
        id: 'custom-block',
        name: 'Block all writes',
        description: 'No writes allowed',
        effects: ['write' as EffectCategory],
        minRiskLevel: 'low' as RiskLevel,
        action: 'block' as const,
      },
    ];
    const result = checkPolicy(makeStep(), 'low', ['write'], customRules);
    expect(result.allowed).toBe(false);
  });

  it('should preserve existing requiresApproval from step', () => {
    const result = checkPolicy(
      makeStep({ requiresApproval: true }),
      'low',
      ['read-only'],
    );
    expect(result.requiresApproval).toBe(true);
  });

  it('should track matched rules', () => {
    const result = checkPolicy(makeStep(), 'high', ['deletion', 'money-movement']);
    expect(result.matchedRules.length).toBeGreaterThan(0);
  });
});
