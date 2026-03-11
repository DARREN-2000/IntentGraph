import { validateWorkflowSpec, isValidWorkflowSpec } from '../src/validation';
import type { WorkflowSpec } from '../src/types';

describe('validateWorkflowSpec', () => {
  const validSpec: WorkflowSpec = {
    id: 'wf-1',
    title: 'Test Workflow',
    steps: [
      {
        id: 'step-1',
        action: 'test.action',
        input: { foo: 'bar' },
        requiresApproval: false,
      },
      {
        id: 'step-2',
        action: 'test.action2',
        input: {},
        requiresApproval: true,
        dependsOn: ['step-1'],
      },
    ],
  };

  it('should accept a valid workflow spec', () => {
    const errors = validateWorkflowSpec(validSpec);
    expect(errors).toHaveLength(0);
  });

  it('should reject null', () => {
    const errors = validateWorkflowSpec(null);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('non-null object');
  });

  it('should reject non-object', () => {
    const errors = validateWorkflowSpec('string');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should require id', () => {
    const errors = validateWorkflowSpec({ ...validSpec, id: '' });
    expect(errors.some((e) => e.path === 'id')).toBe(true);
  });

  it('should require title', () => {
    const errors = validateWorkflowSpec({ ...validSpec, title: '' });
    expect(errors.some((e) => e.path === 'title')).toBe(true);
  });

  it('should require steps array', () => {
    const errors = validateWorkflowSpec({ ...validSpec, steps: 'not-array' });
    expect(errors.some((e) => e.path === 'steps')).toBe(true);
  });

  it('should require at least one step', () => {
    const errors = validateWorkflowSpec({ ...validSpec, steps: [] });
    expect(errors.some((e) => e.message.includes('at least one step'))).toBe(true);
  });

  it('should detect duplicate step ids', () => {
    const errors = validateWorkflowSpec({
      ...validSpec,
      steps: [
        { id: 'dup', action: 'a', input: {}, requiresApproval: false },
        { id: 'dup', action: 'b', input: {}, requiresApproval: false },
      ],
    });
    expect(errors.some((e) => e.message.includes('duplicate'))).toBe(true);
  });

  it('should detect unknown dependsOn references', () => {
    const errors = validateWorkflowSpec({
      ...validSpec,
      steps: [
        {
          id: 'step-1',
          action: 'a',
          input: {},
          requiresApproval: false,
          dependsOn: ['nonexistent'],
        },
      ],
    });
    expect(errors.some((e) => e.message.includes('unknown step id'))).toBe(true);
  });

  it('should require action on steps', () => {
    const errors = validateWorkflowSpec({
      ...validSpec,
      steps: [{ id: 'step-1', action: '', input: {}, requiresApproval: false }],
    });
    expect(errors.some((e) => e.path.includes('action'))).toBe(true);
  });

  it('should require requiresApproval boolean', () => {
    const errors = validateWorkflowSpec({
      ...validSpec,
      steps: [{ id: 'step-1', action: 'a', input: {} }],
    });
    expect(errors.some((e) => e.path.includes('requiresApproval'))).toBe(true);
  });
});

describe('isValidWorkflowSpec', () => {
  it('should return true for valid spec', () => {
    expect(
      isValidWorkflowSpec({
        id: 'wf-1',
        title: 'Test',
        steps: [{ id: 's1', action: 'a', input: {}, requiresApproval: false }],
      }),
    ).toBe(true);
  });

  it('should return false for invalid spec', () => {
    expect(isValidWorkflowSpec(null)).toBe(false);
  });
});
