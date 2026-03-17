import type { WorkflowSpec, WorkflowStep } from './types';

/**
 * Validation error details.
 */
export interface ValidationError {
  path: string;
  message: string;
}

/**
 * Validate a WorkflowSpec for structural correctness.
 */
export function validateWorkflowSpec(spec: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!spec || typeof spec !== 'object') {
    errors.push({ path: '', message: 'WorkflowSpec must be a non-null object' });
    return errors;
  }

  const s = spec as Record<string, unknown>;

  if (typeof s.id !== 'string' || s.id.length === 0) {
    errors.push({ path: 'id', message: 'id must be a non-empty string' });
  }

  if (typeof s.title !== 'string' || s.title.length === 0) {
    errors.push({ path: 'title', message: 'title must be a non-empty string' });
  }

  if (!Array.isArray(s.steps)) {
    errors.push({ path: 'steps', message: 'steps must be an array' });
    return errors;
  }

  if (s.steps.length === 0) {
    errors.push({ path: 'steps', message: 'steps must contain at least one step' });
  }

  const stepIds = new Set<string>();

  for (let i = 0; i < s.steps.length; i++) {
    const step = s.steps[i] as Record<string, unknown>;
    const prefix = `steps[${i}]`;

    if (!step || typeof step !== 'object') {
      errors.push({ path: prefix, message: 'step must be a non-null object' });
      continue;
    }

    if (typeof step.id !== 'string' || step.id.length === 0) {
      errors.push({ path: `${prefix}.id`, message: 'step id must be a non-empty string' });
    } else if (stepIds.has(step.id)) {
      errors.push({ path: `${prefix}.id`, message: `duplicate step id: ${step.id}` });
    } else {
      stepIds.add(step.id);
    }

    if (typeof step.action !== 'string' || step.action.length === 0) {
      errors.push({
        path: `${prefix}.action`,
        message: 'step action must be a non-empty string',
      });
    }

    if (typeof step.requiresApproval !== 'boolean') {
      errors.push({
        path: `${prefix}.requiresApproval`,
        message: 'requiresApproval must be a boolean',
      });
    }

    // Validate dependsOn references
    if (step.dependsOn !== undefined) {
      if (!Array.isArray(step.dependsOn)) {
        errors.push({
          path: `${prefix}.dependsOn`,
          message: 'dependsOn must be an array of step IDs',
        });
      } else {
        for (const dep of step.dependsOn) {
          if (typeof dep !== 'string') {
            errors.push({
              path: `${prefix}.dependsOn`,
              message: 'dependsOn entries must be strings',
            });
          }
        }
      }
    }
  }

  // Validate dependsOn references point to existing steps
  if (Array.isArray(s.steps)) {
    const steps = s.steps as WorkflowStep[];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.dependsOn) {
        for (const dep of step.dependsOn) {
          if (!stepIds.has(dep)) {
            errors.push({
              path: `steps[${i}].dependsOn`,
              message: `references unknown step id: ${dep}`,
            });
          }
        }
      }
    }

    // Detect circular dependencies in dependsOn graph.
    const indexByStepId = new Map<string, number>();
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (typeof step.id === 'string') {
        indexByStepId.set(step.id, i);
      }
    }

    const visiting = new Set<string>();
    const visited = new Set<string>();

    const dfs = (stepId: string): void => {
      visiting.add(stepId);

      const stepIndex = indexByStepId.get(stepId);
      if (stepIndex !== undefined) {
        const step = steps[stepIndex];
        for (const dep of step.dependsOn ?? []) {
          if (!indexByStepId.has(dep)) {
            continue;
          }
          if (visiting.has(dep)) {
            errors.push({
              path: `steps[${stepIndex}].dependsOn`,
              message: `circular dependency detected: ${stepId} -> ${dep}`,
            });
            continue;
          }
          if (!visited.has(dep)) {
            dfs(dep);
          }
        }
      }

      visiting.delete(stepId);
      visited.add(stepId);
    };

    for (const stepId of indexByStepId.keys()) {
      if (!visited.has(stepId)) {
        dfs(stepId);
      }
    }
  }

  return errors;
}

/**
 * Check if a workflow spec is valid.
 */
export function isValidWorkflowSpec(spec: unknown): spec is WorkflowSpec {
  return validateWorkflowSpec(spec).length === 0;
}
