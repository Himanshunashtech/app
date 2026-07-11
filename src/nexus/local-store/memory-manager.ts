import type { LocalAgentStore, LocalRecord } from './types';

export interface MemoryWriteInput {
  userId: string;
  text: string;
  source: 'conversation' | 'tool_result' | 'feedback' | 'training';
  importance?: number;
}

export interface RetrievedMemory {
  id: string;
  text: string;
  source: string;
  score: number;
  createdAt: string;
}

export class LocalMemoryManager {
  constructor(private readonly store: LocalAgentStore) {}

  async remember(input: MemoryWriteInput): Promise<LocalRecord<{ text: string; source: string; importance: number }>> {
    const normalized = input.text.trim();
    if (!normalized) throw new Error('Memory text is required.');

    return this.store.put({
      id: `mem_${hashText(`${input.userId}:${normalized}`)}`,
      kind: 'semantic_fact',
      userId: input.userId,
      payload: {
        text: normalized,
        source: input.source,
        importance: clamp(input.importance ?? 0.5, 0, 1),
      },
    });
  }

  async retrieve(userId: string, query: string, limit = 5): Promise<RetrievedMemory[]> {
    const records = await this.store.query<{ text: string; source: string; importance: number }>({ userId, kind: 'semantic_fact', limit: 500 });
    const queryTerms = tokenize(query);

    return records
      .map((record) => ({ record, score: scoreMemory(record, queryTerms) }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit)
      .map(({ record, score }) => ({
        id: record.id,
        text: record.payload.text,
        source: record.payload.source,
        score,
        createdAt: record.createdAt,
      }));
  }
}

function scoreMemory(record: LocalRecord<{ text: string; source: string; importance: number }>, queryTerms: Set<string>): number {
  const terms = tokenize(record.payload.text);
  const overlap = [...queryTerms].filter((term) => terms.has(term)).length;
  return overlap / Math.max(1, queryTerms.size) + record.payload.importance * 0.25;
}

function tokenize(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2));
}

function hashText(text: string): string {
  let hash = 5381;
  for (const char of text) hash = (hash * 33) ^ char.charCodeAt(0);
  return (hash >>> 0).toString(36);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
