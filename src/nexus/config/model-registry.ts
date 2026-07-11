import type { ModelProvider, ModelTier } from '../types';

export interface ModelRegistryEntry {
  tier: ModelTier;
  provider: ModelProvider;
  model: string;
  envKey: string;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
  maxOutputTokens: number;
  supportsToolUse: boolean;
  supportsVision: boolean;
}

export interface RuntimeModelEntry extends ModelRegistryEntry {
  available: boolean;
}

export type EnvReader = Pick<NodeJS.ProcessEnv, string>;

export const DEFAULT_MODEL_REGISTRY: readonly ModelRegistryEntry[] = Object.freeze([

  {
    tier: 'haiku',
    provider: 'ollama',
    model: 'llama3.1:8b',
    envKey: 'OLLAMA_BASE_URL',
    inputUsdPerMillion: 0,
    outputUsdPerMillion: 0,
    maxOutputTokens: 2048,
    supportsToolUse: true,
    supportsVision: false,
  },
  {
    tier: 'sonnet',
    provider: 'ollama',
    model: 'qwen2.5-coder:32b',
    envKey: 'OLLAMA_BASE_URL',
    inputUsdPerMillion: 0,
    outputUsdPerMillion: 0,
    maxOutputTokens: 4096,
    supportsToolUse: true,
    supportsVision: false,
  },
  {
    tier: 'sonnet',
    provider: 'lm_studio',
    model: 'local-model',
    envKey: 'LM_STUDIO_BASE_URL',
    inputUsdPerMillion: 0,
    outputUsdPerMillion: 0,
    maxOutputTokens: 4096,
    supportsToolUse: true,
    supportsVision: true,
  },
  {
    tier: 'haiku',
    provider: 'anthropic',
    model: 'claude-3-5-haiku-latest',
    envKey: 'ANTHROPIC_API_KEY',
    inputUsdPerMillion: 0.8,
    outputUsdPerMillion: 4,
    maxOutputTokens: 1024,
    supportsToolUse: true,
    supportsVision: false,
  },
  {
    tier: 'sonnet',
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    envKey: 'ANTHROPIC_API_KEY',
    inputUsdPerMillion: 3,
    outputUsdPerMillion: 15,
    maxOutputTokens: 4096,
    supportsToolUse: true,
    supportsVision: true,
  },
  {
    tier: 'opus',
    provider: 'anthropic',
    model: 'claude-opus-4-20250514',
    envKey: 'ANTHROPIC_API_KEY',
    inputUsdPerMillion: 15,
    outputUsdPerMillion: 75,
    maxOutputTokens: 8192,
    supportsToolUse: true,
    supportsVision: true,
  },
  {
    tier: 'haiku',
    provider: 'openai',
    model: 'gpt-4o-mini',
    envKey: 'OPENAI_API_KEY',
    inputUsdPerMillion: 0.15,
    outputUsdPerMillion: 0.6,
    maxOutputTokens: 2048,
    supportsToolUse: true,
    supportsVision: true,
  },
  {
    tier: 'sonnet',
    provider: 'openai',
    model: 'gpt-4o',
    envKey: 'OPENAI_API_KEY',
    inputUsdPerMillion: 2.5,
    outputUsdPerMillion: 10,
    maxOutputTokens: 4096,
    supportsToolUse: true,
    supportsVision: true,
  },
  {
    tier: 'gemini_flash',
    provider: 'google',
    model: 'gemini-2.0-flash',
    envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    inputUsdPerMillion: 0.1,
    outputUsdPerMillion: 0.4,
    maxOutputTokens: 2048,
    supportsToolUse: true,
    supportsVision: true,
  },
  {
    tier: 'sonnet',
    provider: 'google',
    model: 'gemini-1.5-pro',
    envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    inputUsdPerMillion: 1.25,
    outputUsdPerMillion: 5,
    maxOutputTokens: 4096,
    supportsToolUse: true,
    supportsVision: true,
  },
  {
    tier: 'sonnet',
    provider: 'mistral',
    model: 'mistral-large-latest',
    envKey: 'MISTRAL_API_KEY',
    inputUsdPerMillion: 2,
    outputUsdPerMillion: 6,
    maxOutputTokens: 4096,
    supportsToolUse: true,
    supportsVision: false,
  },
  {
    tier: 'sonnet',
    provider: 'xai',
    model: 'grok-3',
    envKey: 'XAI_API_KEY',
    inputUsdPerMillion: 3,
    outputUsdPerMillion: 15,
    maxOutputTokens: 4096,
    supportsToolUse: true,
    supportsVision: false,
  },
  {
    tier: 'sonnet',
    provider: 'deepseek',
    model: 'deepseek-chat',
    envKey: 'DEEPSEEK_API_KEY',
    inputUsdPerMillion: 0.27,
    outputUsdPerMillion: 1.1,
    maxOutputTokens: 4096,
    supportsToolUse: true,
    supportsVision: false,
  },
  {
    tier: 'haiku',
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    envKey: 'GROQ_API_KEY',
    inputUsdPerMillion: 0.05,
    outputUsdPerMillion: 0.08,
    maxOutputTokens: 1024,
    supportsToolUse: true,
    supportsVision: false,
  },
  {
    tier: 'opus',
    provider: 'openrouter',
    model: 'openrouter/auto',
    envKey: 'OPENROUTER_API_KEY',
    inputUsdPerMillion: 5,
    outputUsdPerMillion: 15,
    maxOutputTokens: 8192,
    supportsToolUse: true,
    supportsVision: true,
  },
]);

export function resolveModelRegistry(env: EnvReader = process.env): RuntimeModelEntry[] {
  return DEFAULT_MODEL_REGISTRY.map((entry) => ({
    ...entry,
    available: Boolean(env[entry.envKey]?.trim()),
  }));
}

export function selectCheapestAvailableModel(
  tier: ModelTier,
  estimatedInputTokens: number,
  estimatedOutputTokens: number,
  env: EnvReader = process.env,
): RuntimeModelEntry {
  const registry = resolveModelRegistry(env);
  const sameTier = registry.filter((entry) => entry.tier === tier && entry.available);
  const candidates = sameTier.length > 0 ? sameTier : registry.filter((entry) => entry.available);
  const fallbackCandidates = candidates.length > 0 ? candidates : registry.filter((entry) => entry.tier === tier);
  const finalCandidates = fallbackCandidates.length > 0 ? fallbackCandidates : registry;

  return [...finalCandidates].sort((left, right) => {
    const leftCost = estimateRegistryEntryCost(left, estimatedInputTokens, estimatedOutputTokens);
    const rightCost = estimateRegistryEntryCost(right, estimatedInputTokens, estimatedOutputTokens);
    return leftCost - rightCost;
  })[0];
}

export function estimateRegistryEntryCost(entry: ModelRegistryEntry, inputTokens: number, outputTokens: number, cacheHit = false): number {
  const inputRate = cacheHit ? entry.inputUsdPerMillion * 0.1 : entry.inputUsdPerMillion;
  return (inputTokens * inputRate + outputTokens * entry.outputUsdPerMillion) / 1_000_000;
}
