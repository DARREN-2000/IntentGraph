<p align="center">
  <h1 align="center">IntentGraph</h1>
  <p align="center">
    <strong>A universal action OS that compiles natural-language intent into trusted workflows.</strong>
  </p>
  <p align="center">
    <a href="#quick-start">Quick Start</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#packages">Packages</a> •
    <a href="#docker">Docker</a> •
    <a href="#kubernetes--helm">Kubernetes</a> •
    <a href="#contributing">Contributing</a>
  </p>
</p>

---

## What is IntentGraph?

IntentGraph turns natural-language goals into **trusted, reusable workflows**. A person says what they want in plain English, and the system converts that into a structured workflow with a plan, required tools, permissions, dry-run preview, approval rules, execution steps, rollback/compensation steps, an audit trail, and a reusable template.

**The core contract:** every action must be typed, previewable, approved when risky, replayable, and reversible.

### Examples

```
"Pay my bills, track unusual increases, and store receipts."

"When a bug issue appears, reproduce it, open a branch, write a failing test,
 propose a fix, and open a draft PR."

"Onboard this employee: create accounts, schedule training, grant access,
 and notify the manager."
```

## Quick Start

```bash
# Prerequisites: Node.js >= 20, npm >= 10

# Install dependencies
npm install

# Build all packages
npm run build

# Run all tests
npm test

# Format code
npm run format
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend Layer                  │
│         (Web App, Browser Extension, Bots)       │
├─────────────────────────────────────────────────┤
│                Control Plane (API)               │
│      (Request routing, auth, session mgmt)       │
├─────────────────────────────────────────────────┤
│                  Agent Plane                     │
│   (Router, Planner, Context, Risk, Critic)       │
├─────────────────────────────────────────────────┤
│                Workflow Plane                    │
│     (Temporal, LangGraph, Event Sourcing)        │
├─────────────────────────────────────────────────┤
│                  Trust Plane                     │
│   (OpenFGA, Vault, Audit, Approval Engine)       │
├─────────────────────────────────────────────────┤
│                Connector Plane                   │
│      (Direct APIs, MCP, A2A, Browser)            │
└─────────────────────────────────────────────────┘
```

### The Two-Layer Design

1. **Agent Layer** — decides what should happen (dynamic reasoning)
2. **Workflow Layer** — runs it reliably (deterministic execution)

### The Universal Plugin Contract

Every action plugin implements:

```typescript
interface ActionPlugin<I, O> {
  key: string;                  // e.g. "gmail.send_draft"
  risk: RiskLevel;              // "low" | "medium" | "high" | "critical"
  effects: EffectCategory[];    // what kind of side effects
  preview(ctx, input): Promise<ActionResult<O>>;    // show what will happen
  execute(ctx, input): Promise<ActionResult<O>>;    // do it
  compensate?(ctx, payload): Promise<void>;         // undo it
}
```

If an action cannot preview and compensate, it is not production-ready.

## Repo Structure

```
apps/
  api/            # Control plane API service
  worker/         # Workflow execution worker
  web/            # Next.js web dashboard
  extension/      # Browser extension

packages/
  workflow-spec/  # Core types + workflow runtime
  action-sdk/     # SDK for building action plugins
  connectors/     # Connector plugins for external services
  policy/         # Policy engine + approval rules
  prompts/        # Versioned LLM prompts
  ui/             # Shared UI components
  shared/         # Shared utilities

services/
  planner/        # Intent → WorkflowSpec compiler
  executor/       # Durable workflow executor
  approvals/      # Approval engine
  memory/         # Scoped context memory
  audit/          # Audit trail service

infra/
  docker/         # Docker configurations
  helm/           # Helm charts for Kubernetes
  k8s/            # Raw Kubernetes manifests (Kustomize)
  terraform/      # Infrastructure as Code (AWS)

docs/
  architecture/   # Architecture documentation
  prd/            # Product requirements
  runbooks/       # Operational runbooks
```

## Packages

### `@intentgraph/workflow-spec`

Core types and workflow runtime. Defines `WorkflowSpec`, `WorkflowStep`, `ActionContext`, `ActionResult`, and the `runWorkflow()` engine with preview, approval gating, retry, and automatic rollback.

### `@intentgraph/action-sdk`

SDK for building action plugins. Provides `defineAction()` helper and `createMockContext()` for testing.

```typescript
import { defineAction } from '@intentgraph/action-sdk';

const sendEmail = defineAction<EmailInput, EmailOutput>({
  key: 'gmail.send_draft',
  risk: 'medium',
  effects: ['external-communication'],
  description: 'Send an email draft via Gmail',
  async preview(ctx, input) {
    return { ok: true, preview: { to: input.to, subject: input.subject } };
  },
  async execute(ctx, input) {
    const messageId = await gmail.send(input);
    return {
      ok: true,
      output: { messageId },
      compensation: { action: 'gmail.delete_message', payload: { messageId } },
    };
  },
  async compensate(ctx, payload) {
    await gmail.trash((payload as any).messageId);
  },
});
```

### `@intentgraph/policy`

Policy engine for risk assessment. Evaluates workflow steps against configurable rules to determine approval requirements and blocked actions.

## Docker

### Development with Docker Compose

```bash
# Start everything: API, Worker, Postgres, Redis, NATS, Temporal
docker compose up -d

# View logs
docker compose logs -f api

# Stop
docker compose down
```

### Build images individually

```bash
docker build -t intentgraph/api -f apps/api/Dockerfile .
docker build -t intentgraph/worker -f apps/worker/Dockerfile .
```

## Kubernetes & Helm

### Helm Chart

```bash
# Lint
helm lint infra/helm/intentgraph

# Template
helm template intentgraph infra/helm/intentgraph

# Install
helm install intentgraph infra/helm/intentgraph \
  --namespace intentgraph --create-namespace

# Upgrade
helm upgrade intentgraph infra/helm/intentgraph \
  --namespace intentgraph
```

### Kustomize (raw manifests)

```bash
# Dev overlay
kubectl apply -k infra/k8s/overlays/dev

# Staging
kubectl apply -k infra/k8s/overlays/staging

# Production
kubectl apply -k infra/k8s/overlays/prod
```

### Infrastructure features

- **HPA** — Auto-scaling based on CPU/memory
- **PDB** — Pod Disruption Budget for high availability
- **Network Policies** — Restrict pod-to-pod traffic
- **Security Contexts** — Non-root, read-only filesystem, dropped capabilities
- **Health checks** — Liveness and readiness probes on all services

## CI/CD

| Workflow | Trigger | Description |
|----------|---------|-------------|
| `ci.yml` | Push/PR to main | Lint, type check, test (Node 20 & 22), build |
| `docker-build.yml` | Push/PR to main, tags | Build and push Docker images to GHCR |
| `helm-lint.yml` | Changes to `infra/helm/` | Lint and template Helm charts |
| `security.yml` | Push/PR, weekly schedule | npm audit, Trivy container scan |
| `release.yml` | Tag push (`v*`) | Build, test, create GitHub Release |

## Infrastructure as Code

Terraform modules for AWS deployment:

```
infra/terraform/
  main.tf              # Root module
  modules/
    vpc/               # VPC, subnets, NAT
    eks/               # EKS cluster, node groups
    rds/               # PostgreSQL RDS
    redis/             # ElastiCache Redis
    s3/                # S3 buckets
```

## Product Rules

- **Preview before execute** — every action shows what it will do before doing it
- **Human approval** for delete, spend, provision, or external send
- **Rollback/compensation** — every write action must provide a way to undo
- **Audit trail** — every workflow run emits structured audit events
- **Memory scopes** — personal, org, project, and session memory are strictly separated
- **API first** — prefer direct APIs over browser automation
- **Typed schemas** — no untyped JSON blobs in public interfaces
- **Idempotency** — every write action uses idempotency keys

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure `npm test` passes
5. Submit a pull request

See [AGENTS.md](./AGENTS.md) for coding agent instructions and architecture rules.

## License

[Apache License 2.0](./LICENSE)
