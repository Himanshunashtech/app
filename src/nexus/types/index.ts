export type TaskComplexity = 'trivial' | 'simple' | 'moderate' | 'complex' | 'hard_reasoning';
export type TaskDomain = 'coding' | 'writing' | 'research' | 'scheduling' | 'other';
export type ModelTier = 'haiku' | 'sonnet' | 'opus' | 'gemini_flash';
export type ModelProvider = 'anthropic' | 'openai' | 'google' | 'mistral' | 'xai' | 'deepseek' | 'groq' | 'openrouter';

export interface InternalMessage {
  id: string;
  userId: string;
  sessionId: string;
  source: 'cli' | 'telegram' | 'whatsapp' | 'slack' | 'web';
  text: string;
  createdAt: string;
}

export interface TaskClassification {
  complexity: TaskComplexity;
  domain: TaskDomain;
  needsMemory: boolean;
  needsTools: boolean;
  estimatedSteps: number;
  suggestedModel: ModelTier;
  tokenBudget: number;
  confidence: number;
}

export interface ModelChoice {
  tier: ModelTier;
  provider: ModelProvider;
  model: string;
  maxOutputTokens: number;
  rationale: string;
  apiKeyEnvVar: string;
  apiKeyConfigured: boolean;
  estimatedCostUsd: number;
}

export interface CostEntry {
  taskId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  cacheHit: boolean;
  createdAt: string;
}

export interface AgentResult {
  taskId: string;
  classification: TaskClassification;
  model: ModelChoice;
  answer: string;
  ledger: CostEntry[];
  stoppedByBudget: boolean;
}
