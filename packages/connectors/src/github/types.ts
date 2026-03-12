/**
 * Input and output types for GitHub connector actions.
 *
 * @packageDocumentation
 */

// ── Get Issue ──────────────────────────────────────────────────────────────

/** Input for the `github.get_issue` action. */
export interface GitHubGetIssueInput {
  /** Repository owner (user or organisation). */
  owner: string;
  /** Repository name. */
  repo: string;
  /** Issue number. */
  issueNumber: number;
}

/** Output returned by the `github.get_issue` action. */
export interface GitHubGetIssueOutput {
  /** Issue number. */
  number: number;
  /** Issue title. */
  title: string;
  /** Issue body / description. */
  body: string;
  /** Current state of the issue. */
  state: 'open' | 'closed';
  /** Labels attached to the issue. */
  labels: string[];
  /** Login of the user who opened the issue. */
  author: string;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
}

// ── Create Branch ──────────────────────────────────────────────────────────

/** Input for the `github.create_branch` action. */
export interface GitHubCreateBranchInput {
  /** Repository owner. */
  owner: string;
  /** Repository name. */
  repo: string;
  /** Name of the new branch. */
  branchName: string;
  /** SHA or branch name to branch from (defaults to `main`). */
  baseSha?: string;
}

/** Output returned by the `github.create_branch` action. */
export interface GitHubCreateBranchOutput {
  /** Fully-qualified ref (e.g. `refs/heads/feat/foo`). */
  ref: string;
  /** SHA the new branch points at. */
  sha: string;
}

// ── Create Pull Request ────────────────────────────────────────────────────

/** Input for the `github.create_pull_request` action. */
export interface GitHubCreatePRInput {
  /** Repository owner. */
  owner: string;
  /** Repository name. */
  repo: string;
  /** PR title. */
  title: string;
  /** Head branch containing the changes. */
  head: string;
  /** Base branch to merge into (defaults to `main`). */
  base?: string;
  /** PR body / description. */
  body?: string;
}

/** Output returned by the `github.create_pull_request` action. */
export interface GitHubCreatePROutput {
  /** Pull request number. */
  number: number;
  /** PR title. */
  title: string;
  /** Head branch. */
  head: string;
  /** Base branch. */
  base: string;
  /** Current state. */
  state: 'open' | 'closed' | 'merged';
  /** Whether the PR is a draft. */
  draft: boolean;
  /** URL of the pull request. */
  url: string;
}

// ── Close Issue ────────────────────────────────────────────────────────────

/** Input for the `github.close_issue` action. */
export interface GitHubCloseIssueInput {
  /** Repository owner. */
  owner: string;
  /** Repository name. */
  repo: string;
  /** Issue number to close. */
  issueNumber: number;
  /** Comment to add before closing. */
  comment: string;
}

/** Output returned by the `github.close_issue` action. */
export interface GitHubCloseIssueOutput {
  /** Issue number that was closed. */
  number: number;
  /** New state (always `closed`). */
  state: 'closed';
  /** The comment that was added. */
  commentBody: string;
  /** ID of the comment that was added. */
  commentId: number;
}
