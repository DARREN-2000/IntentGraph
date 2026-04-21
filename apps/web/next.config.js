/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

module.exports = nextConfig;
