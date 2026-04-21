/**
 * Executor Service
 *
 * Runs workflows durably using the workflow runtime.
 * In production, wraps Temporal for replay-safe execution.
 */

import type {
	ActionContext,
	EffectCategory,
	RiskLevel,
	WorkflowRun,
	WorkflowSpec,
	WorkflowStep,
} from '@intentgraph/workflow-spec';
import { defineAction } from '@intentgraph/action-sdk';
import { runWorkflow, type ActionPlugin } from '@intentgraph/workflow-spec';

import type { AuditService } from '@intentgraph/audit-service';
import type {
	ApprovalRecord,
	ApprovalsService,
} from '@intentgraph/approvals-service';
import { MemoryService } from '@intentgraph/memory-service';

export interface ExecutionRequest {
	workflow: WorkflowSpec;
	userId: string;
	workspaceId: string;
	sessionId?: string;
	idempotencyKey?: string;
	metadata?: Record<string, unknown>;
	autoApprove?: boolean;
}

export interface ExecutionResponse {
	status: 'completed' | 'waiting-approval' | 'failed';
	runId: string;
	run?: WorkflowRun;
	approvals?: ApprovalRecord[];
	error?: string;
}

interface PendingRun {
	request: ExecutionRequest;
	requiredApprovalSteps: string[];
	createdAt: string;
}

export class ExecutorService {
	private approvalsService: ApprovalsService;
	private auditService: AuditService;
	private memoryService: MemoryService;
	private plugins = new Map<string, ActionPlugin<unknown, unknown>>();
	private pendingRuns = new Map<string, PendingRun>();
	private completedRuns = new Map<string, WorkflowRun>();

	constructor(
		approvalsService: ApprovalsService,
		auditService: AuditService,
		memoryService: MemoryService,
	) {
		this.approvalsService = approvalsService;
		this.auditService = auditService;
		this.memoryService = memoryService;

		this.registerBuiltInActions();
	}

	registerAction<I, O>(plugin: ActionPlugin<I, O>): void {
		this.plugins.set(plugin.key, plugin as ActionPlugin<unknown, unknown>);
	}

	listActions(): string[] {
		return Array.from(this.plugins.keys());
	}

	getRun(runId: string): WorkflowRun | null {
		return this.completedRuns.get(runId) || null;
	}

	listRuns(): WorkflowRun[] {
		return Array.from(this.completedRuns.values());
	}

	async execute(request: ExecutionRequest): Promise<ExecutionResponse> {
		const runId = this.createRunId();
		const enrichedWorkflow = this.applyPolicyToWorkflow(request.workflow);

		const blocked = this.findBlockedStep(enrichedWorkflow);
		if (blocked) {
			return {
				status: 'failed',
				runId,
				error: blocked,
			};
		}

		const requiredApprovalSteps = enrichedWorkflow.steps
			.filter((step) => step.requiresApproval)
			.map((step) => step.id);

		if (requiredApprovalSteps.length > 0 && !request.autoApprove) {
			const approvals = requiredApprovalSteps.map((stepId) => {
				const step = this.getStepById(enrichedWorkflow, stepId);
				const plugin = this.plugins.get(step.action);
				const risk = plugin?.risk || 'medium';
				const effects = (plugin?.effects || ['write']) as EffectCategory[];

				return this.approvalsService.createRequest({
					workflowRunId: runId,
					stepId: step.id,
					action: step.action,
					requestedBy: request.userId,
					requestedOf: 'human-approver',
					preview: {
						action: step.action,
						input: step.input,
						description: plugin?.description || 'No description provided',
					},
					riskLevel: risk,
					effects,
					reason: `Approval required for ${step.action}`,
				});
			});

			this.pendingRuns.set(runId, {
				request: {
					...request,
					workflow: enrichedWorkflow,
					sessionId: request.sessionId || runId,
				},
				requiredApprovalSteps,
				createdAt: new Date().toISOString(),
			});

			return {
				status: 'waiting-approval',
				runId,
				approvals,
			};
		}

		const run = await this.executeNow({
			...request,
			workflow: enrichedWorkflow,
			sessionId: request.sessionId || runId,
		}, runId);

		return {
			status: run.status === 'completed' ? 'completed' : 'failed',
			runId,
			run,
			error: run.status === 'completed' ? undefined : `Run finished with status ${run.status}`,
		};
	}

	async resumeRun(runId: string): Promise<ExecutionResponse> {
		const pending = this.pendingRuns.get(runId);
		if (!pending) {
			return { status: 'failed', runId, error: `Pending run not found: ${runId}` };
		}

		const missingApproval = pending.requiredApprovalSteps.find(
			(stepId) => !this.approvalsService.isApproved(runId, stepId),
		);

		if (missingApproval) {
			return {
				status: 'waiting-approval',
				runId,
				approvals: this.approvalsService.listPending(runId),
			};
		}

		const run = await this.executeNow({
			...pending.request,
			autoApprove: true,
		}, runId);

		this.pendingRuns.delete(runId);

		return {
			status: run.status === 'completed' ? 'completed' : 'failed',
			runId,
			run,
			error: run.status === 'completed' ? undefined : `Run finished with status ${run.status}`,
		};
	}

	private async executeNow(request: ExecutionRequest, runId: string): Promise<WorkflowRun> {
		const context = this.createContext(request, runId);

		const run = await runWorkflow(
			request.workflow,
			context,
			this.asRegistry(),
			{
				approve: async (step) => this.approvalsService.isApproved(runId, step.id),
				onAuditEvent: (event) => {
					void this.auditService.log({
						type: event.type,
						timestamp: new Date().toISOString(),
						userId: request.userId,
						actorId: request.userId,
						sessionId: request.sessionId || runId,
						workflowRunId: runId,
						workflowId: request.workflow.id,
						stepId: event.stepId,
						data: (event.data || {}) as Record<string, unknown>,
					});
				},
			},
		);

		this.completedRuns.set(run.id, run);
		this.memoryService.set({
			scope: 'session',
			ownerId: request.sessionId || runId,
			key: `run:${run.id}`,
			value: {
				status: run.status,
				workflowId: run.workflowId,
				completedAt: run.completedAt,
			},
			ttlSeconds: 86400,
		});

		return run;
	}

	private applyPolicyToWorkflow(workflow: WorkflowSpec): WorkflowSpec {
		const steps = workflow.steps.map((step) => {
			const plugin = this.plugins.get(step.action);
			const risk = plugin?.risk || 'medium';
			const effects = (plugin?.effects || ['write']) as EffectCategory[];
			const policyResult = this.approvalsService.assessStep(step, risk, effects);

			return {
				...step,
				requiresApproval: step.requiresApproval || policyResult.requiresApproval,
			};
		});

		return {
			...workflow,
			steps,
			updatedAt: new Date().toISOString(),
		};
	}

	private findBlockedStep(workflow: WorkflowSpec): string | null {
		for (const step of workflow.steps) {
			const plugin = this.plugins.get(step.action);
			const risk = plugin?.risk || 'medium';
			const effects = (plugin?.effects || ['write']) as EffectCategory[];
			const policyResult = this.approvalsService.assessStep(step, risk, effects);
			if (!policyResult.allowed) {
				return `Blocked by policy for step ${step.id}: ${policyResult.blockReasons.join('; ')}`;
			}
		}
		return null;
	}

	private getStepById(workflow: WorkflowSpec, stepId: string): WorkflowStep {
		const step = workflow.steps.find((candidate) => candidate.id === stepId);
		if (!step) {
			throw new Error(`Step not found: ${stepId}`);
		}
		return step;
	}

	private createContext(request: ExecutionRequest, runId: string): ActionContext {
		return {
			userId: request.userId,
			workspaceId: request.workspaceId,
			requestId: runId,
			sessionId: request.sessionId || runId,
			dryRun: false,
			idempotencyKey: request.idempotencyKey || `idem_${runId}`,
			timestamp: new Date().toISOString(),
			metadata: request.metadata,
		};
	}

	private asRegistry(): Record<string, ActionPlugin<unknown, unknown>> {
		const registry: Record<string, ActionPlugin<unknown, unknown>> = {};
		for (const [key, plugin] of this.plugins.entries()) {
			registry[key] = plugin;
		}
		return registry;
	}

	private createRunId(): string {
		return `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
	}

	private registerBuiltInActions(): void {
		const register = (
			key: string,
			risk: RiskLevel,
			effects: EffectCategory[],
			description: string,
		) => {
			this.registerAction(
				defineAction<Record<string, unknown>, Record<string, unknown>>({
					key,
					risk,
					effects,
					description,
					async preview(_ctx, input) {
						return {
							ok: true,
							summary: `Will run ${key}`,
							preview: { action: key, input },
						};
					},
					async execute(_ctx, input) {
						return {
							ok: true,
							summary: `Executed ${key}`,
							output: { action: key, executedAt: new Date().toISOString(), input },
							compensation: {
								action: `${key}.compensate`,
								payload: { action: key, input },
							},
						};
					},
					async compensate(_ctx, _payload) {
						return;
					},
				}),
			);
		};

		register('github.create_issue', 'medium', ['write'], 'Create a GitHub issue');
		register(
			'github.create_pr',
			'high',
			['write', 'external-communication'],
			'Create a GitHub pull request',
		);
		register(
			'slack.send_message',
			'medium',
			['write', 'external-communication'],
			'Send a Slack message',
		);
		register(
			'gmail.send_email',
			'medium',
			['write', 'external-communication'],
			'Send an email',
		);
		register('calendar.create_event', 'medium', ['write'], 'Create a calendar event');
		register('jira.create_issue', 'medium', ['write'], 'Create a Jira issue');
		register('notion.create_page', 'medium', ['write'], 'Create a Notion page');
	}
}

export function createExecutorService(
	approvalsService: ApprovalsService,
	auditService: AuditService,
	memoryService: MemoryService,
): ExecutorService {
	return new ExecutorService(approvalsService, auditService, memoryService);
}
