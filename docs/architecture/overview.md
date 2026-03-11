# IntentGraph Architecture Overview

## System Design

IntentGraph is built as a layered system with clear separation of concerns:

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

## Core Principle

**Every action must be typed, previewable, approved when risky, replayable, and reversible.**

## Action Contract

Every action plugin implements three methods:

- `preview()` — show what will happen without side effects
- `execute()` — perform the action
- `compensate()` — reverse the action (best-effort rollback)

## Data Flow

1. **Intent Capture** — User provides goal (text, voice, file, trigger)
2. **Context Assembly** — Pull relevant data from connected systems
3. **Workflow Compilation** — Convert intent into a `WorkflowSpec`
4. **Risk Analysis** — Classify each step by effect category
5. **Simulation / Preview** — Show exactly what will happen
6. **Approval Gating** — Ask humans when needed
7. **Durable Execution** — Execute step-by-step with retries and compensation
8. **Audit + Memory** — Save what happened for reuse

## Memory Scopes

Memory is separated to prevent context leakage:

- **Personal** — User's private context
- **Organization** — Shared org knowledge
- **Project** — Project-specific context
- **Session** — Transient, expires after session

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, React, Tailwind, shadcn/ui |
| Control Plane | Node.js API, PostgreSQL, Redis |
| Agent Plane | LLM APIs, LangGraph |
| Workflow Plane | Temporal, Event Sourcing |
| Trust Plane | OpenFGA, Secret Vault |
| Message Queue | NATS JetStream |
| Deployment | Docker, Kubernetes, Helm, Terraform |
