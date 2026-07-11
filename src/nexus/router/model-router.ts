import type { ModelChoice, TaskClassification } from '../types';

const MODEL_BY_TIER = {
  haiku: { provider: 'anthropic', model: 'claude-3-5-haiku-latest', maxOutputTokens: 1024 },
  sonnet: { provider: 'anthropic', model: 'claude-sonnet-4-20250514', maxOutputTokens: 4096 },
  opus: { provider: 'anthropic', model: 'claude-opus-4-20250514', maxOutputTokens: 8192 },
  gemini_flash: { provider: 'google', model: 'gemini-2.0-flash', maxOutputTokens: 2048 },
} as const;

export function routeModel(classification: TaskClassification): ModelChoice {
  const tier = classification.complexity === 'trivial'
    ? 'haiku'
    : classification.complexity === 'hard_reasoning' || classification.estimatedSteps > 8
      ? 'opus'
      : classification.suggestedModel === 'gemini_flash'
        ? 'gemini_flash'
        : 'sonnet';
  const selected = MODEL_BY_TIER[tier];

  return {
    tier,
    provider: selected.provider,
    model: selected.model,
    maxOutputTokens: Math.min(selected.maxOutputTokens, Math.max(512, Math.floor(classification.tokenBudget / 2))),
    rationale: `Routed ${classification.complexity} ${classification.domain} task with ${classification.estimatedSteps} estimated step(s) to ${tier}.`,
  };
}
