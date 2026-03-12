/**
 * In-memory mock GitHub API client.
 *
 * Simulates core GitHub API calls (issues, branches, pull requests) without
 * making any network requests. Useful for local development, testing, and
 * demo scenarios.
 *
 * @packageDocumentation
 */

// ── Internal data models ───────────────────────────────────────────────────

/** Represents a stored issue in the mock. */
export interface MockIssue {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  author: string;
  createdAt: string;
  comments: MockComment[];
}

/** Represents a comment on a mock issue. */
export interface MockComment {
  id: number;
  body: string;
  author: string;
  createdAt: string;
}

/** Represents a stored branch in the mock. */
export interface MockBranch {
  ref: string;
  sha: string;
}

/** Represents a stored pull request in the mock. */
export interface MockPullRequest {
  number: number;
  title: string;
  head: string;
  base: string;
  body: string;
  state: 'open' | 'closed' | 'merged';
  draft: boolean;
  url: string;
}

// ── MockGitHubClient ───────────────────────────────────────────────────────

/** In-memory mock of the GitHub REST API. */
export interface MockGitHubClient {
  /** Retrieve an issue by owner/repo/number. */
  getIssue(owner: string, repo: string, issueNumber: number): MockIssue | undefined;

  /** Create a new branch. Returns the created branch. */
  createBranch(owner: string, repo: string, branchName: string, baseSha?: string): MockBranch;

  /** Delete a branch. Returns `true` if the branch existed. */
  deleteBranch(owner: string, repo: string, branchName: string): boolean;

  /** Create a pull request. Returns the created PR. */
  createPullRequest(
    owner: string,
    repo: string,
    title: string,
    head: string,
    base: string,
    body: string,
  ): MockPullRequest;

  /** Close a pull request. Returns `true` if the PR existed and was open. */
  closePullRequest(owner: string, repo: string, prNumber: number): boolean;

  /** Close an issue and add a comment. Returns the comment ID or `undefined`. */
  closeIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    comment: string,
  ): number | undefined;

  /** Reopen a previously closed issue. Returns `true` if the issue existed. */
  reopenIssue(owner: string, repo: string, issueNumber: number): boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a composite key for owner/repo scoping. */
function repoKey(owner: string, repo: string): string {
  return `${owner}/${repo}`;
}

/** Default starting value for comment ID sequences. */
const COMMENT_ID_START = 1000;

/** Default starting value for PR number sequences. */
const PR_NUMBER_START = 100;

// ── Factory ────────────────────────────────────────────────────────────────

/**
 * Create a new {@link MockGitHubClient} pre-seeded with sample data.
 *
 * Each call returns an independent instance with its own in-memory store so
 * tests can run in parallel without interference.
 */
export function createMockGitHubClient(): MockGitHubClient {
  // Scoped stores keyed by "owner/repo"
  const issues = new Map<string, Map<number, MockIssue>>();
  const branches = new Map<string, Map<string, MockBranch>>();
  const pullRequests = new Map<string, Map<number, MockPullRequest>>();

  // Instance-local counters (no shared global state)
  let commentSeq = COMMENT_ID_START;
  let prSeq = PR_NUMBER_START;

  function nextComment(): number {
    return commentSeq++;
  }

  function nextPr(): number {
    return prSeq++;
  }

  // ── Seed data ──────────────────────────────────────────────────────────

  const seedOwner = 'acme';
  const seedRepo = 'webapp';
  const seedKey = repoKey(seedOwner, seedRepo);

  const seedIssues = new Map<number, MockIssue>();
  seedIssues.set(1, {
    number: 1,
    title: 'Add dark-mode support',
    body: 'Users have requested a dark-mode toggle in the settings page.',
    state: 'open',
    labels: ['enhancement', 'ui'],
    author: 'alice',
    createdAt: '2025-01-10T09:00:00Z',
    comments: [],
  });
  seedIssues.set(2, {
    number: 2,
    title: 'Fix login redirect loop',
    body: 'After SSO login the user is redirected back to /login indefinitely.',
    state: 'open',
    labels: ['bug', 'auth'],
    author: 'bob',
    createdAt: '2025-01-12T14:30:00Z',
    comments: [],
  });
  seedIssues.set(3, {
    number: 3,
    title: 'Upgrade Node.js to v22',
    body: 'We should upgrade the runtime to Node 22 LTS before Q3.',
    state: 'open',
    labels: ['chore', 'infrastructure'],
    author: 'carol',
    createdAt: '2025-02-01T08:00:00Z',
    comments: [],
  });
  issues.set(seedKey, seedIssues);

  const seedBranches = new Map<string, MockBranch>();
  seedBranches.set('main', { ref: 'refs/heads/main', sha: 'abc1234' });
  branches.set(seedKey, seedBranches);

  pullRequests.set(seedKey, new Map());

  // ── Client implementation ──────────────────────────────────────────────

  const client: MockGitHubClient = {
    getIssue(owner, repo, issueNumber) {
      return issues.get(repoKey(owner, repo))?.get(issueNumber);
    },

    createBranch(owner, repo, branchName, baseSha) {
      const key = repoKey(owner, repo);
      if (!branches.has(key)) {
        branches.set(key, new Map());
      }
      const repoBranches = branches.get(key)!;
      const sha = baseSha ?? repoBranches.get('main')?.sha ?? 'deadbeef';
      const branch: MockBranch = { ref: `refs/heads/${branchName}`, sha };
      repoBranches.set(branchName, branch);
      return branch;
    },

    deleteBranch(owner, repo, branchName) {
      return branches.get(repoKey(owner, repo))?.delete(branchName) ?? false;
    },

    createPullRequest(owner, repo, title, head, base, body) {
      const key = repoKey(owner, repo);
      if (!pullRequests.has(key)) {
        pullRequests.set(key, new Map());
      }
      const num = nextPr();
      const pr: MockPullRequest = {
        number: num,
        title,
        head,
        base,
        body,
        state: 'open',
        draft: true,
        url: `https://github.com/${owner}/${repo}/pull/${num}`,
      };
      pullRequests.get(key)!.set(num, pr);
      return pr;
    },

    closePullRequest(owner, repo, prNumber) {
      const pr = pullRequests.get(repoKey(owner, repo))?.get(prNumber);
      if (!pr || pr.state !== 'open') return false;
      pr.state = 'closed';
      return true;
    },

    closeIssue(owner, repo, issueNumber, comment) {
      const issue = issues.get(repoKey(owner, repo))?.get(issueNumber);
      if (!issue) return undefined;
      issue.state = 'closed';
      const commentId = nextComment();
      issue.comments.push({
        id: commentId,
        body: comment,
        author: 'intentgraph-bot',
        createdAt: new Date().toISOString(),
      });
      return commentId;
    },

    reopenIssue(owner, repo, issueNumber) {
      const issue = issues.get(repoKey(owner, repo))?.get(issueNumber);
      if (!issue) return false;
      issue.state = 'open';
      return true;
    },
  };

  return client;
}
