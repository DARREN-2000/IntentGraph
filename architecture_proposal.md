# Proposed Architecture for GovernOS Phase 2

## Problem Statement
GovernOS is positioned as an enterprise-grade orchestration engine, yet the repository currently contains only:
- A basic Python library (`intentgraph`) for parsing Python files using AST and building a NetworkX dependency graph.
- A static React frontend application in `apps/web` demonstrating marketing copy and screenshots, but completely disconnected from any backend.
- `infra` scaffolding (Terraform modules commented out, basic Helm chart structure).

Crucial advertised features are missing entirely:
- **Planner Service** & **Executor Service** (Node.js/Temporal)
- **Action Plugins**
- **Audit Service**
- **API** for frontend-backend communication (e.g., `intentgraph.api`)
- **Database** & state management (PostgreSQL)
- **Authentication/Authorization**
- **Docker Compose** environment for running backing services

## Proposed Architecture

To fulfill the mission and product rules outlined in `AGENTS.md` and `README.md`, I propose building out the following major architectural components:

### 1. Python API Layer (`intentgraph.api`)
- Use **FastAPI** to expose the existing core orchestrator (`intentgraph/orchestrator.py`) to external services.
- Provide endpoints to submit files/directories and return the parsed `GraphData` in JSON format.

### 2. Node.js Backend Services (The Control Plane)
Create a new directory `apps/api` (Node.js/Express or NestJS) to handle:
- **Authentication & RBAC:** Enforce boundaries and secure user sessions.
- **Planner Service:** Accept natural language intents, route them to an LLM, and generate a typed Execution Plan.
- **Executor Service:** Evaluate generated plans against policies (e.g., spend limits, destructive actions). If flagged, pause execution and wait for Human-in-the-Loop approval.
- **Temporal Worker:** Manage long-running workflows with durability and retries.

### 3. Action Plugins
Implement the action contract (`preview()`, `execute()`, `compensate()`) for standard connectors:
- **AWS Connector:** Provision infrastructure, with a strict policy against destructive operations without approval.
- **GitHub Connector:** Manage repositories and PRs.

### 4. Frontend Integration
- Connect the React frontend (`apps/web`) to the Node.js API to provide a real dashboard for viewing execution plans and approving actions.
- Implement state management for the UI (e.g., Zustand or Redux).
- Add authentication flows.

### 5. Infrastructure & Tooling
- Add `docker-compose.yml` to orchestrate PostgreSQL, Redis, NATS, and Temporal locally.
- Implement the missing Temporal setup.

## Request for Approval
Per `AGENTS.md`: "When executing phased workflows or major architectural changes, present the proposed architecture first and wait for explicit user approval before writing code."

Please review this proposed architecture. Once approved, I will begin the implementation phase starting with the FastAPI layer and the Node.js backend.
