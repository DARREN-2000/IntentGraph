/**
 * Approvals Service
 *
 * Manages approval requests and decisions.
 * Integrates with the policy engine to determine which steps need approval.
 */

import {
	checkPolicy,
	DEFAULT_POLICY_RULES,
	type PolicyCheckResult,
	type PolicyRule,
} from '@intentgraph/policy';
import type {
	ApprovalRequest,
	EffectCategory,
	RiskLevel,
	WorkflowStep,
} from '@intentgraph/workflow-spec';

export interface ApprovalRequestInput {
	workflowRunId: string;
	stepId: string;
	action: string;
	requestedBy: string;
	requestedOf: string;
	preview: unknown;
	riskLevel: RiskLevel;
	effects: EffectCategory[];
	reason?: string;
}

export interface ApprovalDecision {
	approvalId: string;
	approverId: string;
	decision: 'approved' | 'denied';
	reason?: string;
}

export interface ApprovalRecord extends ApprovalRequest {
	requestedBy: string;
	decisionBy?: string;
	decisionHistory: Array<{
		approverId: string;
		decision: 'approved' | 'denied';
		reason?: string;
		timestamp: string;
	}>;
}

export class ApprovalsService {
	private approvals = new Map<string, ApprovalRecord>();
	private rules: PolicyRule[];

	constructor(rules: PolicyRule[] = DEFAULT_POLICY_RULES) {
		this.rules = rules;
	}

	assessStep(
		step: WorkflowStep,
		stepRisk: RiskLevel,
		stepEffects: EffectCategory[],
	): PolicyCheckResult {
		return checkPolicy(step, stepRisk, stepEffects, this.rules);
	}

	createRequest(input: ApprovalRequestInput): ApprovalRecord {
		const request: ApprovalRecord = {
			id: `apr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
			workflowRunId: input.workflowRunId,
			stepId: input.stepId,
			action: input.action,
			preview: input.preview,
			riskLevel: input.riskLevel,
			effects: input.effects,
			requestedOf: input.requestedOf,
			status: 'pending',
			requestedAt: new Date().toISOString(),
			reason: input.reason,
			requestedBy: input.requestedBy,
			decisionHistory: [],
		};

		this.approvals.set(request.id, request);
		return request;
	}

	getById(approvalId: string): ApprovalRecord | null {
		return this.approvals.get(approvalId) || null;
	}

	listPending(workflowRunId?: string): ApprovalRecord[] {
		return Array.from(this.approvals.values()).filter(
			(approval) =>
				approval.status === 'pending' &&
				(workflowRunId ? approval.workflowRunId === workflowRunId : true),
		);
	}

	listAll(workflowRunId?: string): ApprovalRecord[] {
		const all = Array.from(this.approvals.values());
		if (!workflowRunId) {
			return all;
		}
		return all.filter((approval) => approval.workflowRunId === workflowRunId);
	}

	decide(input: ApprovalDecision): ApprovalRecord {
		const approval = this.approvals.get(input.approvalId);
		if (!approval) {
			throw new Error(`Approval request not found: ${input.approvalId}`);
		}
		if (approval.status !== 'pending') {
			throw new Error(`Approval request is already ${approval.status}`);
		}

		approval.status = input.decision;
		approval.decidedAt = new Date().toISOString();
		approval.decisionBy = input.approverId;
		approval.reason = input.reason;
		approval.decisionHistory.push({
			approverId: input.approverId,
			decision: input.decision,
			reason: input.reason,
			timestamp: approval.decidedAt,
		});

		this.approvals.set(approval.id, approval);
		return approval;
	}

	isApproved(workflowRunId: string, stepId: string): boolean {
		return Array.from(this.approvals.values()).some(
			(approval) =>
				approval.workflowRunId === workflowRunId &&
				approval.stepId === stepId &&
				approval.status === 'approved',
		);
	}

	hasPending(workflowRunId: string): boolean {
		return this.listPending(workflowRunId).length > 0;
	}

	clearWorkflowApprovals(workflowRunId: string): void {
		for (const [approvalId, approval] of this.approvals.entries()) {
			if (approval.workflowRunId === workflowRunId) {
				this.approvals.delete(approvalId);
			}
		}
	}
}

export function createApprovalsService(rules?: PolicyRule[]): ApprovalsService {
	return new ApprovalsService(rules);
}
