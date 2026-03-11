import type {
  EffectCategory,
  RiskLevel,
  WorkflowStep,
} from '@intentgraph/workflow-spec';

/**
 * A policy rule that determines whether a step requires approval
 * or should be blocked entirely.
 */
export interface PolicyRule {
  /** Unique rule ID */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of the rule */
  description: string;
  /** Effect categories this rule applies to */
  effects: EffectCategory[];
  /** Minimum risk level that triggers this rule */
  minRiskLevel: RiskLevel;
  /** Action to take when the rule matches */
  action: 'require-approval' | 'block' | 'allow' | 'warn';
}

/**
 * Result of evaluating a step against policy rules.
 */
export interface PolicyCheckResult {
  /** Whether the step is allowed to proceed */
  allowed: boolean;
  /** Whether approval is required */
  requiresApproval: boolean;
  /** Rules that matched */
  matchedRules: PolicyRule[];
  /** Warnings to surface to the user */
  warnings: string[];
  /** Reasons for blocking (if not allowed) */
  blockReasons: string[];
}

const RISK_ORDER: Record<RiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

/**
 * Default policy rules for the IntentGraph platform.
 */
export const DEFAULT_POLICY_RULES: PolicyRule[] = [
  {
    id: 'block-critical-auto',
    name: 'Block critical actions without review',
    description: 'Critical-risk actions are always blocked and require manual review',
    effects: ['deletion', 'money-movement', 'access-change', 'provisioning'],
    minRiskLevel: 'critical',
    action: 'block',
  },
  {
    id: 'approve-high-write',
    name: 'Approve high-risk writes',
    description: 'High-risk write operations require approval',
    effects: ['write', 'external-communication', 'deletion', 'money-movement'],
    minRiskLevel: 'high',
    action: 'require-approval',
  },
  {
    id: 'approve-money',
    name: 'Approve money movement',
    description: 'Any money movement action requires approval',
    effects: ['money-movement'],
    minRiskLevel: 'low',
    action: 'require-approval',
  },
  {
    id: 'approve-deletion',
    name: 'Approve deletions',
    description: 'Any deletion action requires approval',
    effects: ['deletion'],
    minRiskLevel: 'low',
    action: 'require-approval',
  },
  {
    id: 'approve-access-change',
    name: 'Approve access changes',
    description: 'Any access change action requires approval',
    effects: ['access-change'],
    minRiskLevel: 'low',
    action: 'require-approval',
  },
  {
    id: 'approve-external-comms',
    name: 'Approve external communications',
    description: 'External communications at medium risk or above require approval',
    effects: ['external-communication'],
    minRiskLevel: 'medium',
    action: 'require-approval',
  },
  {
    id: 'warn-provisioning',
    name: 'Warn on provisioning',
    description: 'Provisioning actions generate a warning',
    effects: ['provisioning'],
    minRiskLevel: 'low',
    action: 'warn',
  },
  {
    id: 'allow-read-only',
    name: 'Allow read-only operations',
    description: 'Read-only operations are always allowed',
    effects: ['read-only'],
    minRiskLevel: 'low',
    action: 'allow',
  },
];

/**
 * Evaluate a workflow step against a set of policy rules.
 */
export function checkPolicy(
  step: WorkflowStep,
  stepRisk: RiskLevel,
  stepEffects: EffectCategory[],
  rules: PolicyRule[] = DEFAULT_POLICY_RULES,
): PolicyCheckResult {
  const result: PolicyCheckResult = {
    allowed: true,
    requiresApproval: step.requiresApproval,
    matchedRules: [],
    warnings: [],
    blockReasons: [],
  };

  for (const rule of rules) {
    // Check if any of the step's effects match the rule's effects
    const effectMatch = stepEffects.some((e) => rule.effects.includes(e));
    if (!effectMatch) continue;

    // Check if the risk level meets the minimum threshold
    if (RISK_ORDER[stepRisk] < RISK_ORDER[rule.minRiskLevel]) continue;

    result.matchedRules.push(rule);

    switch (rule.action) {
      case 'block':
        result.allowed = false;
        result.blockReasons.push(`${rule.name}: ${rule.description}`);
        break;
      case 'require-approval':
        result.requiresApproval = true;
        break;
      case 'warn':
        result.warnings.push(`${rule.name}: ${rule.description}`);
        break;
      case 'allow':
        // No additional action needed
        break;
    }
  }

  return result;
}

export { PolicyRule as Policy };
