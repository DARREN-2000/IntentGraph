import { createMockContext } from '@intentgraph/action-sdk';
import type { WorkflowSpec, AuditEvent } from '@intentgraph/workflow-spec';
import { runWorkflow } from '@intentgraph/workflow-spec';
import { checkPolicy } from '@intentgraph/policy';
import type { ActionPlugin } from '@intentgraph/action-sdk';
import {
  createMockGitHubClient,
  createGitHubActions,
  type GitHubCreatePROutput,
} from '@intentgraph/connectors';

// ── Helpers ────────────────────────────────────────────────────────────────

function buildWorkflowSpec(closeComment: string): WorkflowSpec {
  return {
    id: 'wf-github-issue-to-pr',
    title: 'GitHub Issue → Branch → PR → Close',
    description: 'Resolve a GitHub issue end-to-end.',
    steps: [
      {
        id: 'read-issue',
        action: 'github.get_issue',
        label: 'Read issue #2',
        input: { owner: 'acme', repo: 'webapp', issueNumber: 2 },
        requiresApproval: false,
        effects: ['read-only'],
      },
      {
        id: 'create-branch',
        action: 'github.create_branch',
        label: 'Create fix branch',
        input: { owner: 'acme', repo: 'webapp', branchName: 'fix/login-redirect' },
        requiresApproval: false,
        effects: ['write'],
      },
      {
        id: 'create-pr',
        action: 'github.create_pull_request',
        label: 'Open draft PR',
        input: {
          owner: 'acme',
          repo: 'webapp',
          title: 'Fix: resolve login redirect loop',
          head: 'fix/login-redirect',
          base: 'main',
          body: 'Resolves #2 – breaks the redirect cycle in SSO callback.',
        },
        requiresApproval: true,
        effects: ['write', 'external-communication'],
      },
      {
        id: 'close-issue',
        action: 'github.close_issue',
        label: 'Close the issue',
        input: {
          owner: 'acme',
          repo: 'webapp',
          issueNumber: 2,
          comment: closeComment,
        },
        requiresApproval: true,
        effects: ['write'],
      },
    ],
    createdBy: 'test-user',
    tags: ['github', 'bug-fix'],
    version: '1',
  };
}

type AuditEventPartial = Omit<AuditEvent, 'id' | 'timestamp'>;

function collectAuditEvents() {
  const events: AuditEventPartial[] = [];
  const emitter = (e: AuditEventPartial) => events.push(e);
  return { events, emitter };
}

// ── Test suite ─────────────────────────────────────────────────────────────

describe('End-to-end: GitHub Issue → Branch → PR → Close', () => {
  function createRegistry() {
    const client = createMockGitHubClient();
    const actions = createGitHubActions(client);
    const registry: Record<string, ActionPlugin<any, any>> = { ...actions };
    return { client, registry };
  }

  describe('happy path – all steps approved', () => {
    it('runs the full workflow and emits expected audit events', async () => {
      const { client, registry } = createRegistry();
      const ctx = createMockContext();
      const { events, emitter } = collectAuditEvents();

      const spec = buildWorkflowSpec('Fixed in PR (see linked PR)');

      const run = await runWorkflow(spec, ctx, registry, {
        approve: async () => true,
        onAuditEvent: emitter,
      });

      // ── Overall status ──────────────────────────────────────────────
      expect(run.status).toBe('completed');
      expect(run.stepRuns).toHaveLength(4);
      expect(run.stepRuns.every((sr) => sr.status === 'completed')).toBe(true);

      // ── PR was created ──────────────────────────────────────────────
      const prStep = run.stepRuns.find((sr) => sr.action === 'github.create_pull_request');
      expect(prStep).toBeDefined();
      const prOutput = prStep!.output as GitHubCreatePROutput;
      expect(prOutput.state).toBe('open');
      expect(prOutput.draft).toBe(true);
      expect(prOutput.title).toBe('Fix: resolve login redirect loop');

      // ── Issue was closed ────────────────────────────────────────────
      const issue = client.getIssue('acme', 'webapp', 2);
      expect(issue?.state).toBe('closed');

      // ── Audit events ────────────────────────────────────────────────
      const eventTypes = events.map((e) => e.type);

      expect(eventTypes).toContain('workflow.started');
      expect(eventTypes).toContain('workflow.completed');

      // 4 previews
      expect(eventTypes.filter((t) => t === 'step.preview')).toHaveLength(4);

      // 2 approval requests (steps 3 & 4)
      expect(eventTypes.filter((t) => t === 'step.approval.requested')).toHaveLength(2);

      // 2 approvals granted
      expect(eventTypes.filter((t) => t === 'step.approval.granted')).toHaveLength(2);

      // 4 executions
      expect(eventTypes.filter((t) => t === 'step.executed')).toHaveLength(4);
    });
  });

  describe('rollback – PR approval denied', () => {
    it('compensates completed steps when approval is denied', async () => {
      const { registry } = createRegistry();
      const ctx = createMockContext();
      const { events, emitter } = collectAuditEvents();

      const spec = buildWorkflowSpec('Fixed in PR');

      // Deny approval on step 3 (create-pr)
      const run = await runWorkflow(spec, ctx, registry, {
        approve: async (step) => step.id !== 'create-pr',
        onAuditEvent: emitter,
      });

      // ── Workflow rolled back ────────────────────────────────────────
      expect(run.status).toBe('rolled-back');

      // ── Step 1 (read-only) should not be compensated ────────────────
      const readStep = run.stepRuns.find((sr) => sr.stepId === 'read-issue');
      expect(readStep).toBeDefined();
      // Read-only action has no compensate method, so status stays 'completed'
      expect(readStep!.status).toBe('completed');

      // ── Step 2 (branch creation) should be compensated ──────────────
      const branchStep = run.stepRuns.find((sr) => sr.stepId === 'create-branch');
      expect(branchStep).toBeDefined();
      expect(branchStep!.status).toBe('compensated');

      // ── Audit trail includes compensation events ────────────────────
      const eventTypes = events.map((e) => e.type);
      expect(eventTypes).toContain('step.compensated');
      expect(eventTypes).toContain('step.approval.denied');
      expect(eventTypes).toContain('workflow.rolled-back');
    });
  });

  describe('policy checks', () => {
    const spec = buildWorkflowSpec('Fixed');

    it('allows read-only step without approval', () => {
      const step = spec.steps[0]; // github.get_issue
      const result = checkPolicy(step, 'low', ['read-only']);

      expect(result.allowed).toBe(true);
      expect(result.requiresApproval).toBe(false);
    });

    it('allows low-risk write without extra approval', () => {
      const step = spec.steps[1]; // github.create_branch
      const result = checkPolicy(step, 'low', ['write']);

      expect(result.allowed).toBe(true);
      // Step itself doesn't require approval and low-risk write is not flagged
      expect(result.requiresApproval).toBe(false);
    });

    it('requires approval for medium-risk external-communication', () => {
      const step = spec.steps[2]; // github.create_pull_request
      const result = checkPolicy(step, 'medium', ['write', 'external-communication']);

      expect(result.allowed).toBe(true);
      expect(result.requiresApproval).toBe(true);
      expect(result.matchedRules.some((r) => r.id === 'approve-external-comms')).toBe(true);
    });

    it('respects step-level requiresApproval for medium-risk write', () => {
      const step = spec.steps[3]; // github.close_issue
      const result = checkPolicy(step, 'medium', ['write']);

      expect(result.allowed).toBe(true);
      // Step has requiresApproval: true set directly
      expect(result.requiresApproval).toBe(true);
    });
  });
});
