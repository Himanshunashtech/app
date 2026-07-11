import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveModelRegistry, selectCheapestAvailableModel } from '../../.tmp/nexus-build/src/nexus/config/model-registry.js';
import { classifyTask } from '../../.tmp/nexus-build/src/nexus/classifier/task-classifier.js';
import { routeModel } from '../../.tmp/nexus-build/src/nexus/router/model-router.js';

test('model registry marks only providers with user-supplied API keys as available', () => {
  const registry = resolveModelRegistry({ OPENAI_API_KEY: 'sk-test' });
  assert.equal(registry.some((entry) => entry.provider === 'openai' && entry.available), true);
  assert.equal(registry.some((entry) => entry.provider === 'anthropic' && entry.available), false);
});

test('router can use user-provided OpenAI key instead of hard-coded Anthropic only', () => {
  const classification = classifyTask('write a short product update');
  const model = routeModel(classification, {
    env: { OPENAI_API_KEY: 'sk-test' },
    estimatedInputTokens: 500,
    estimatedOutputTokens: 250,
  });
  assert.equal(model.provider, 'openai');
  assert.equal(model.apiKeyEnvVar, 'OPENAI_API_KEY');
  assert.equal(model.apiKeyConfigured, true);
});

test('selection falls back to cheapest metadata when no API key is configured', () => {
  const selected = selectCheapestAvailableModel('haiku', 1000, 500, {});
  assert.equal(selected.available, false);
  assert.equal(typeof selected.model, 'string');
});
