/**
 * Risk classification for workflow actions.
 * Determines approval requirements and audit verbosity.
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Categories of side effects an action may produce.
 */
export type EffectCategory =
  | 'read-only'
  | 'write'
  | 'external-communication'
  | 'money-movement'
  | 'deletion'
  | 'access-change'
  | 'provisioning';

/**
 * Execution context passed to every action invocation.
 */
export interface ActionContext {
  /** Authenticated user ID */
  userId: string;
  /** Workspace / tenant scope */
  workspaceId: string;
  /** Correlation ID for the overall request */
  requestId: string;
  /** When true the action must NOT perform side effects */
  dryRun: boolean;
  /** Idempotency key to prevent duplicate execution */
  idempotencyKey: string;
  /** ISO-8601 timestamp of when the context was created */
  timestamp: string;
  /** Optional organization scope */
  orgId?: string;
  /** Optional metadata bag */
  metadata?: Record<string, unknown>;
}

/**
 * Describes how to reverse a completed action.
 */
export interface Compensation {
  /** The action key to invoke for rollback */
  action: string;
  /** Opaque payload the compensating action needs */
  payload: unknown;
}

/**
 * Unified result envelope for preview, execute, and compensate calls.
 */
export interface ActionResult<T = unknown> {
  /** Whether the operation succeeded */
  ok: boolean;
  /** Human-readable description of what happened or will happen */
  summary?: string;
  /** Preview data (populated during dry-run / preview) */
  preview?: unknown;
  /** Actual output data (populated after execution) */
  output?: T;
  /** Compensation recipe for rollback */
  compensation?: Compensation;
  /** Error details if ok === false */
  error?: string;
}

/**
 * A single step inside a workflow.
 */
export interface WorkflowStep {
  /** Unique step ID within the workflow */
  id: string;
  /** Action plugin key to invoke */
  action: string;
  /** Input payload for the action */
  input: unknown;
  /** Whether this step requires explicit human approval before execution */
  requiresApproval: boolean;
  /** Effect categories for risk assessment */
  effects?: EffectCategory[];
  /** Optional human-readable label */
  label?: string;
  /** Step dependencies (IDs of steps that must complete first) */
  dependsOn?: string[];
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Timeout in milliseconds */
  timeoutMs?: number;
}

/**
 * The core workflow specification — a compiled plan of action.
 */
export interface WorkflowSpec {
  /** Unique workflow ID */
  id: string;
  /** Human-readable title */
  title: string;
  /** Optional description */
  description?: string;
  /** Ordered list of steps */
  steps: WorkflowStep[];
  /** Who created this workflow */
  createdBy?: string;
  /** ISO-8601 creation timestamp */
  createdAt?: string;
  /** Tags for categorization */
  tags?: string[];
  /** Version for template evolution */
  version?: string;
}

/**
 * Status of a workflow run.
 */
export type WorkflowRunStatus =
  | 'pending'
  | 'running'
  | 'waiting-approval'
  | 'completed'
  | 'failed'
  | 'rolled-back'
  | 'cancelled';

/**
 * Status of an individual step execution.
 */
export type StepRunStatus =
  | 'pending'
  | 'previewing'
  | 'waiting-approval'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'compensated'
  | 'skipped';

/**
 * Record of a single step's execution.
 */
export interface WorkflowStepRun {
  stepId: string;
  action: string;
  status: StepRunStatus;
  preview?: unknown;
  output?: unknown;
  compensation?: Compensation;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  retryCount: number;
}

/**
 * Record of a complete workflow execution.
 */
export interface WorkflowRun {
  /** Unique run ID */
  id: string;
  /** Reference to the workflow spec */
  workflowId: string;
  /** Current status */
  status: WorkflowRunStatus;
  /** Per-step execution records */
  stepRuns: WorkflowStepRun[];
  /** When the run started */
  startedAt: string;
  /** When the run completed (success or failure) */
  completedAt?: string;
  /** The context used for this run */
  context: ActionContext;
}

/**
 * Audit event emitted for every significant action during workflow execution.
 */
export interface AuditEvent {
  /** Unique event ID */
  id: string;
  /** ISO-8601 timestamp */
  timestamp: string;
  /** Event type */
  type:
    | 'workflow.started'
    | 'step.preview'
    | 'step.approval.requested'
    | 'step.approval.granted'
    | 'step.approval.denied'
    | 'step.executed'
    | 'step.failed'
    | 'step.compensated'
    | 'workflow.completed'
    | 'workflow.failed'
    | 'workflow.rolled-back';
  /** Correlation IDs */
  workflowRunId: string;
  stepId?: string;
  /** Actor who caused the event */
  actorId: string;
  /** Event-specific data */
  data?: unknown;
}

/**
 * Approval request presented to a human gatekeeper.
 */
export interface ApprovalRequest {
  /** Unique approval request ID */
  id: string;
  /** The workflow run requesting approval */
  workflowRunId: string;
  /** The step that needs approval */
  stepId: string;
  /** Action key */
  action: string;
  /** Preview data to show the approver */
  preview: unknown;
  /** Risk level */
  riskLevel: RiskLevel;
  /** Effect categories */
  effects: EffectCategory[];
  /** Who is asked to approve */
  requestedOf: string;
  /** Current approval status */
  status: 'pending' | 'approved' | 'denied';
  /** ISO-8601 timestamp */
  requestedAt: string;
  /** When a decision was made */
  decidedAt?: string;
  /** Optional reason for the decision */
  reason?: string;
}

/**
 * A reusable workflow template stored in the template library.
 */
export interface WorkflowTemplate {
  /** Template ID */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description */
  description: string;
  /** The workflow spec (with parameterized inputs) */
  spec: WorkflowSpec;
  /** Template category */
  category: string;
  /** Tags */
  tags: string[];
  /** Author */
  createdBy: string;
  /** ISO-8601 creation date */
  createdAt: string;
  /** Visibility scope */
  scope: 'personal' | 'team' | 'org' | 'marketplace';
  /** Version string */
  version: string;
}

/**
 * Memory item for context persistence across sessions.
 */
export interface MemoryItem {
  /** Unique ID */
  id: string;
  /** Memory scope */
  scope: 'personal' | 'org' | 'project' | 'session';
  /** Owner (user or org ID) */
  ownerId: string;
  /** Content key */
  key: string;
  /** Content value */
  value: unknown;
  /** ISO-8601 timestamp */
  createdAt: string;
  /** ISO-8601 timestamp */
  updatedAt: string;
  /** TTL in seconds (null = permanent) */
  ttlSeconds?: number | null;
}
