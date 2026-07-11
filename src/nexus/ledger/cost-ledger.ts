import type { CostEntry } from '../types';

export class InMemoryCostLedger {
  private readonly entries: CostEntry[] = [];

  append(entry: CostEntry): void {
    this.entries.push(Object.freeze({ ...entry }));
  }

  listByTask(taskId: string): CostEntry[] {
    return this.entries.filter((entry) => entry.taskId === taskId);
  }

  totalCost(taskId: string): number {
    return this.listByTask(taskId).reduce((sum, entry) => sum + entry.costUsd, 0);
  }
}

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number, cacheHit = false): number {
  const ratesPerMillion = model.includes('opus')
    ? { input: 15, output: 75 }
    : model.includes('sonnet')
      ? { input: 3, output: 15 }
      : { input: 0.8, output: 4 };
  const inputRate = cacheHit ? ratesPerMillion.input * 0.1 : ratesPerMillion.input;
  return (inputTokens * inputRate + outputTokens * ratesPerMillion.output) / 1_000_000;
}
