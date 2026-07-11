import type { TaskClassification, TaskComplexity, TaskDomain } from '../types';

const HARD_REASONING_PATTERNS = /\b(architecture|multi-file|distributed|race condition|deadlock|sharding|migration strategy|ambiguous debugging|root cause)\b/i;
const CODING_PATTERNS = /\b(code|typescript|javascript|react|node|supabase|redis|sql|bug|refactor|api|test|lint|deploy|architecture|sharding|multi-region|distributed)\b/i;
const RESEARCH_PATTERNS = /\b(research|compare|latest|find|sources|cite|market|competitor)\b/i;
const SCHEDULING_PATTERNS = /\b(schedule|calendar|remind|appointment|meeting|tomorrow|today)\b/i;
const WRITING_PATTERNS = /\b(write|draft|rewrite|summarize|email|copy|proposal|spec)\b/i;
const TOOL_PATTERNS = /\b(run|build|test|lint|commit|deploy|fetch|create|update|delete|query)\b/i;

export function classifyTask(text: string): TaskClassification {
  const normalized = text.trim();
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  const domain = inferDomain(normalized);
  const complexity = inferComplexity(normalized, wordCount);
  const estimatedSteps = estimateSteps(complexity, normalized);

  return {
    complexity,
    domain,
    needsMemory: domain === 'coding' || /\b(remember|previous|again|my project|caloi|indihunt)\b/i.test(normalized),
    needsTools: domain === 'coding' || TOOL_PATTERNS.test(normalized),
    estimatedSteps,
    suggestedModel: complexity === 'hard_reasoning' || estimatedSteps > 8 ? 'opus' : complexity === 'trivial' ? 'haiku' : 'sonnet',
    tokenBudget: tokenBudgetFor(complexity, estimatedSteps),
    confidence: Math.min(0.95, 0.55 + Math.min(wordCount, 80) / 200),
  };
}

function inferDomain(text: string): TaskDomain {
  if (CODING_PATTERNS.test(text)) return 'coding';
  if (RESEARCH_PATTERNS.test(text)) return 'research';
  if (SCHEDULING_PATTERNS.test(text)) return 'scheduling';
  if (WRITING_PATTERNS.test(text)) return 'writing';
  return 'other';
}

function inferComplexity(text: string, wordCount: number): TaskComplexity {
  if (HARD_REASONING_PATTERNS.test(text)) return 'hard_reasoning';
  if (wordCount <= 5 && !TOOL_PATTERNS.test(text)) return 'trivial';
  if (wordCount <= 20) return 'simple';
  if (wordCount <= 80) return 'moderate';
  return 'complex';
}

function estimateSteps(complexity: TaskComplexity, text: string): number {
  const base = { trivial: 1, simple: 2, moderate: 4, complex: 6, hard_reasoning: 8 }[complexity];
  const explicitWork = (text.match(/\b(and|then|also|plus|after)\b/gi) ?? []).length;
  return Math.min(10, base + Math.floor(explicitWork / 2));
}

function tokenBudgetFor(complexity: TaskComplexity, estimatedSteps: number): number {
  const base = { trivial: 800, simple: 2000, moderate: 4000, complex: 7000, hard_reasoning: 12000 }[complexity];
  return base + Math.max(0, estimatedSteps - 4) * 500;
}
