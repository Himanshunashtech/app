import { classifyTask } from '../classifier/task-classifier';
import { CostGovernor } from '../governor/cost-governor';
import { estimateCostUsd, InMemoryCostLedger } from '../ledger/cost-ledger';
import { routeModel } from '../router/model-router';
import type { AgentResult, InternalMessage } from '../types';

export interface OrchestratorOptions {
  dailyCapUsd?: number;
  taskBudgetUsd?: number;
}

export class NexusOrchestrator {
  private readonly ledger = new InMemoryCostLedger();

  async run(message: InternalMessage, options: OrchestratorOptions = {}): Promise<AgentResult> {
    const classification = classifyTask(message.text);
    const model = routeModel(classification);
    const governor = new CostGovernor({
      dailyCapUsd: options.dailyCapUsd ?? 5,
      taskBudgetUsd: options.taskBudgetUsd ?? Math.max(0.01, classification.tokenBudget * 0.00001),
    });
    const taskId = `task_${message.id}`;
    const estimatedInputTokens = Math.ceil(message.text.length / 4) + 700;
    const estimatedOutputTokens = Math.min(model.maxOutputTokens, classification.estimatedSteps * 160);
    const estimatedCost = estimateCostUsd(model.model, estimatedInputTokens, estimatedOutputTokens, true);
    const gate = governor.checkBeforeCall(estimatedCost);

    if (!gate.allowed) {
      return {
        taskId,
        classification,
        model,
        answer: `Budget guard stopped execution before model call: ${gate.reason}`,
        ledger: [],
        stoppedByBudget: true,
      };
    }

    governor.recordSpend(estimatedCost);
    this.ledger.append({
      taskId,
      model: model.model,
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens,
      costUsd: estimatedCost,
      cacheHit: true,
      createdAt: new Date().toISOString(),
    });

    return {
      taskId,
      classification,
      model,
      answer: buildDryRunAnswer(message.text, classification.estimatedSteps),
      ledger: this.ledger.listByTask(taskId),
      stoppedByBudget: false,
    };
  }
}

function buildDryRunAnswer(task: string, steps: number): string {
  return [
    'Nexus Phase 1 dry run completed.',
    `Task: ${task}`,
    `Bounded execution plan would use at most ${Math.min(steps, 6)} planner step(s), log cost, and stop on budget overrun.`,
  ].join('\n');
}
