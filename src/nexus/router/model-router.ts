import { estimateRegistryEntryCost, selectCheapestAvailableModel, type EnvReader } from '../config/model-registry';
import type { ModelChoice, ModelTier, TaskClassification } from '../types';

export interface RouteModelOptions {
  estimatedInputTokens?: number;
  estimatedOutputTokens?: number;
  env?: EnvReader;
}

export function routeModel(classification: TaskClassification, options: RouteModelOptions = {}): ModelChoice {
  const targetTier = targetTierFor(classification);
  const estimatedInputTokens = options.estimatedInputTokens ?? Math.ceil(classification.tokenBudget * 0.35);
  const estimatedOutputTokens = options.estimatedOutputTokens ?? Math.ceil(classification.tokenBudget * 0.2);
  const selected = selectCheapestAvailableModel(targetTier, estimatedInputTokens, estimatedOutputTokens, options.env);
  const estimatedCostUsd = estimateRegistryEntryCost(selected, estimatedInputTokens, estimatedOutputTokens, true);

  return {
    tier: selected.tier,
    provider: selected.provider,
    model: selected.model,
    maxOutputTokens: Math.min(selected.maxOutputTokens, Math.max(512, Math.floor(classification.tokenBudget / 2))),
    rationale: [
      `Targeted ${targetTier} for ${classification.complexity} ${classification.domain} task with ${classification.estimatedSteps} estimated step(s).`,
      selected.available ? `Selected cheapest configured ${selected.provider} model.` : `No API key was configured; selected cheapest ${selected.provider} fallback metadata.`,
    ].join(' '),
    apiKeyEnvVar: selected.envKey,
    apiKeyConfigured: selected.available,
    estimatedCostUsd,
  };
}

function targetTierFor(classification: TaskClassification): ModelTier {
  if (classification.complexity === 'trivial') return 'haiku';
  if (classification.complexity === 'hard_reasoning' || classification.estimatedSteps > 8) return 'opus';
  if (classification.suggestedModel === 'gemini_flash') return 'gemini_flash';
  return 'sonnet';
}
