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

export class IntentGraphControlPlane {
  private planner = createPlannerService();
  private approvals = createApprovalsService();
  private memory = createMemoryService();
  private audit = createAuditService();
  private executor = createExecutorService(this.approvals, this.audit, this.memory);

  private workflows = new Map<string, WorkflowSpec>();
  private workflowStatuses = new Map<string, StoredWorkflowSummary['status']>();
  private workflowOrder: string[] = [];
  private runs = new Map<string, WorkflowRun>();

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
      workspaceId: 'default-workspace',
      sessionId: `session_${Date.now()}`,
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

    this.workflowStatuses.set(workflowId, 'failed');
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __intentGraphApiControlPlane: IntentGraphControlPlane | undefined;
}

export function getControlPlane(): IntentGraphControlPlane {
  if (!global.__intentGraphApiControlPlane) {
    global.__intentGraphApiControlPlane = new IntentGraphControlPlane();
  }

  return global.__intentGraphApiControlPlane;
}
