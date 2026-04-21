/**
 * Audit Service - Immutable audit trail for all workflow activities.
 */

import type { AuditEvent } from '@intentgraph/workflow-spec';

export interface StoredAuditEvent extends AuditEvent {
	id: string;
	hash: string;
	previousHash: string;
	sequenceNumber: number;
}

export interface AuditQuery {
	userId?: string;
	sessionId?: string;
	workflowId?: string;
	stepId?: string;
	eventType?: string;
	startTime?: string;
	endTime?: string;
	limit?: number;
	offset?: number;
}

export interface AuditQueryResult {
	events: StoredAuditEvent[];
	total: number;
	hasMore: boolean;
}

export type AuditEventListener = (event: StoredAuditEvent) => Promise<void>;

export class AuditService {
	private events: StoredAuditEvent[] = [];
	private sequenceCounter = 0;
	private lastHash = 'genesis';
	private eventListeners: AuditEventListener[] = [];

	registerEventListener(listener: AuditEventListener): void {
		this.eventListeners.push(listener);
	}

	async log(event: AuditEvent): Promise<StoredAuditEvent> {
		this.sequenceCounter += 1;

		const eventData = JSON.stringify({
			...event,
			sequenceNumber: this.sequenceCounter,
			previousHash: this.lastHash,
		});

		const hash = await this.computeHash(eventData);

		const storedEvent: StoredAuditEvent = {
			...event,
			id: `audit_${Date.now()}_${this.sequenceCounter}`,
			hash,
			previousHash: this.lastHash,
			sequenceNumber: this.sequenceCounter,
		};

		this.events.push(storedEvent);
		this.lastHash = hash;

		for (const listener of this.eventListeners) {
			try {
				await listener(storedEvent);
			} catch (error) {
				console.error('Audit event listener failed:', error);
			}
		}

		return storedEvent;
	}

	async query(query: AuditQuery): Promise<AuditQueryResult> {
		let filtered = [...this.events];

		if (query.userId) {
			filtered = filtered.filter((e) => e.userId === query.userId);
		}
		if (query.sessionId) {
			filtered = filtered.filter((e) => e.sessionId === query.sessionId);
		}
		if (query.workflowId) {
			filtered = filtered.filter(
				(e) => e.workflowId === query.workflowId || e.workflowRunId === query.workflowId,
			);
		}
		if (query.stepId) {
			filtered = filtered.filter((e) => e.stepId === query.stepId);
		}
		if (query.eventType) {
			filtered = filtered.filter((e) => e.type === query.eventType);
		}
		const startTime = query.startTime;
		if (startTime) {
			filtered = filtered.filter((e) => e.timestamp >= startTime);
		}
		const endTime = query.endTime;
		if (endTime) {
			filtered = filtered.filter((e) => e.timestamp <= endTime);
		}

		const total = filtered.length;
		const offset = query.offset || 0;
		const limit = query.limit || 100;
		const paginated = filtered.slice(offset, offset + limit);

		return {
			events: paginated,
			total,
			hasMore: offset + limit < total,
		};
	}

	async getWorkflowTrail(workflowId: string): Promise<StoredAuditEvent[]> {
		const result = await this.query({ workflowId, limit: 1000 });
		return result.events.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
	}

	async getUserActivity(userId: string, hours = 24): Promise<StoredAuditEvent[]> {
		const endTime = new Date().toISOString();
		const startTime = new Date(Date.now() - hours * 3600000).toISOString();
		const result = await this.query({ userId, startTime, endTime, limit: 1000 });
		return result.events;
	}

	async verifyIntegrity(): Promise<{ valid: boolean; issues: string[] }> {
		const issues: string[] = [];
		let expectedPreviousHash = 'genesis';

		for (let i = 0; i < this.events.length; i += 1) {
			const event = this.events[i];

			if (event.previousHash !== expectedPreviousHash) {
				issues.push(`Event ${event.id}: previous hash mismatch`);
			}

			const eventData = JSON.stringify({
				...event,
				sequenceNumber: event.sequenceNumber,
				previousHash: event.previousHash,
			});

			const computedHash = await this.computeHash(eventData);
			if (computedHash !== event.hash) {
				issues.push(`Event ${event.id}: hash verification failed`);
			}

			expectedPreviousHash = event.hash;
		}

		return {
			valid: issues.length === 0,
			issues,
		};
	}

	async exportEvents(query: AuditQuery): Promise<string> {
		const result = await this.query({ ...query, limit: 10000 });
		return JSON.stringify(result.events, null, 2);
	}

	getEventCount(): number {
		return this.events.length;
	}

	getLatestEvents(limit = 100): StoredAuditEvent[] {
		return this.events.slice(-limit);
	}

	private async computeHash(data: string): Promise<string> {
		let hash = 0;
		for (let i = 0; i < data.length; i += 1) {
			const char = data.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash |= 0;
		}
		return `hash_${Math.abs(hash).toString(16).padStart(8, '0')}`;
	}
}

export const builtInEventListeners: Record<string, AuditEventListener> = {
	consoleLogger: async (event) => {
		console.log(
			`[AUDIT] ${event.type} - User: ${event.userId} - ${new Date(event.timestamp).toISOString()}`,
		);
	},

	aggregator: (() => {
		const counters: Record<string, number> = {};
		return async (event: StoredAuditEvent) => {
			counters[event.type] = (counters[event.type] || 0) + 1;
		};
	})(),

	criticalAlert: async (event) => {
		if (
			event.type.includes('failed') ||
			event.type.includes('denied') ||
			event.type.includes('error')
		) {
			console.warn(`[ALERT] Critical audit event: ${event.type}`, event.data);
		}
	},
};

export function createAuditService(): AuditService {
	const service = new AuditService();
	service.registerEventListener(builtInEventListeners.consoleLogger);
	service.registerEventListener(builtInEventListeners.criticalAlert);
	return service;
}

export function createAuditLogger(
	service: AuditService,
	context: {
		userId: string;
		sessionId: string;
		workflowId?: string;
		stepId?: string;
	},
) {
	return {
		log: async (eventType: string, data: Record<string, unknown>) => {
			return service.log({
				type: eventType as AuditEvent['type'],
				timestamp: new Date().toISOString(),
				userId: context.userId,
				actorId: context.userId,
				sessionId: context.sessionId,
				workflowId: context.workflowId,
				workflowRunId: context.workflowId || context.sessionId,
				stepId: context.stepId,
				data,
			});
		},
	};
}
