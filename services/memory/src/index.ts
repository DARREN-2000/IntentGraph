/**
 * Memory Service
 *
 * Manages scoped memory (personal, org, project, session).
 * Prevents context leakage between scopes.
 */

import type { MemoryItem } from '@intentgraph/workflow-spec';

export type MemoryScope = MemoryItem['scope'];

export interface MemorySetInput {
	scope: MemoryScope;
	ownerId: string;
	key: string;
	value: unknown;
	ttlSeconds?: number | null;
}

export interface MemoryQuery {
	scope?: MemoryScope;
	ownerId?: string;
	keyPrefix?: string;
}

export class MemoryService {
	private items = new Map<string, MemoryItem>();

	set(input: MemorySetInput): MemoryItem {
		this.cleanupExpired();

		const now = new Date().toISOString();
		const itemKey = this.composeKey(input.scope, input.ownerId, input.key);
		const existing = this.items.get(itemKey);

		const item: MemoryItem = {
			id: existing?.id || `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
			scope: input.scope,
			ownerId: input.ownerId,
			key: input.key,
			value: input.value,
			createdAt: existing?.createdAt || now,
			updatedAt: now,
			ttlSeconds: input.ttlSeconds ?? existing?.ttlSeconds ?? null,
		};

		this.items.set(itemKey, item);
		return item;
	}

	get(scope: MemoryScope, ownerId: string, key: string): MemoryItem | null {
		this.cleanupExpired();
		return this.items.get(this.composeKey(scope, ownerId, key)) || null;
	}

	delete(scope: MemoryScope, ownerId: string, key: string): boolean {
		return this.items.delete(this.composeKey(scope, ownerId, key));
	}

	list(query: MemoryQuery = {}): MemoryItem[] {
		this.cleanupExpired();

		return Array.from(this.items.values()).filter((item) => {
			if (query.scope && item.scope !== query.scope) return false;
			if (query.ownerId && item.ownerId !== query.ownerId) return false;
			if (query.keyPrefix && !item.key.startsWith(query.keyPrefix)) return false;
			return true;
		});
	}

	clearOwner(scope: MemoryScope, ownerId: string): number {
		let removed = 0;
		for (const [storageKey, item] of this.items.entries()) {
			if (item.scope === scope && item.ownerId === ownerId) {
				this.items.delete(storageKey);
				removed += 1;
			}
		}
		return removed;
	}

	exportOwner(scope: MemoryScope, ownerId: string): string {
		const ownerItems = this.list({ scope, ownerId });
		return JSON.stringify(ownerItems, null, 2);
	}

	getStats(): { total: number; byScope: Record<MemoryScope, number> } {
		this.cleanupExpired();

		const byScope: Record<MemoryScope, number> = {
			personal: 0,
			org: 0,
			project: 0,
			session: 0,
		};

		for (const item of this.items.values()) {
			byScope[item.scope] += 1;
		}

		return { total: this.items.size, byScope };
	}

	private cleanupExpired(): void {
		const nowMs = Date.now();
		for (const [storageKey, item] of this.items.entries()) {
			if (!item.ttlSeconds || item.ttlSeconds <= 0) {
				continue;
			}

			const createdMs = Date.parse(item.createdAt);
			const expiresAt = createdMs + item.ttlSeconds * 1000;
			if (expiresAt <= nowMs) {
				this.items.delete(storageKey);
			}
		}
	}

	private composeKey(scope: MemoryScope, ownerId: string, key: string): string {
		return `${scope}:${ownerId}:${key}`;
	}
}

export function createMemoryService(): MemoryService {
	return new MemoryService();
}
