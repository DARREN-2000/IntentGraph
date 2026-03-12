/**
 * GitHub mock connector – barrel export.
 *
 * @packageDocumentation
 */

export * from './types';
export { createMockGitHubClient } from './mock-client';
export type { MockGitHubClient, MockIssue, MockComment, MockBranch, MockPullRequest } from './mock-client';
export { createGitHubActions } from './actions';
export type { GitHubActions } from './actions';
