/**
 * Planner Service - Compiles natural language intent into workflows.
 */

import type { WorkflowSpec } from '@intentgraph/workflow-spec';

export interface PlanningRequest {
	userId: string;
	intent: string;
	context?: PlanningContext;
}

export interface PlanningContext {
	availableActions: string[];
	userPreferences?: Record<string, unknown>;
	orgSettings?: Record<string, unknown>;
	previousWorkflows?: WorkflowSpec[];
}

export interface PlanningResult {
	success: boolean;
	workflow?: WorkflowSpec;
	confidence: number;
	alternatives?: WorkflowSpec[];
	warnings?: string[];
	error?: string;
}

export interface ActionDefinition {
	key: string;
	description: string;
	inputSchema: Record<string, { type: string; required: boolean; description: string }>;
	risk: 'low' | 'medium' | 'high' | 'critical';
	effects: string[];
}

const actionRegistry: ActionDefinition[] = [
	{
		key: 'github.create_issue',
		description: 'Create a new issue in a GitHub repository',
		inputSchema: {
			owner: { type: 'string', required: true, description: 'GitHub owner/org' },
			repo: { type: 'string', required: true, description: 'Repository name' },
			title: { type: 'string', required: true, description: 'Issue title' },
			body: { type: 'string', required: false, description: 'Issue description' },
			labels: { type: 'array', required: false, description: 'Labels to add' },
		},
		risk: 'medium',
		effects: ['write'],
	},
	{
		key: 'github.create_pr',
		description: 'Create a pull request',
		inputSchema: {
			owner: { type: 'string', required: true, description: 'GitHub owner/org' },
			repo: { type: 'string', required: true, description: 'Repository name' },
			title: { type: 'string', required: true, description: 'PR title' },
			head: { type: 'string', required: true, description: 'Source branch' },
			base: { type: 'string', required: true, description: 'Target branch' },
		},
		risk: 'high',
		effects: ['write'],
	},
	{
		key: 'slack.send_message',
		description: 'Send a message to a Slack channel',
		inputSchema: {
			channel: { type: 'string', required: true, description: 'Slack channel' },
			text: { type: 'string', required: true, description: 'Message text' },
		},
		risk: 'low',
		effects: ['write', 'external-communication'],
	},
	{
		key: 'gmail.send_email',
		description: 'Send an email via Gmail',
		inputSchema: {
			to: { type: 'array', required: true, description: 'Recipient emails' },
			subject: { type: 'string', required: true, description: 'Email subject' },
			body: { type: 'string', required: true, description: 'Email body' },
		},
		risk: 'medium',
		effects: ['write', 'external-communication'],
	},
	{
		key: 'calendar.create_event',
		description: 'Create a calendar event',
		inputSchema: {
			summary: { type: 'string', required: true, description: 'Event title' },
			startTime: { type: 'string', required: true, description: 'Start time (ISO)' },
			endTime: { type: 'string', required: true, description: 'End time (ISO)' },
			attendees: { type: 'array', required: false, description: 'Attendee emails' },
		},
		risk: 'medium',
		effects: ['write'],
	},
	{
		key: 'jira.create_issue',
		description: 'Create a Jira issue',
		inputSchema: {
			projectKey: { type: 'string', required: true, description: 'Jira project key' },
			summary: { type: 'string', required: true, description: 'Issue summary' },
			issueType: { type: 'string', required: true, description: 'Issue type' },
		},
		risk: 'medium',
		effects: ['write'],
	},
	{
		key: 'notion.create_page',
		description: 'Create a page in Notion',
		inputSchema: {
			parentDatabaseId: {
				type: 'string',
				required: true,
				description: 'Parent database ID',
			},
			title: { type: 'string', required: true, description: 'Page title' },
		},
		risk: 'medium',
		effects: ['write'],
	},
];

const intentPatterns: Array<{
	patterns: RegExp[];
	action: string;
	extractParams: (intent: string) => Record<string, unknown>;
}> = [
	{
		patterns: [/create\s+(?:an?\s+)?(?:issue|ticket)(?:\s+in\s+)?(?:on\s+)?github/i],
		action: 'github.create_issue',
		extractParams: (intent) => {
			const owner = intent.match(/(?:in|on)\s+(\S+)/i)?.[1] || 'my-org';
			const repo = intent.match(/repo[:\s]+(\S+)/i)?.[1] || 'my-repo';
			const title = intent.match(/title[d:]?\s*["']?([^"']+)["']?/i)?.[1] || 'New Issue';
			return { owner, repo, title };
		},
	},
	{
		patterns: [/send\s+(?:a\s+)?message\s+to\s+slack/i, /post\s+to\s+slack/i],
		action: 'slack.send_message',
		extractParams: (intent) => {
			const channel = intent.match(/channel[:\s]+#?(\S+)/i)?.[1] || 'general';
			const text =
				intent.match(/say["']?\s*([^"']+)|text[:\s]+([^"']+)/i)?.[1] || 'Hello!';
			return { channel, text };
		},
	},
	{
		patterns: [/send\s+(?:an?\s+)?email\s+to/i, /email\s+/i],
		action: 'gmail.send_email',
		extractParams: (intent) => {
			const to = intent.match(/to\s+([^\s,]+)/i)?.[1] || '';
			const subject =
				intent.match(/subject[:\s]+([^"']+)|about\s+([^"']+)/i)?.[1] || 'No subject';
			const body =
				intent.match(/body[:\s]+(["']?[^"']+["']?)/i)?.[1] || 'Please see attached.';
			return { to: to ? [to] : [], subject, body };
		},
	},
	{
		patterns: [
			/schedule\s+(?:a\s+)?(?:meeting|call|event)/i,
			/create\s+(?:an?\s+)?(?:meeting|calendar\s+event)/i,
		],
		action: 'calendar.create_event',
		extractParams: (intent) => {
			const summary = intent.match(/(?:for|called)\s+["']?([^"']+)["']?/i)?.[1] || 'Meeting';
			const startTime = new Date().toISOString();
			const endTime = new Date(Date.now() + 3600000).toISOString();
			return { summary, startTime, endTime };
		},
	},
	{
		patterns: [/create\s+(?:a\s+)?(?:pr|pull\s+request)/i],
		action: 'github.create_pr',
		extractParams: (intent) => {
			const owner = intent.match(/(?:in|on)\s+(\S+)/i)?.[1] || 'my-org';
			const repo = intent.match(/repo[:\s]+(\S+)/i)?.[1] || 'my-repo';
			const title = intent.match(/title[d:]?\s*["']?([^"']+)["']?/i)?.[1] || 'New PR';
			const head = intent.match(/from[:\s]+(\S+)/i)?.[1] || 'feature-branch';
			const base = intent.match(/to[:\s]+(\S+)/i)?.[1] || 'main';
			return { owner, repo, title, head, base };
		},
	},
];

export class PlannerService {
	private actions: Map<string, ActionDefinition> = new Map();

	constructor() {
		for (const action of actionRegistry) {
			this.actions.set(action.key, action);
		}
	}

	registerAction(action: ActionDefinition): void {
		this.actions.set(action.key, action);
	}

	async plan(request: PlanningRequest): Promise<PlanningResult> {
		try {
			const { intent, userId } = request;
			let bestMatch: { action: string; params: Record<string, unknown>; confidence: number } | null =
				null;

			for (const pattern of intentPatterns) {
				for (const regex of pattern.patterns) {
					if (intent.match(regex)) {
						const params = pattern.extractParams(intent);
						const confidence = this.calculateConfidence(intent, pattern.patterns);

						if (!bestMatch || confidence > bestMatch.confidence) {
							bestMatch = { action: pattern.action, params, confidence };
						}
					}
				}
			}

			if (!bestMatch) {
				return {
					success: false,
					confidence: 0,
					error: 'Could not understand intent. Please be more specific.',
					warnings: ['No matching action patterns found'],
				};
			}

			const actionDef = this.actions.get(bestMatch.action);
			if (!actionDef) {
				return {
					success: false,
					confidence: bestMatch.confidence,
					error: `Action "${bestMatch.action}" not found`,
					warnings: ['Requested action is not available'],
				};
			}

			const workflow = this.buildWorkflow(userId, bestMatch.action, bestMatch.params, actionDef);

			return {
				success: true,
				workflow,
				confidence: bestMatch.confidence,
				warnings: this.generateWarnings(actionDef),
			};
		} catch (error) {
			return {
				success: false,
				confidence: 0,
				error: error instanceof Error ? error.message : 'Planning failed',
				warnings: ['An unexpected error occurred'],
			};
		}
	}

	private calculateConfidence(intent: string, patterns: RegExp[]): number {
		let score = 0.5;

		if (intent.length > 30) score += 0.1;
		if (intent.length > 50) score += 0.1;

		let matchCount = 0;
		for (const pattern of patterns) {
			if (pattern.test(intent)) matchCount++;
		}
		if (matchCount > 0) score += Math.min(0.2, matchCount * 0.05);

		return Math.min(1.0, score);
	}

	private buildWorkflow(
		userId: string,
		actionKey: string,
		params: Record<string, unknown>,
		actionDef: ActionDefinition,
	): WorkflowSpec {
		const requiresApproval = actionDef.risk === 'high' || actionDef.risk === 'critical';
		const now = new Date().toISOString();

		return {
			id: `wf_${Date.now()}`,
			name: `Auto-generated: ${actionDef.description}`,
			title: `Auto-generated: ${actionDef.description}`,
			description: 'Workflow generated from user intent',
			steps: [
				{
					id: 'step_1',
					action: actionKey,
					input: params,
					requiresApproval,
					maxRetries: requiresApproval ? 3 : 0,
				},
			],
			createdAt: now,
			updatedAt: now,
			createdBy: userId,
		};
	}

	private generateWarnings(actionDef: ActionDefinition): string[] {
		const warnings: string[] = [];

		if (actionDef.risk === 'high' || actionDef.risk === 'critical') {
			warnings.push('This workflow contains high-risk actions requiring approval');
		}

		if (actionDef.effects.includes('external-communication')) {
			warnings.push('This workflow will send external communications');
		}

		if (actionDef.effects.includes('delete')) {
			warnings.push('This workflow contains destructive operations');
		}

		return warnings;
	}

	getAvailableActions(): ActionDefinition[] {
		return Array.from(this.actions.values());
	}
}

export function createPlannerService(): PlannerService {
	return new PlannerService();
}
