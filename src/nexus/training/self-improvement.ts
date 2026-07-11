import type { LocalAgentStore } from '../local-store/types';
import { TRAINING_METHODS, type TrainingMethod, type TrainingMethodId } from './methods';

export interface TrainingSignal {
  userId: string;
  taskId: string;
  accepted: boolean;
  feedback: string;
  methodHint?: TrainingMethodId;
}

export interface TrainingPlan {
  userId: string;
  recommendedMethods: TrainingMethod[];
  blockedMethods: Array<{ method: TrainingMethod; reason: string }>;
}

export class SelfImprovementPlanner {
  constructor(private readonly store: LocalAgentStore) {}

  async recordSignal(signal: TrainingSignal): Promise<void> {
    const feedback = signal.feedback.trim();
    if (!feedback) throw new Error('Training feedback is required.');

    await this.store.put({
      id: `train_${signal.taskId}_${signal.accepted ? 'accepted' : 'rejected'}`,
      kind: 'training_event',
      userId: signal.userId,
      payload: {
        taskId: signal.taskId,
        accepted: signal.accepted,
        feedback,
        methodHint: signal.methodHint ?? 'rag_memory_refresh',
      },
    });
  }

  async plan(userId: string): Promise<TrainingPlan> {
    const events = await this.store.query<{ accepted: boolean; methodHint: TrainingMethodId }>({ userId, kind: 'training_event', limit: 10000 });
    const recommendedMethods: TrainingMethod[] = [];
    const blockedMethods: Array<{ method: TrainingMethod; reason: string }> = [];

    for (const method of TRAINING_METHODS) {
      const matchingEvents = events.filter((event) => event.payload.methodHint === method.id || method.id === 'rag_memory_refresh');
      if (matchingEvents.length >= method.minimumExamples && method.safetyGate === 'automatic') {
        recommendedMethods.push(method);
      } else if (matchingEvents.length >= method.minimumExamples) {
        blockedMethods.push({ method, reason: `${method.name} requires ${method.safetyGate} before execution.` });
      } else {
        blockedMethods.push({ method, reason: `Needs ${method.minimumExamples - matchingEvents.length} more local training event(s).` });
      }
    }

    return { userId, recommendedMethods, blockedMethods };
  }
}
