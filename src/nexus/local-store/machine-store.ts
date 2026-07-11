import type { LocalAgentStore, LocalRecord, LocalStoreQuery } from './types';

/**
 * LocalMachineStore is the default Nexus persistence boundary for self-hosted
 * deployments. It keeps agent memory inside the current machine/process and is
 * intentionally free of Supabase, Redis, hosted queues, or network calls.
 */
export class LocalMachineStore implements LocalAgentStore {
  private readonly records = new Map<string, LocalRecord>();

  async put<TPayload extends Record<string, unknown>>(record: Omit<LocalRecord<TPayload>, 'createdAt' | 'updatedAt'>): Promise<LocalRecord<TPayload>> {
    const now = new Date().toISOString();
    const existing = this.records.get(record.id);
    const next: LocalRecord<TPayload> = {
      ...record,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.records.set(record.id, Object.freeze({ ...next }));
    return next;
  }

  async get<TPayload extends Record<string, unknown>>(id: string): Promise<LocalRecord<TPayload> | undefined> {
    return this.records.get(id) as LocalRecord<TPayload> | undefined;
  }

  async query<TPayload extends Record<string, unknown>>(query: LocalStoreQuery): Promise<Array<LocalRecord<TPayload>>> {
    const limit = query.limit ?? 100;
    return [...this.records.values()]
      .filter((record) => !query.userId || record.userId === query.userId)
      .filter((record) => !query.kind || record.kind === query.kind)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, limit) as Array<LocalRecord<TPayload>>;
  }

  async delete(id: string): Promise<boolean> {
    return this.records.delete(id);
  }
}
