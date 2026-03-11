.PHONY: install build test lint clean docker-build docker-up docker-down helm-lint helm-template

# ─── Development ────────────────────────────────
install:
	npm install

build:
	npm run build

test:
	npm test

lint:
	npm run format:check

format:
	npm run format

clean:
	npm run clean

typecheck:
	npx tsc -p packages/workflow-spec/tsconfig.build.json --noEmit
	npx tsc -p packages/action-sdk/tsconfig.build.json --noEmit
	npx tsc -p packages/policy/tsconfig.build.json --noEmit

# ─── Docker ─────────────────────────────────────
docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

# ─── Helm ───────────────────────────────────────
helm-lint:
	helm lint infra/helm/intentgraph

helm-template:
	helm template intentgraph infra/helm/intentgraph

# ─── Full CI locally ───────────────────────────
ci: lint typecheck test build
	@echo "✅ All CI checks passed"
