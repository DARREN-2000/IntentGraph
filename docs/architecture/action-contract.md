# Why Action Plugins Require Preview/Execute/Compensate

**Status:** Accepted  
**Authors:** IntentGraph Core Team  
**Last Updated:** 2025-07-14

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [The Three-Phase Contract](#the-three-phase-contract)
3. [Tradeoffs & Alternatives Considered](#tradeoffs--alternatives-considered)
4. [How It Works in Practice](#how-it-works-in-practice)
5. [Risk Classification](#risk-classification)
6. [Audit Trail Integration](#audit-trail-integration)
7. [Summary](#summary)

---

## Problem Statement

IntentGraph compiles natural-language intent into multi-step workflows that touch
external systems — GitHub, Slack, Gmail, cloud providers, payment processors.
A naive "just call the API" approach fails in this context for several reasons:

### Partial Failures

A workflow might create a branch (step 1), open a PR (step 2), and close an
issue (step 3). If step 3 fails, the branch and PR are orphaned. Without a
structured rollback mechanism, every failure leaves behind debris that operators
must clean up manually.

### User Trust

LLM-driven systems are probabilistic. Users will not trust a system that silently
fires API calls based on model output. They need to see what will happen before
it happens — a preview/dry-run step that produces zero side effects. Without this,
adoption stalls at the first destructive action.

### Compliance & Auditability

Regulated environments require proof of what was done, when, and by whom. A
fire-and-forget API call provides none of this. Every phase of execution must
emit structured audit events that can be queried, replayed, and audited.

### Approval Gating

Some actions — deleting resources, moving money, sending external communications —
must not proceed without explicit human approval. The system needs a point in the
execution flow where it can pause, present a preview, and wait for a decision.

### Rollback

When a multi-step workflow fails midway, the system must compensate for
previously completed steps. This is not a theoretical concern — it is the
default case in distributed systems. The plugin contract must force authors to
think about reversibility at design time, not as an afterthought.

---

## The Three-Phase Contract

Every action plugin in IntentGraph implements the `ActionPlugin` interface
defined in `packages/workflow-spec/src/runtime.ts`:

```typescript
export interface ActionPlugin<I = unknown, O = unknown> {
  key: string;                    // e.g. "github.create_branch"
  risk: RiskLevel;                // "low" | "medium" | "high" | "critical"
  effects: EffectCategory[];      // what kind of side effects
  description: string;            // human-readable description

  preview(ctx: ActionContext, input: I): Promise<ActionResult<O>>;
  execute(ctx: ActionContext, input: I): Promise<ActionResult<O>>;
  compensate?(ctx: ActionContext, payload: unknown): Promise<void>;
}
```

### Phase 1: `preview()`

**Contract:** Must produce NO side effects. The `ctx.dryRun` flag is set to
`true` by the runtime.

Preview serves multiple purposes:

- **Informed consent.** The user sees exactly what the action will do before
  approving. For example, a `github.create_pull_request` preview returns the
  title, body, base branch, and head branch — but does not create the PR.

- **Approval UIs.** The preview data is presented to human approvers. The
  `ApprovalRequest` type in `packages/workflow-spec/src/types.ts` carries the
  preview alongside the risk level and effect categories so approvers can make
  informed decisions.

- **Risk assessment.** The policy engine (see [Risk Classification](#risk-classification))
  evaluates the step's risk and effects after preview to decide whether to
  require approval, warn, or block.

- **Dry-run mode.** Entire workflows can be previewed end-to-end without
  executing anything, by stopping after the preview phase for each step.

Preview returns an `ActionResult` with the `preview` field populated:

```typescript
// From packages/connectors/src/github/actions.ts — create_branch preview
async preview(ctx, input) {
  return {
    ok: true,
    summary: `Will create branch '${input.branchName}' from '${input.baseBranch}'`,
    preview: {
      owner: input.owner,
      repo: input.repo,
      branchName: input.branchName,
      baseBranch: input.baseBranch,
    },
  };
}
```

### Phase 2: `execute()`

**Contract:** Performs the action and returns a compensation recipe. The
`ctx.dryRun` flag is `false`.

The key design decision here is the **compensation recipe**. When `execute()`
succeeds, it returns an `ActionResult` with a `compensation` field:

```typescript
export interface Compensation {
  action: string;     // the action key to invoke for rollback
  payload: unknown;   // opaque data the compensating action needs
}
```

The compensation recipe is **opaque to the runtime**. Only the plugin knows what
data is needed to reverse itself. This keeps the runtime generic — it does not
need to understand the semantics of any particular action.

Example from `github.create_branch`:

```typescript
async execute(ctx, input) {
  const branch = await client.createBranch(input.owner, input.repo, ...);
  return {
    ok: true,
    output: branch,
    compensation: {
      action: 'github.delete_branch',
      payload: { owner: input.owner, repo: input.repo, branch: input.branchName },
    },
  };
}
```

After execution, the runtime stores the compensation recipe alongside the step
run record in `WorkflowStepRun.compensation`. If any later step fails, the
runtime uses these stored recipes to roll back.

### Phase 3: `compensate()`

**Contract:** Best-effort rollback. Receives the opaque payload from the
compensation recipe.

Not all actions are perfectly reversible:

- You can delete a branch that was created. ✅
- You can close a PR that was opened. ✅
- You **cannot** unsend an email. ❌
- You **cannot** un-charge a credit card (but you can issue a refund). ⚠️

The contract forces plugin authors to **think about reversibility at design
time**. Even when perfect reversal is impossible, the `compensate()` method
documents what the best-effort rollback looks like.

`compensate` is optional on the interface (`compensate?`), but the plugin
authoring guidelines strongly encourage it. Actions without `compensate` are
treated as terminal — the runtime logs a warning but continues rolling back
other steps.

Example from `github.create_branch`:

```typescript
async compensate(ctx, payload) {
  const { owner, repo, branch } = payload as {
    owner: string;
    repo: string;
    branch: string;
  };
  await client.deleteBranch(owner, repo, branch);
}
```

---

## Tradeoffs & Alternatives Considered

### Why not just use database transactions?

Database transactions (ACID) work within a single database. IntentGraph
workflows span multiple external systems — GitHub, Slack, Gmail, cloud
providers. You cannot wrap a GitHub API call and a Slack API call in a single
database transaction. The systems are heterogeneous, distributed, and do not
share a transaction coordinator.

Even within a single external API, most REST APIs do not support transactional
semantics. You create a resource, get back an ID, and if you need to undo it,
you call a separate delete endpoint. This is exactly what the compensation
pattern models.

**ACID is the right tool for local state.** IntentGraph uses database
transactions for its own internal state (workflow runs, audit events). But the
action contract addresses the cross-system coordination problem that ACID cannot
solve.

### Why not sagas only?

The saga pattern (a sequence of local transactions with compensating
transactions) is the closest established pattern to what IntentGraph does. In
fact, the runtime's rollback mechanism is essentially a saga coordinator.

However, **sagas alone do not give you preview/dry-run**. The saga pattern
assumes you execute forward and compensate on failure. It does not include a
phase where you show the user what will happen and wait for approval before
executing.

Preview is critical for user trust in an LLM-driven system. Users need to see
the plan before it runs. The three-phase contract extends the saga pattern with
a mandatory preview step.

IntentGraph's approach can be described as: **saga pattern + mandatory preview +
policy-driven approval gating**.

### Why not event sourcing?

Event sourcing records every state change as an immutable event, enabling replay
and audit. IntentGraph does use event-sourced audit trails — every phase emits
`AuditEvent` records (see [Audit Trail Integration](#audit-trail-integration)).

However, event sourcing is **complementary, not a replacement** for the
three-phase contract:

- Event sourcing tells you what happened. The preview phase tells you what
  **will** happen.
- Event sourcing enables replay. The compensation phase enables **rollback of
  external state**.
- Event sourcing is a storage pattern. The action contract is an **execution
  pattern**.

IntentGraph uses both: the action contract governs execution, and event sourcing
governs observability.

### Why is `compensate` optional but strongly encouraged?

Making `compensate` required would prevent read-only actions (like
`github.get_issue`) from implementing the interface without a no-op method. It
would also force authors of truly irreversible actions to write meaningless
stub implementations.

Instead, the contract makes `compensate` optional (`compensate?`) and relies on:

1. **Plugin review guidelines** that flag missing `compensate` on write actions.
2. **Policy rules** that can block or require approval for actions without
   compensation.
3. **Runtime warnings** logged when a step without `compensate` needs rollback.

This strikes a balance between safety and pragmatism.

---

## How It Works in Practice

The `runWorkflow()` function in `packages/workflow-spec/src/runtime.ts`
orchestrates the three phases. Here is the simplified flow:

```
for each step in workflow.steps:
  ┌─────────────────────────────────────────────────┐
  │ 1. PREVIEW                                      │
  │    result = plugin.preview({...ctx, dryRun:true})│
  │    emit("step.preview")                         │
  ├─────────────────────────────────────────────────┤
  │ 2. APPROVAL (if step.requiresApproval)          │
  │    emit("step.approval.requested")              │
  │    allowed = await approve(step, preview)        │
  │    if denied → rollback completed steps → return │
  │    emit("step.approval.granted")                │
  ├─────────────────────────────────────────────────┤
  │ 3. EXECUTE (with retry)                         │
  │    result = plugin.execute({...ctx, dryRun:false})│
  │    if failed → rollback completed steps → return │
  │    store compensation recipe                     │
  │    emit("step.executed")                        │
  └─────────────────────────────────────────────────┘

on failure or denial at any step:
  rollback() → iterate completed steps in REVERSE order
    → call plugin.compensate(ctx, compensation.payload)
    → emit("step.compensated") for each
    → emit("workflow.rolled-back")
```

### Key Runtime Behaviors

**Preview always runs first.** The runtime calls `plugin.preview()` with
`ctx.dryRun = true` before checking approval or executing. This ensures the
user always sees what will happen.

**Approval blocks execution.** If `step.requiresApproval` is true, the runtime
invokes the `ApprovalCallback` and waits. If denied, the runtime immediately
triggers rollback of all previously completed steps.

**Retry before rollback.** The runtime supports configurable retries via
`step.maxRetries`. Only after all retries are exhausted does it trigger rollback.

**Reverse-order rollback.** The `rollback()` function iterates completed steps
in reverse order, calling `compensate()` on each. This prevents dependency
issues — if step 2 depends on step 1's output, step 2 is compensated before
step 1.

**Compensation failures don't halt rollback.** If one compensation fails, the
runtime logs the failure and continues compensating remaining steps. This is
best-effort by design.

### Code Reference

The runtime tracks completed steps with their compensation recipes:

```typescript
// From packages/workflow-spec/src/runtime.ts
const completed: Array<{
  plugin: ActionPlugin<any, any>;
  comp?: Compensation;
  stepId: string;
}> = [];

// After successful execution:
completed.push({ plugin, comp: result.compensation, stepId: step.id });
```

And the rollback function uses this list:

```typescript
async function rollback(
  completed: Array<{ plugin: ActionPlugin; comp?: Compensation; stepId: string }>,
  ctx: ActionContext,
  emit: (event: Omit<AuditEvent, 'id' | 'timestamp'>) => void,
  run: WorkflowRun,
): Promise<void> {
  for (const item of [...completed].reverse()) {
    if (item.plugin.compensate && item.comp) {
      await item.plugin.compensate(ctx, item.comp.payload);
      // update step status + emit audit event
    }
  }
}
```

---

## Risk Classification

Every action plugin declares its risk level and effect categories:

```typescript
risk: RiskLevel;              // 'low' | 'medium' | 'high' | 'critical'
effects: EffectCategory[];    // what kind of side effects
```

The seven effect categories defined in `packages/workflow-spec/src/types.ts`:

| Category                  | Description                          | Example                    |
|---------------------------|--------------------------------------|----------------------------|
| `read-only`               | No side effects                      | Fetching an issue          |
| `write`                   | Creates or modifies a resource       | Creating a branch          |
| `external-communication`  | Sends messages to external parties   | Sending an email, opening a PR |
| `money-movement`          | Transfers or charges money           | Processing a payment       |
| `deletion`                | Permanently removes a resource       | Deleting a repository      |
| `access-change`           | Modifies permissions or credentials  | Granting admin access      |
| `provisioning`            | Creates infrastructure or accounts   | Spinning up a server       |

### Policy Engine

The policy engine in `packages/policy/src/index.ts` evaluates steps against
configurable rules. Each `PolicyRule` specifies:

- Which **effect categories** it applies to
- The **minimum risk level** that triggers it
- The **action** to take: `block`, `require-approval`, `warn`, or `allow`

The 8 default rules:

| Rule ID                  | Effects                                         | Min Risk   | Action            |
|--------------------------|------------------------------------------------|------------|--------------------|
| `block-critical-auto`    | deletion, money, access-change, provisioning    | critical   | block              |
| `approve-high-write`     | write, external-comms, deletion, money          | high       | require-approval   |
| `approve-money`          | money-movement                                  | low        | require-approval   |
| `approve-deletion`       | deletion                                        | low        | require-approval   |
| `approve-access-change`  | access-change                                   | low        | require-approval   |
| `approve-external-comms` | external-communication                          | medium     | require-approval   |
| `warn-provisioning`      | provisioning                                    | low        | warn               |
| `allow-read-only`        | read-only                                       | low        | allow              |

The `checkPolicy()` function returns a `PolicyCheckResult`:

```typescript
export interface PolicyCheckResult {
  allowed: boolean;           // false if any rule blocks
  requiresApproval: boolean;  // true if any rule requires approval
  matchedRules: PolicyRule[]; // which rules matched
  warnings: string[];         // warning messages
  blockReasons: string[];     // why the step was blocked
}
```

### How Risk + Effects Flow Through the System

1. **Plugin author** declares `risk` and `effects` on the action.
2. **Planner** includes the action in a `WorkflowStep` with the step's
   `effects` and sets `requiresApproval` based on policy evaluation.
3. **Policy engine** evaluates the step: `checkPolicy(step, risk, effects)`.
4. **Runtime** enforces the decision: if `requiresApproval`, the runtime pauses
   for human approval. If blocked, the step is rejected.
5. **Audit trail** records the policy decision for compliance.

This separation ensures that:
- Plugin authors cannot bypass approval requirements.
- Policy rules are configurable per tenant without changing plugin code.
- The runtime enforces policy uniformly across all actions.

---

## Audit Trail Integration

Every phase of the three-phase contract emits structured `AuditEvent` records.
The 11 event types defined in `packages/workflow-spec/src/types.ts`:

```typescript
type AuditEventType =
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
```

Each event carries:

```typescript
export interface AuditEvent {
  id: string;               // unique event ID
  timestamp: string;        // ISO-8601
  type: AuditEventType;     // one of the 11 types above
  workflowRunId: string;    // correlation ID
  stepId?: string;          // which step (if step-level event)
  actorId: string;          // who caused it
  data?: unknown;           // event-specific payload
}
```

### What Gets Audited

| Phase        | Events Emitted                                                |
|-------------|---------------------------------------------------------------|
| Start       | `workflow.started`                                            |
| Preview     | `step.preview` (with preview data)                            |
| Approval    | `step.approval.requested`, then `.granted` or `.denied`       |
| Execute     | `step.executed` (with output) or `step.failed` (with error)   |
| Compensate  | `step.compensated` for each rolled-back step                  |
| End         | `workflow.completed`, `workflow.failed`, or `workflow.rolled-back` |

### Why This Matters

- **Debuggability.** When a workflow fails, the audit trail shows exactly which
  step failed, what the preview looked like, whether approval was granted, and
  which steps were compensated.
- **Compliance.** Regulated industries require proof that human approval was
  obtained before sensitive actions. The `step.approval.granted` event with
  `actorId` and `timestamp` provides this.
- **Replay.** The audit trail can be used to reconstruct the exact sequence of
  events for incident review or to build workflow templates from successful runs.

---

## Summary

The three-phase action contract — `preview()`, `execute()`, `compensate()` — is
the foundational abstraction in IntentGraph. It exists because:

1. **Agentic workflows are multi-step and cross-system.** Database transactions
   cannot coordinate external API calls.
2. **LLM-driven systems require user trust.** Preview/dry-run is mandatory, not
   optional.
3. **Rollback must be a first-class concern.** The contract forces plugin authors
   to think about reversibility at design time.
4. **Policy enforcement requires a checkpoint.** The approval step between
   preview and execute is where risk assessment happens.
5. **Auditability is non-negotiable.** Every phase emits events for compliance
   and debugging.

The contract is intentionally simple — three methods — but it enables the
entire trust and safety infrastructure of the platform.
