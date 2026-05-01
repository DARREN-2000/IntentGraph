import type { WorkflowRun, WorkflowSpec } from '@intentgraph/workflow-spec';
import {
  createPlannerService,
  type ActionDefinition,
  type PlanningResult,
} from '@intentgraph/planner-service';
import {
  createApprovalsService,
  type ApprovalRecord,
} from '@intentgraph/approvals-service';
import { createMemoryService } from '@intentgraph/memory-service';
import { createAuditService } from '@intentgraph/audit-service';
import {
  createExecutorService,
  type ExecutionResponse,
} from '@intentgraph/executor-service';

export interface StoredWorkflowSummary {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'completed' | 'failed' | 'waiting-approval';
  createdAt: string;
}

export interface DemoControlPlaneResponse {
  status: number;
  body: Record<string, unknown>;
}

interface DemoControlPlaneCall {
  method: 'GET' | 'POST';
  path: string;
  body?: Record<string, unknown>;
}

const DEMO_USER_ID = 'demo-user';
const DEMO_WORKSPACE_ID = 'demo-workspace';

class DemoControlPlane {
  private planner = createPlannerService();
  private approvals = createApprovalsService();
  private memory = createMemoryService();
  private audit = createAuditService();
  private executor = createExecutorService(this.approvals, this.audit, this.memory);

  private workflows = new Map<string, WorkflowSpec>();
  private workflowStatuses = new Map<string, StoredWorkflowSummary['status']>();
  private workflowOrder: string[] = [];
  private runs = new Map<string, WorkflowRun>();
  private seedPromise?: Promise<void>;

  async planIntent(userId: string, intent: string): Promise<PlanningResult> {
    const result = await this.planner.plan({
      userId,
      intent,
      context: {
        availableActions: this.executor.listActions(),
      },
    });

    if (result.success && result.workflow) {
      this.workflows.set(result.workflow.id, result.workflow);
      this.workflowStatuses.set(result.workflow.id, 'draft');
      if (!this.workflowOrder.includes(result.workflow.id)) {
        this.workflowOrder.unshift(result.workflow.id);
      }
    }

    return result;
  }

  listWorkflowSummaries(): StoredWorkflowSummary[] {
    return this.workflowOrder
      .map((workflowId) => this.workflows.get(workflowId))
      .filter((workflow): workflow is WorkflowSpec => Boolean(workflow))
      .map((workflow) => ({
        id: workflow.id,
        name: workflow.name || workflow.title || workflow.id,
        status: this.workflowStatuses.get(workflow.id) || 'draft',
        createdAt: workflow.createdAt || new Date().toISOString(),
      }));
  }

  listPendingApprovals(): ApprovalRecord[] {
    return this.approvals.listPending();
  }

  listRuns(): WorkflowRun[] {
    return this.executor.listRuns();
  }

  listActions(): ActionDefinition[] {
    return this.planner.getAvailableActions();
  }

  getWorkflow(workflowId: string): WorkflowSpec | null {
    return this.workflows.get(workflowId) || null;
  }

  async executeWorkflow(workflowId: string, userId: string): Promise<ExecutionResponse> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return {
        status: 'failed',
        runId: `run_missing_${Date.now()}`,
        error: `Workflow not found: ${workflowId}`,
      };
    }

    const response = await this.executor.execute({
      workflow,
      userId,
      workspaceId: DEMO_WORKSPACE_ID,
      sessionId: `demo_${Date.now()}`,
    });

    this.updateWorkflowStatus(workflowId, response.status);
    if (response.run) {
      this.runs.set(response.run.id, response.run);
    }

    return response;
  }

  async approveRequest(
    approvalId: string,
    approverId: string,
  ): Promise<{ approval: ApprovalRecord; execution: ExecutionResponse }> {
    const approval = this.approvals.decide({
      approvalId,
      approverId,
      decision: 'approved',
    });

    const execution = await this.executor.resumeRun(approval.workflowRunId);

    if (execution.run) {
      this.runs.set(execution.run.id, execution.run);
      this.updateWorkflowStatus(execution.run.workflowId, execution.status);
    }

    return { approval, execution };
  }

  async ensureSeeded(): Promise<void> {
    if (!this.seedPromise) {
      this.seedPromise = this.seedDemoData();
    }
    await this.seedPromise;
  }

  private async seedDemoData(): Promise<void> {
    const samples: Array<{ intent: string; execute: boolean }> = [
      {
        intent: 'Send a message to Slack channel: #launch text: Launch prep is complete',
        execute: false,
      },
      {
        intent: 'Create an issue in github repo: acme/webapp title: Add dark-mode support',
        execute: true,
      },
      {
        intent:
          'Create a pull request in github repo: acme/webapp title: Improve auth from: feature/auth to: main',
        execute: true,
      },
    ];

    for (const sample of samples) {
      const result = await this.planIntent(DEMO_USER_ID, sample.intent);
      if (result.success && result.workflow && sample.execute) {
        await this.executeWorkflow(result.workflow.id, DEMO_USER_ID);
      }
    }
  }

  private updateWorkflowStatus(
    workflowId: string,
    status: ExecutionResponse['status'],
  ): void {
    if (status === 'waiting-approval') {
      this.workflowStatuses.set(workflowId, 'waiting-approval');
      return;
    }

    if (status === 'completed') {
      this.workflowStatuses.set(workflowId, 'completed');
      return;
    }

    if (status === 'failed') {
      this.workflowStatuses.set(workflowId, 'failed');
      return;
    }

    this.workflowStatuses.set(workflowId, 'running');
  }
}

let demoControlPlane: DemoControlPlane | null = null;

function getDemoControlPlane(): DemoControlPlane {
  if (!demoControlPlane) {
    demoControlPlane = new DemoControlPlane();
  }
  return demoControlPlane;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function extractWorkflowId(body?: Record<string, unknown>): string | undefined {
  if (!body) {
    return undefined;
  }

  const direct = asString(body.workflowId);
  if (direct) {
    return direct;
  }

  const workflow = body.workflow;
  if (workflow && typeof workflow === 'object' && !Array.isArray(workflow)) {
    return asString((workflow as { id?: unknown }).id);
  }

  return undefined;
}

export async function callDemoControlPlane(
  options: DemoControlPlaneCall,
): Promise<DemoControlPlaneResponse> {
  const controlPlane = getDemoControlPlane();
  await controlPlane.ensureSeeded();

  if (options.path === '/api/v1/plan') {
    if (options.method !== 'POST') {
      return { status: 405, body: { success: false, error: 'Method not allowed' } };
    }

    const userId = asString(options.body?.userId) || DEMO_USER_ID;
    const intent = asString(options.body?.intent)?.trim();
    if (!intent) {
      return { status: 400, body: { success: false, error: 'intent is required' } };
    }

    const result = await controlPlane.planIntent(userId, intent);
    return {
      status: result.success ? 200 : 400,
      body: result as unknown as Record<string, unknown>,
    };
  }

  if (options.path === '/api/v1/execute') {
    if (options.method !== 'POST') {
      return { status: 405, body: { success: false, error: 'Method not allowed' } };
    }

    const workflowId = extractWorkflowId(options.body);
    const userId = asString(options.body?.userId) || DEMO_USER_ID;

    if (!workflowId) {
      return { status: 400, body: { success: false, error: 'workflow.id is required' } };
    }

    const execution = await controlPlane.executeWorkflow(workflowId, userId);
    let status = 200;
    if (execution.status === 'waiting-approval') {
      status = 202;
    } else if (execution.status === 'failed') {
      status = 400;
    }
    return { status, body: execution as unknown as Record<string, unknown> };
  }

  if (options.path === '/api/v1/workflows') {
    if (options.method !== 'GET') {
      return { status: 405, body: { success: false, error: 'Method not allowed' } };
    }

    return {
      status: 200,
      body: { workflows: controlPlane.listWorkflowSummaries() },
    };
  }

  if (options.path === '/api/v1/approvals') {
    if (options.method !== 'GET') {
      return { status: 405, body: { success: false, error: 'Method not allowed' } };
    }

    const approvals = controlPlane.listPendingApprovals().map((approval) => ({
      id: approval.id,
      workflowId: approval.workflowRunId,
      status: approval.status,
      approvers: [approval.requestedOf],
    }));

    return {
      status: 200,
      body: { approvals },
    };
  }

  const approveMatch = options.path.match(/^\/api\/v1\/approvals\/([^/]+)\/approve$/);
  if (approveMatch) {
    if (options.method !== 'POST') {
      return { status: 405, body: { success: false, error: 'Method not allowed' } };
    }

    const approvalId = decodeURIComponent(approveMatch[1]);
    const approverId = asString(options.body?.approverId) || DEMO_USER_ID;
    const result = await controlPlane.approveRequest(approvalId, approverId);
    return { status: 200, body: result as unknown as Record<string, unknown> };
  }

  if (options.path === '/api/v1/actions') {
    if (options.method !== 'GET') {
      return { status: 405, body: { success: false, error: 'Method not allowed' } };
    }

    return {
      status: 200,
      body: { actions: controlPlane.listActions() },
    };
  }

  if (options.path === '/api/v1/runs') {
    if (options.method !== 'GET') {
      return { status: 405, body: { success: false, error: 'Method not allowed' } };
    }

    return {
      status: 200,
      body: { runs: controlPlane.listRuns() },
    };
  }

  return { status: 404, body: { success: false, error: 'Not found' } };
}
