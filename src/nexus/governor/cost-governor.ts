export interface CostGovernorOptions {
  dailyCapUsd: number;
  taskBudgetUsd: number;
  overrunMultiplier?: number;
}

export class CostGovernor {
  private spentThisTask = 0;
  private spentToday = 0;
  private readonly overrunMultiplier: number;

  constructor(private readonly options: CostGovernorOptions) {
    this.overrunMultiplier = options.overrunMultiplier ?? 1.5;
  }

  checkBeforeCall(estimatedCostUsd: number): { allowed: boolean; reason?: string } {
    if (estimatedCostUsd < 0) return { allowed: false, reason: 'Estimated cost cannot be negative.' };
    if (this.spentToday + estimatedCostUsd > this.options.dailyCapUsd) {
      return { allowed: false, reason: 'Daily cost cap reached.' };
    }
    if (this.spentThisTask + estimatedCostUsd > this.options.taskBudgetUsd * this.overrunMultiplier) {
      return { allowed: false, reason: 'Task exceeded allowed budget overrun.' };
    }
    return { allowed: true };
  }

  recordSpend(actualCostUsd: number): void {
    if (actualCostUsd < 0) throw new Error('Actual cost cannot be negative.');
    this.spentThisTask += actualCostUsd;
    this.spentToday += actualCostUsd;
  }

  snapshot() {
    return {
      spentThisTask: this.spentThisTask,
      spentToday: this.spentToday,
      dailyCapUsd: this.options.dailyCapUsd,
      taskBudgetUsd: this.options.taskBudgetUsd,
    };
  }
}
