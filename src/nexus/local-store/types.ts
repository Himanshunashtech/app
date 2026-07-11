export type LocalRecordKind = 'working_memory' | 'episodic_memory' | 'semantic_fact' | 'trajectory' | 'skill' | 'training_event';

export interface LocalRecord<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  kind: LocalRecordKind;
  userId: string;
  payload: TPayload;
  createdAt: string;
  updatedAt: string;
}

export interface LocalStoreQuery {
  userId?: string;
  kind?: LocalRecordKind;
  limit?: number;
}

export interface LocalAgentStore {
  put<TPayload extends Record<string, unknown>>(record: Omit<LocalRecord<TPayload>, 'createdAt' | 'updatedAt'>): Promise<LocalRecord<TPayload>>;
  get<TPayload extends Record<string, unknown>>(id: string): Promise<LocalRecord<TPayload> | undefined>;
  query<TPayload extends Record<string, unknown>>(query: LocalStoreQuery): Promise<Array<LocalRecord<TPayload>>>;
  delete(id: string): Promise<boolean>;
}
