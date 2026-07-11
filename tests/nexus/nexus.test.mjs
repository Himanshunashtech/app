import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyTask } from '../../.tmp/nexus-build/src/nexus/classifier/task-classifier.js';
import { CostGovernor } from '../../.tmp/nexus-build/src/nexus/governor/cost-governor.js';
import { normalizeCliInput } from '../../.tmp/nexus-build/src/nexus/gateway/normalize.js';
import { NexusOrchestrator } from '../../.tmp/nexus-build/src/nexus/orchestrator/state-machine.js';
import { routeModel } from '../../.tmp/nexus-build/src/nexus/router/model-router.js';

test('classifies hard architecture tasks for Opus routing', () => {
  const classification = classifyTask('Design a distributed architecture and sharding strategy for multi-region chat');
  assert.equal(classification.complexity, 'hard_reasoning');
  assert.equal(classification.domain, 'coding');
  assert.equal(classification.suggestedModel, 'opus');
});

test('routes trivial tasks to the cheap tier', () => {
  const classification = classifyTask('What time?');
  const model = routeModel(classification);
  assert.equal(model.tier, 'haiku');
});

test('cost governor rejects budget overruns before spend is recorded', () => {
  const governor = new CostGovernor({ dailyCapUsd: 1, taskBudgetUsd: 0.01 });
  const decision = governor.checkBeforeCall(0.02);
  assert.equal(decision.allowed, false);
  assert.match(decision.reason, /budget/i);
  assert.equal(governor.snapshot().spentThisTask, 0);
});

test('normalizer rejects empty CLI input', () => {
  assert.throws(() => normalizeCliInput('   '), /required/);
});

test('orchestrator returns a bounded dry-run result with cost ledger', async () => {
  const message = normalizeCliInput('Refactor the TypeScript API client and run tests');
  const result = await new NexusOrchestrator().run(message);
  assert.equal(result.stoppedByBudget, false);
  assert.equal(result.ledger.length, 1);
  assert.match(result.answer, /bounded execution plan/i);
});
