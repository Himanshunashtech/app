import assert from 'node:assert/strict';
import test from 'node:test';

import { LocalMachineStore } from '../../.tmp/nexus-build/src/nexus/local-store/machine-store.js';
import { LocalMemoryManager } from '../../.tmp/nexus-build/src/nexus/local-store/memory-manager.js';
import { TRAINING_METHODS } from '../../.tmp/nexus-build/src/nexus/training/methods.js';
import { SelfImprovementPlanner } from '../../.tmp/nexus-build/src/nexus/training/self-improvement.js';
import { classifyTask } from '../../.tmp/nexus-build/src/nexus/classifier/task-classifier.js';
import { routeModel } from '../../.tmp/nexus-build/src/nexus/router/model-router.js';

test('local machine store persists memory without backend services', async () => {
  const store = new LocalMachineStore();
  const memory = new LocalMemoryManager(store);
  await memory.remember({ userId: 'user_1', text: 'Caloi uses Supabase edge functions', source: 'conversation', importance: 0.9 });

  const results = await memory.retrieve('user_1', 'Supabase edge function cold start', 3);
  assert.equal(results.length, 1);
  assert.match(results[0].text, /Supabase/);
});

test('training catalog includes advanced local/self-hosted methods', () => {
  const methodIds = new Set(TRAINING_METHODS.map((method) => method.id));
  for (const expected of ['lora', 'qlora', 'preference_dpo', 'preference_orpo', 'preference_kto', 'rlhf', 'rlaif', 'distillation']) {
    assert.equal(methodIds.has(expected), true);
  }
  assert.equal(TRAINING_METHODS.every((method) => method.localOnly), true);
});

test('self improvement planner records local feedback and gates unsafe training', async () => {
  const store = new LocalMachineStore();
  const planner = new SelfImprovementPlanner(store);
  await planner.recordSignal({ userId: 'user_1', taskId: 'task_1', accepted: false, feedback: 'Prefer shorter replies', methodHint: 'prompt_optimization' });

  const plan = await planner.plan('user_1');
  assert.equal(plan.recommendedMethods.some((method) => method.id === 'rag_memory_refresh'), true);
  assert.equal(plan.blockedMethods.some((entry) => entry.method.id === 'prompt_optimization'), true);
});

test('local self-hosted model endpoint is preferred when configured', () => {
  const classification = classifyTask('summarize this note');
  const model = routeModel(classification, {
    env: { OLLAMA_BASE_URL: 'http://localhost:11434' },
    estimatedInputTokens: 1000,
    estimatedOutputTokens: 300,
  });
  assert.equal(model.provider, 'ollama');
  assert.equal(model.estimatedCostUsd, 0);
});
