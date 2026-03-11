# Local Development Runbook

## Prerequisites

- Node.js >= 20
- npm >= 10
- Docker & Docker Compose (for full stack)
- Helm (for chart development)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/DARREN-2000/IntentGraph.git
cd IntentGraph

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test
```

## Package Development

```bash
# Build a specific package
cd packages/workflow-spec
npm run build

# Run tests for a specific package
cd packages/workflow-spec
npm test

# Type check
npm run typecheck
```

## Docker Development

```bash
# Start all services (API, Worker, Postgres, Redis, NATS, Temporal)
docker compose up -d

# View logs
docker compose logs -f api

# Stop services
docker compose down

# Rebuild after changes
docker compose build --no-cache api
docker compose up -d api
```

## Helm Development

```bash
# Lint the chart
helm lint infra/helm/intentgraph

# Render templates
helm template intentgraph infra/helm/intentgraph

# Install to a cluster
helm install intentgraph infra/helm/intentgraph \
  --namespace intentgraph \
  --create-namespace

# Upgrade
helm upgrade intentgraph infra/helm/intentgraph \
  --namespace intentgraph

# Uninstall
helm uninstall intentgraph --namespace intentgraph
```

## API Health Check

```bash
curl http://localhost:3001/healthz
curl http://localhost:3001/readyz
curl http://localhost:3001/api/v1/version
```

## Troubleshooting

### Tests failing
```bash
# Clean and rebuild
npm run clean
npm install
npm run build
npm test
```

### Docker build failing
```bash
# Check Docker daemon is running
docker info

# Clean Docker cache
docker system prune -f
docker compose build --no-cache
```

### Helm template errors
```bash
# Debug template rendering
helm template intentgraph infra/helm/intentgraph --debug
```
