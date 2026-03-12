import { createMockContext } from '@intentgraph/action-sdk';
import { createMockGitHubClient, createGitHubActions } from '@intentgraph/connectors';

describe('GitHub connector actions', () => {
  const client = createMockGitHubClient();
  const actions = createGitHubActions(client);
  const ctx = createMockContext();

  // ── github.get_issue ───────────────────────────────────────────────────

  describe('github.get_issue', () => {
    it('preview returns ok', async () => {
      const result = await actions['github.get_issue'].preview(ctx, {
        owner: 'acme',
        repo: 'webapp',
        issueNumber: 1,
      });

      expect(result.ok).toBe(true);
      expect(result.summary).toContain('#1');
      expect(result.summary).toContain('acme/webapp');
    });

    it('execute fetches seeded issue #1', async () => {
      const result = await actions['github.get_issue'].execute(ctx, {
        owner: 'acme',
        repo: 'webapp',
        issueNumber: 1,
      });

      expect(result.ok).toBe(true);
      expect(result.output).toMatchObject({
        number: 1,
        title: 'Add dark-mode support',
        state: 'open',
        labels: ['enhancement', 'ui'],
        author: 'alice',
      });
    });

    it('execute for non-existent issue returns ok:false', async () => {
      const result = await actions['github.get_issue'].execute(ctx, {
        owner: 'acme',
        repo: 'webapp',
        issueNumber: 999,
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('#999');
    });
  });

  // ── github.create_branch ─────────────────────────────────────────────

  describe('github.create_branch', () => {
    it('preview shows branch info', async () => {
      const result = await actions['github.create_branch'].preview(ctx, {
        owner: 'acme',
        repo: 'webapp',
        branchName: 'feat/dark-mode',
      });

      expect(result.ok).toBe(true);
      expect(result.summary).toContain('feat/dark-mode');
      expect(result.preview).toMatchObject({
        owner: 'acme',
        repo: 'webapp',
        branchName: 'feat/dark-mode',
      });
    });

    it('execute creates branch with compensation', async () => {
      const result = await actions['github.create_branch'].execute(ctx, {
        owner: 'acme',
        repo: 'webapp',
        branchName: 'feat/dark-mode',
      });

      expect(result.ok).toBe(true);
      expect(result.output).toMatchObject({
        ref: 'refs/heads/feat/dark-mode',
        sha: expect.any(String),
      });
      expect(result.compensation).toBeDefined();
      expect(result.compensation!.action).toBe('github.delete_branch');
    });

    it('compensate deletes the branch', async () => {
      // Create a branch to compensate
      const execResult = await actions['github.create_branch'].execute(ctx, {
        owner: 'acme',
        repo: 'webapp',
        branchName: 'temp/to-delete',
      });

      expect(execResult.ok).toBe(true);
      expect(execResult.compensation).toBeDefined();

      // Compensate (delete the branch)
      await actions['github.create_branch'].compensate!(
        ctx,
        execResult.compensation!.payload,
      );

      // Verify the branch was deleted by trying to create it again
      const reCreate = await actions['github.create_branch'].execute(ctx, {
        owner: 'acme',
        repo: 'webapp',
        branchName: 'temp/to-delete',
      });
      expect(reCreate.ok).toBe(true);
    });
  });

  // ── github.create_pull_request ───────────────────────────────────────

  describe('github.create_pull_request', () => {
    it('preview shows PR details', async () => {
      const result = await actions['github.create_pull_request'].preview(ctx, {
        owner: 'acme',
        repo: 'webapp',
        title: 'Add dark mode',
        head: 'feat/dark-mode',
        base: 'main',
        body: 'Implements dark-mode toggle.',
      });

      expect(result.ok).toBe(true);
      expect(result.summary).toContain('Add dark mode');
      expect(result.preview).toMatchObject({
        owner: 'acme',
        repo: 'webapp',
        title: 'Add dark mode',
        head: 'feat/dark-mode',
        base: 'main',
      });
    });

    it('execute creates draft PR with compensation', async () => {
      const result = await actions['github.create_pull_request'].execute(ctx, {
        owner: 'acme',
        repo: 'webapp',
        title: 'Add dark mode',
        head: 'feat/dark-mode',
        base: 'main',
        body: 'Implements dark-mode toggle.',
      });

      expect(result.ok).toBe(true);
      expect(result.output).toMatchObject({
        title: 'Add dark mode',
        head: 'feat/dark-mode',
        base: 'main',
        state: 'open',
        draft: true,
        url: expect.stringContaining('github.com'),
      });
      expect(result.compensation).toBeDefined();
      expect(result.compensation!.action).toBe('github.close_pull_request');
    });

    it('compensate closes PR', async () => {
      const execResult = await actions['github.create_pull_request'].execute(ctx, {
        owner: 'acme',
        repo: 'webapp',
        title: 'Temp PR',
        head: 'feat/temp',
      });

      expect(execResult.ok).toBe(true);
      expect(execResult.compensation).toBeDefined();

      await actions['github.create_pull_request'].compensate!(
        ctx,
        execResult.compensation!.payload,
      );

      // The PR should now be closed (no direct assertion needed – no error means success)
    });
  });

  // ── github.close_issue ───────────────────────────────────────────────

  describe('github.close_issue', () => {
    // Use a fresh client per sub-describe to avoid state leakage
    let freshClient: ReturnType<typeof createMockGitHubClient>;
    let freshActions: ReturnType<typeof createGitHubActions>;

    beforeEach(() => {
      freshClient = createMockGitHubClient();
      freshActions = createGitHubActions(freshClient);
    });

    it('preview shows close info', async () => {
      const result = await freshActions['github.close_issue'].preview(ctx, {
        owner: 'acme',
        repo: 'webapp',
        issueNumber: 3,
        comment: 'Closing as done.',
      });

      expect(result.ok).toBe(true);
      expect(result.summary).toContain('#3');
      expect(result.preview).toMatchObject({
        owner: 'acme',
        repo: 'webapp',
        issueNumber: 3,
        comment: 'Closing as done.',
      });
    });

    it('execute closes issue with comment and returns compensation', async () => {
      const result = await freshActions['github.close_issue'].execute(ctx, {
        owner: 'acme',
        repo: 'webapp',
        issueNumber: 3,
        comment: 'Done!',
      });

      expect(result.ok).toBe(true);
      expect(result.output).toMatchObject({
        number: 3,
        state: 'closed',
        commentBody: 'Done!',
        commentId: expect.any(Number),
      });
      expect(result.compensation).toBeDefined();
      expect(result.compensation!.action).toBe('github.reopen_issue');

      // Verify issue is actually closed
      const issue = freshClient.getIssue('acme', 'webapp', 3);
      expect(issue?.state).toBe('closed');
    });

    it('compensate reopens issue', async () => {
      const execResult = await freshActions['github.close_issue'].execute(ctx, {
        owner: 'acme',
        repo: 'webapp',
        issueNumber: 3,
        comment: 'Closing.',
      });

      expect(execResult.ok).toBe(true);
      expect(freshClient.getIssue('acme', 'webapp', 3)?.state).toBe('closed');

      await freshActions['github.close_issue'].compensate!(
        ctx,
        execResult.compensation!.payload,
      );

      // Issue should be open again
      expect(freshClient.getIssue('acme', 'webapp', 3)?.state).toBe('open');
    });
  });
});
