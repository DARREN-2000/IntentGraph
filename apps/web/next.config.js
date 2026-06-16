/** @type {import('next').NextConfig} */
const isGithubPages =
  process.env.GITHUB_PAGES === 'true' || process.env.NEXT_PUBLIC_DEPLOY_ENV === 'github-pages';
const repoName = process.env.GITHUB_REPOSITORY
  ? process.env.GITHUB_REPOSITORY.split('/')[1]
  : undefined;
const basePath = isGithubPages && repoName ? `/${repoName}` : undefined;

const nextConfig = {
  output: 'export',
  transpilePackages: [
    '@intentgraph/workflow-spec',
    '@intentgraph/action-sdk',
    '@intentgraph/policy',
    '@intentgraph/planner-service',
    '@intentgraph/approvals-service',
    '@intentgraph/memory-service',
    '@intentgraph/audit-service',
    '@intentgraph/executor-service',
  ],
  ...(isGithubPages
    ? {
        trailingSlash: true,
        basePath,
        assetPrefix: basePath ? `${basePath}/` : undefined,
        images: { unoptimized: true },
      }
    : {}),
};

module.exports = nextConfig;
