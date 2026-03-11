# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* turbo.json tsconfig.json ./
COPY packages/workflow-spec/package.json packages/workflow-spec/
COPY packages/action-sdk/package.json packages/action-sdk/
COPY packages/policy/package.json packages/policy/
COPY packages/shared/package.json packages/shared/
COPY packages/connectors/package.json packages/connectors/
COPY apps/worker/package.json apps/worker/

RUN npm install --ignore-scripts

COPY packages/workflow-spec/ packages/workflow-spec/
COPY packages/action-sdk/ packages/action-sdk/
COPY packages/policy/ packages/policy/
COPY packages/shared/ packages/shared/
COPY packages/connectors/ packages/connectors/
COPY apps/worker/ apps/worker/

RUN npx tsc -p packages/workflow-spec/tsconfig.build.json && \
    npx tsc -p packages/action-sdk/tsconfig.build.json && \
    npx tsc -p packages/policy/tsconfig.build.json && \
    npx tsc -p packages/shared/tsconfig.build.json && \
    npx tsc -p apps/worker/tsconfig.build.json

# ---- Production Stage ----
FROM node:20-alpine AS production

RUN addgroup -g 1001 -S intentgraph && \
    adduser -S intentgraph -u 1001

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/workflow-spec/dist packages/workflow-spec/dist
COPY --from=builder /app/packages/workflow-spec/package.json packages/workflow-spec/
COPY --from=builder /app/packages/action-sdk/dist packages/action-sdk/dist
COPY --from=builder /app/packages/action-sdk/package.json packages/action-sdk/
COPY --from=builder /app/packages/policy/dist packages/policy/dist
COPY --from=builder /app/packages/policy/package.json packages/policy/
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/packages/shared/package.json packages/shared/
COPY --from=builder /app/apps/worker/dist apps/worker/dist
COPY --from=builder /app/apps/worker/package.json apps/worker/

USER intentgraph

CMD ["node", "apps/worker/dist/index.js"]
