# IntentGraph

IntentGraph is a multi-tenant action OS that turns natural-language goals into trusted workflows.

The project is built around one non-negotiable contract for side-effecting actions:

1. `preview()` explains what will happen.
2. `execute()` performs the side effect.
3. `compensate()` rolls back where possible.

This repository includes the core workflow runtime, policy engine, connectors, control plane services, web dashboard, and a new CLI.

## Table of Contents

1. [Product Principles](#product-principles)
2. [Architecture at a Glance](#architecture-at-a-glance)
3. [Monorepo Layout](#monorepo-layout)
4. [Quick Start (Local)](#quick-start-local)
5. [Web Dashboard](#web-dashboard)
6. [CLI](#cli)
7. [Screenshots and Demo Video](#screenshots-and-demo-video)
8. [Build, Test, and Quality Gates](#build-test-and-quality-gates)
9. [Deployment Paths](#deployment-paths)
10. [Documentation Map](#documentation-map)
11. [Troubleshooting](#troubleshooting)
12. [Roadmap to Production-Ready](#roadmap-to-production-ready)

## Product Principles

IntentGraph follows these guarantees in design and implementation:

1. Preview before execute.
2. Human approval for risky actions (delete, spend, provision, or external send).
3. Typed validation of all LLM outputs before action execution.
4. Audit events for all workflow runs and critical step transitions.
5. Policy checks before risky execution.
6. Memory scoped by ownership boundaries (personal, org, project, session).

## Architecture at a Glance

```text
User Intent (Web / CLI)
	-> Planner Service (intent -> workflow spec)
	-> Executor Service (policy + approvals + runtime)
	-> Action Plugins (preview/execute/compensate)
	-> Audit Service (event trail + integrity)
	-> Memory Service (scoped context)
```

Core building blocks:

- `packages/workflow-spec`: workflow types and runtime.
- `packages/action-sdk`: ergonomic action/plugin authoring.
- `packages/policy`: policy checks and risk rules.
- `packages/connectors`: side-effect connectors (GitHub, Slack, Gmail, etc.).
- `services/*`: planner, executor, approvals, audit, memory.
- `apps/web`: dashboard for intent planning and approval flow.
- `packages/cli`: command line workflow planning and execution.

## Monorepo Layout

```text
IntentGraph/
	apps/
		api/
		web/
		worker/
		extension/
	packages/
		workflow-spec/
		action-sdk/
		connectors/
		policy/
		prompts/
		shared/
		ui/
		cli/
	services/
		planner/
		executor/
		approvals/
		audit/
		memory/
	docs/
	infra/
```

## Quick Start (Local)

### Prerequisites

- Node.js >= 20
- npm >= 10
- Docker + Docker Compose (recommended for full stack)
- Helm (optional for chart validation)

### 1) Install dependencies

```bash
npm install
```

### 2) Build workspace

```bash
npm run build
```

### 3) Run tests

```bash
npm test
```

### 4) Run local services with Docker

```bash
docker compose up -d
docker compose logs -f api
```

### 5) Run web dashboard

```bash
cd apps/web
npm run dev
```

By default the dashboard is available on `http://localhost:3000`.

### Demo mode (web-only)

For a self-contained live demo (no control plane required), run the dashboard in demo mode:

```bash
cd apps/web
INTENTGRAPH_DEMO_MODE=1 npm run dev
```

Demo mode uses an in-memory control plane and seeds sample workflows and approvals. To point the
dashboard at a live control plane, set `INTENTGRAPH_CONTROL_PLANE_URL` to your API base URL.

### 6) Health checks

```bash
curl http://localhost:3001/healthz
curl http://localhost:3001/readyz
curl http://localhost:3001/api/v1/version
```

## Web Dashboard

The dashboard currently supports:

1. Natural-language intent input.
2. Workflow planning with confidence score.
3. Workflow execution from the queue.
4. Approval queue for gated/risky actions.
5. Action catalog visibility.

Primary implementation entrypoint:

- `apps/web/src/pages/index.tsx`

API handlers used by the dashboard:

- `apps/web/src/pages/api/plan.ts`
- `apps/web/src/pages/api/execute.ts`
- `apps/web/src/pages/api/workflows/index.ts`
- `apps/web/src/pages/api/approvals/index.ts`
- `apps/web/src/pages/api/approvals/[approvalId]/approve.ts`

## CLI

The repository now includes a dedicated CLI workspace package at `packages/cli`.

### Build CLI

```bash
npm run cli:build
```

### Run CLI (workspace shortcut)

```bash
npm run cli -- help
```

### Commands

```text
intentgraph help
intentgraph actions list
intentgraph plan --intent "Create an issue in github repo: my-repo"
intentgraph run --intent "Create a pull request in github repo: my-repo" --auto-approve
intentgraph doctor
```

### JSON output mode

All core commands support `--json` or `-j` for machine-readable output.

```bash
npm run cli -- plan --intent "Send an email to dev@example.com" --json
```

### CLI implementation notes

- `plan` compiles intent into a workflow proposal.
- `run` plans and executes in one command.
- `run --auto-approve` auto-approves local demo gates.
- `doctor` validates environment and local endpoint reachability.

## Screenshots and Demo Video

### Dashboard Screenshots

![Dashboard home](docs/screenshots/dashboard-home.png)
![Workflow planned](docs/screenshots/dashboard-workflow-planned.png)
![Execution complete](docs/screenshots/dashboard-execution-complete.png)
![Waiting approval](docs/screenshots/dashboard-waiting-approval.png)
![Approval complete](docs/screenshots/dashboard-approval-complete.png)
![Mobile view](docs/screenshots/dashboard-mobile.png)

### Demo Video

- [IntentGraph dashboard demo (WebM)](docs/videos/intentgraph-dashboard-demo.webm)

### Regenerate Media Artifacts

```bash
node docs/scripts/capture-dashboard-demo.mjs
```

Artifacts are written to:

- `docs/screenshots/`
- `docs/videos/`

## Build, Test, and Quality Gates

### Core Commands

```bash
npm run build
npm run test
npm run lint
npm run format:check
```

### Makefile shortcuts

```bash
make install
make build
make test
make lint
make ci
make cli-build
make cli ARGS="help"
```

### CI Workflows

- `.github/workflows/ci.yml`
- `.github/workflows/security.yml`
- `.github/workflows/docker-build.yml`
- `.github/workflows/helm-lint.yml`
- `.github/workflows/release.yml`

## Deployment Paths

### Docker Compose (local integration)

- `docker-compose.yml` runs Postgres, Redis, NATS, Temporal, API, and Worker.

### Kubernetes + Helm

- Chart: `infra/helm/intentgraph`

Validate chart:

```bash
helm lint infra/helm/intentgraph
helm template intentgraph infra/helm/intentgraph
```

### Terraform

- Root: `infra/terraform/main.tf`
- Modules: VPC, EKS, RDS, Redis, S3 under `infra/terraform/modules`

## Documentation Map

Architecture and product:

- `docs/architecture/overview.md`
- `docs/architecture/action-contract.md`
- `docs/prd/v1.md`

Runbooks:

- `docs/runbooks/local-development.md`
- `docs/runbooks/incident-response.md`

Media automation:

- `docs/scripts/capture-dashboard-demo.mjs`

## Troubleshooting

### 1) Build fails

```bash
npm run clean
npm install
npm run build
```

### 2) Tests fail after dependency changes

```bash
npm test
```

Run package-level tests when debugging:

```bash
cd packages/workflow-spec && npx jest --ci
cd packages/action-sdk && npx jest --ci
cd packages/policy && npx jest --ci
cd packages/connectors && npx jest --ci
```

### 3) Dashboard API route errors

Check local API utility behavior in:

- `apps/web/src/server/api-utils.ts`

### 4) Docker stack not healthy

```bash
docker compose ps
docker compose logs -f
```

## Roadmap to Production-Ready

Current foundation is strong, and the active implementation path is:

1. API-first control plane wiring (move business orchestration out of web process).
2. Durable persistence for workflows, approvals, memory, and audit data.
3. Security hardening (authn, authz, tenancy boundaries).
4. Reliability hardening (idempotency, retry/backoff, compensation tests).
5. Observability (structured logs, metrics, tracing, alerts).
6. Web UX polish (design system, responsive/a11y quality gates).
7. CLI UX polish (ergonomic command set and automation-first output).
8. CI/CD release gates and staged rollout drills.

These principles and constraints are codified in `AGENTS.md`.
