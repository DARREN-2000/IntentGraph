/**
 * GitHub action plugins built with {@link defineAction}.
 *
 * Use {@link createGitHubActions} to obtain a record of action plugins that
 * are pre-wired to a {@link MockGitHubClient}.
 *
 * @packageDocumentation
 */

import { defineAction } from '@intentgraph/action-sdk';
import type { ActionPlugin } from '@intentgraph/action-sdk';

import type { MockGitHubClient } from './mock-client';
import type {
  GitHubGetIssueInput,
  GitHubGetIssueOutput,
  GitHubCreateBranchInput,
  GitHubCreateBranchOutput,
  GitHubCreatePRInput,
  GitHubCreatePROutput,
  GitHubCloseIssueInput,
  GitHubCloseIssueOutput,
} from './types';

// ── Public record type ─────────────────────────────────────────────────────

/** Record of all GitHub action plugins keyed by action key. */
export interface GitHubActions {
  'github.get_issue': ActionPlugin<GitHubGetIssueInput, GitHubGetIssueOutput>;
  'github.create_branch': ActionPlugin<GitHubCreateBranchInput, GitHubCreateBranchOutput>;
  'github.create_pull_request': ActionPlugin<GitHubCreatePRInput, GitHubCreatePROutput>;
  'github.close_issue': ActionPlugin<GitHubCloseIssueInput, GitHubCloseIssueOutput>;
}

// ── Factory ────────────────────────────────────────────────────────────────

/**
 * Create a full set of GitHub action plugins backed by the given mock client.
 *
 * The client is captured via closure so every action produced by a single call
 * shares the same in-memory state.
 *
 * @param client - A {@link MockGitHubClient} instance (see {@link createMockGitHubClient}).
 * @returns A {@link GitHubActions} record keyed by action key.
 */
export function createGitHubActions(client: MockGitHubClient): GitHubActions {
  // ── github.get_issue ─────────────────────────────────────────────────

  const getIssue = defineAction<GitHubGetIssueInput, GitHubGetIssueOutput>({
    key: 'github.get_issue',
    risk: 'low',
    effects: ['read-only'],
    description: 'Fetch a single GitHub issue by number.',

    async preview(_ctx, input) {
      return {
        ok: true,
        summary: `Will fetch issue #${input.issueNumber} from ${input.owner}/${input.repo}.`,
        preview: {
          owner: input.owner,
          repo: input.repo,
          issueNumber: input.issueNumber,
        },
      };
    },

    async execute(_ctx, input) {
      const issue = client.getIssue(input.owner, input.repo, input.issueNumber);
      if (!issue) {
        return {
          ok: false,
          error: `Issue #${input.issueNumber} not found in ${input.owner}/${input.repo}.`,
        };
      }
      return {
        ok: true,
        summary: `Fetched issue #${issue.number}: "${issue.title}".`,
        output: {
          number: issue.number,
          title: issue.title,
          body: issue.body,
          state: issue.state,
          labels: issue.labels,
          author: issue.author,
          createdAt: issue.createdAt,
        },
      };
    },
    // No compensate – read-only action
  });

  // ── github.create_branch ─────────────────────────────────────────────

  const createBranch = defineAction<GitHubCreateBranchInput, GitHubCreateBranchOutput>({
    key: 'github.create_branch',
    risk: 'low',
    effects: ['write'],
    description: 'Create a new git branch in a GitHub repository.',

    async preview(_ctx, input) {
      const base = input.baseSha ?? 'main';
      return {
        ok: true,
        summary: `Will create branch "${input.branchName}" from ${base} in ${input.owner}/${input.repo}.`,
        preview: {
          owner: input.owner,
          repo: input.repo,
          branchName: input.branchName,
          base,
        },
      };
    },

    async execute(_ctx, input) {
      const branch = client.createBranch(
        input.owner,
        input.repo,
        input.branchName,
        input.baseSha,
      );
      return {
        ok: true,
        summary: `Created branch "${input.branchName}" (${branch.sha}).`,
        output: { ref: branch.ref, sha: branch.sha },
        compensation: {
          action: 'github.delete_branch',
          payload: {
            owner: input.owner,
            repo: input.repo,
            branchName: input.branchName,
          },
        },
      };
    },

    async compensate(_ctx, payload) {
      const { owner, repo, branchName } = payload as {
        owner: string;
        repo: string;
        branchName: string;
      };
      client.deleteBranch(owner, repo, branchName);
    },
  });

  // ── github.create_pull_request ───────────────────────────────────────

  const createPullRequest = defineAction<GitHubCreatePRInput, GitHubCreatePROutput>({
    key: 'github.create_pull_request',
    risk: 'medium',
    effects: ['write', 'external-communication'],
    description: 'Create a draft pull request in a GitHub repository.',

    async preview(_ctx, input) {
      const base = input.base ?? 'main';
      return {
        ok: true,
        summary: `Will create draft PR "${input.title}" (${input.head} → ${base}) in ${input.owner}/${input.repo}.`,
        preview: {
          owner: input.owner,
          repo: input.repo,
          title: input.title,
          head: input.head,
          base,
          body: input.body ?? '',
        },
      };
    },

    async execute(_ctx, input) {
      const base = input.base ?? 'main';
      const pr = client.createPullRequest(
        input.owner,
        input.repo,
        input.title,
        input.head,
        base,
        input.body ?? '',
      );
      return {
        ok: true,
        summary: `Created draft PR #${pr.number}: "${pr.title}".`,
        output: {
          number: pr.number,
          title: pr.title,
          head: pr.head,
          base: pr.base,
          state: pr.state,
          draft: pr.draft,
          url: pr.url,
        },
        compensation: {
          action: 'github.close_pull_request',
          payload: {
            owner: input.owner,
            repo: input.repo,
            prNumber: pr.number,
          },
        },
      };
    },

    async compensate(_ctx, payload) {
      const { owner, repo, prNumber } = payload as {
        owner: string;
        repo: string;
        prNumber: number;
      };
      client.closePullRequest(owner, repo, prNumber);
    },
  });

  // ── github.close_issue ───────────────────────────────────────────────

  const closeIssue = defineAction<GitHubCloseIssueInput, GitHubCloseIssueOutput>({
    key: 'github.close_issue',
    risk: 'medium',
    effects: ['write'],
    description: 'Close a GitHub issue with a comment.',

    async preview(_ctx, input) {
      return {
        ok: true,
        summary: `Will close issue #${input.issueNumber} in ${input.owner}/${input.repo} with comment.`,
        preview: {
          owner: input.owner,
          repo: input.repo,
          issueNumber: input.issueNumber,
          comment: input.comment,
        },
      };
    },

    async execute(_ctx, input) {
      const commentId = client.closeIssue(
        input.owner,
        input.repo,
        input.issueNumber,
        input.comment,
      );
      if (commentId === undefined) {
        return {
          ok: false,
          error: `Issue #${input.issueNumber} not found in ${input.owner}/${input.repo}.`,
        };
      }
      return {
        ok: true,
        summary: `Closed issue #${input.issueNumber} with comment.`,
        output: {
          number: input.issueNumber,
          state: 'closed' as const,
          commentBody: input.comment,
          commentId,
        },
        compensation: {
          action: 'github.reopen_issue',
          payload: {
            owner: input.owner,
            repo: input.repo,
            issueNumber: input.issueNumber,
          },
        },
      };
    },

    async compensate(_ctx, payload) {
      const { owner, repo, issueNumber } = payload as {
        owner: string;
        repo: string;
        issueNumber: number;
      };
      client.reopenIssue(owner, repo, issueNumber);
    },
  });

  // ── Assemble record ──────────────────────────────────────────────────

  return {
    'github.get_issue': getIssue,
    'github.create_branch': createBranch,
    'github.create_pull_request': createPullRequest,
    'github.close_issue': closeIssue,
  };
}
