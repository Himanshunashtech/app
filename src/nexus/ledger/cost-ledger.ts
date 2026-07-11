import { DEFAULT_MODEL_REGISTRY, estimateRegistryEntryCost } from '../config/model-registry';
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
  const entry = DEFAULT_MODEL_REGISTRY.find((candidate) => candidate.model === model);
  if (entry) return estimateRegistryEntryCost(entry, inputTokens, outputTokens, cacheHit);

  const conservativeFallbackRates = { inputUsdPerMillion: 5, outputUsdPerMillion: 20 };
  const inputRate = cacheHit ? conservativeFallbackRates.inputUsdPerMillion * 0.1 : conservativeFallbackRates.inputUsdPerMillion;
  return (inputTokens * inputRate + outputTokens * conservativeFallbackRates.outputUsdPerMillion) / 1_000_000;
}
