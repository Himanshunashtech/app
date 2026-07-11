export type TrainingMethodId =
  | 'rag_memory_refresh'
  | 'prompt_optimization'
  | 'supervised_finetuning'
  | 'lora'
  | 'qlora'
  | 'continued_pretraining'
  | 'preference_dpo'
  | 'preference_orpo'
  | 'preference_kto'
  | 'rlhf'
  | 'rlaif'
  | 'distillation'
  | 'tool_trace_imitation'
  | 'eval_driven_selection';

export interface TrainingMethod {
  id: TrainingMethodId;
  name: string;
  purpose: string;
  dataRequired: string[];
  localOnly: boolean;
  mutatesBaseModelWeights: boolean;
  minimumExamples: number;
  safetyGate: 'automatic' | 'human_review' | 'offline_only';
}

export const TRAINING_METHODS: readonly TrainingMethod[] = Object.freeze([
  {
    id: 'rag_memory_refresh',
    name: 'Retrieval memory refresh',
    purpose: 'Improve answers by updating local semantic and episodic memory without changing model weights.',
    dataRequired: ['accepted memories', 'trajectory summaries'],
    localOnly: true,
    mutatesBaseModelWeights: false,
    minimumExamples: 1,
    safetyGate: 'automatic',
  },
  {
    id: 'prompt_optimization',
    name: 'Prompt optimization',
    purpose: 'Refine system and tool prompts from local success/failure traces.',
    dataRequired: ['successful trajectories', 'failed trajectories', 'user feedback'],
    localOnly: true,
    mutatesBaseModelWeights: false,
    minimumExamples: 20,
    safetyGate: 'human_review',
  },
  {
    id: 'supervised_finetuning',
    name: 'Supervised fine-tuning',
    purpose: 'Train a model or adapter on approved input/output examples.',
    dataRequired: ['curated prompt/completion pairs'],
    localOnly: true,
    mutatesBaseModelWeights: true,
    minimumExamples: 200,
    safetyGate: 'offline_only',
  },
  {
    id: 'lora',
    name: 'LoRA adapter training',
    purpose: 'Train a low-rank adapter for domain behavior with lower memory cost than full fine-tuning.',
    dataRequired: ['curated instruction examples'],
    localOnly: true,
    mutatesBaseModelWeights: false,
    minimumExamples: 100,
    safetyGate: 'offline_only',
  },
  {
    id: 'qlora',
    name: 'QLoRA adapter training',
    purpose: 'Train quantized low-rank adapters on commodity local GPUs with reduced VRAM.',
    dataRequired: ['curated instruction examples', 'quantized base model'],
    localOnly: true,
    mutatesBaseModelWeights: false,
    minimumExamples: 100,
    safetyGate: 'offline_only',
  },
  {
    id: 'continued_pretraining',
    name: 'Continued pretraining',
    purpose: 'Adapt a self-hosted base model to a local domain corpus.',
    dataRequired: ['large cleaned text corpus', 'deduplication report'],
    localOnly: true,
    mutatesBaseModelWeights: true,
    minimumExamples: 10000,
    safetyGate: 'offline_only',
  },
  {
    id: 'preference_dpo',
    name: 'Direct Preference Optimization',
    purpose: 'Align responses using chosen/rejected answer pairs without an online RL loop.',
    dataRequired: ['preference pairs'],
    localOnly: true,
    mutatesBaseModelWeights: true,
    minimumExamples: 500,
    safetyGate: 'offline_only',
  },
  {
    id: 'preference_orpo',
    name: 'Odds Ratio Preference Optimization',
    purpose: 'Tune instruction-following from preference data in a single training stage.',
    dataRequired: ['preference pairs'],
    localOnly: true,
    mutatesBaseModelWeights: true,
    minimumExamples: 500,
    safetyGate: 'offline_only',
  },
  {
    id: 'preference_kto',
    name: 'Kahneman-Tversky Optimization',
    purpose: 'Use binary desirable/undesirable feedback when paired preferences are unavailable.',
    dataRequired: ['binary feedback labels'],
    localOnly: true,
    mutatesBaseModelWeights: true,
    minimumExamples: 500,
    safetyGate: 'offline_only',
  },
  {
    id: 'rlhf',
    name: 'Reinforcement Learning from Human Feedback',
    purpose: 'Train policy behavior from a human reward model and offline rollouts.',
    dataRequired: ['reward model data', 'human feedback', 'offline rollouts'],
    localOnly: true,
    mutatesBaseModelWeights: true,
    minimumExamples: 2000,
    safetyGate: 'offline_only',
  },
  {
    id: 'rlaif',
    name: 'Reinforcement Learning from AI Feedback',
    purpose: 'Use judge-model feedback to improve behavior after calibration against human evals.',
    dataRequired: ['judge rubrics', 'calibration set', 'offline rollouts'],
    localOnly: true,
    mutatesBaseModelWeights: true,
    minimumExamples: 2000,
    safetyGate: 'offline_only',
  },
  {
    id: 'distillation',
    name: 'Model distillation',
    purpose: 'Compress stronger-model behavior into a cheaper local model.',
    dataRequired: ['teacher responses', 'student eval suite'],
    localOnly: true,
    mutatesBaseModelWeights: true,
    minimumExamples: 1000,
    safetyGate: 'offline_only',
  },
  {
    id: 'tool_trace_imitation',
    name: 'Tool-trace imitation',
    purpose: 'Improve tool-use plans from successful local trajectories.',
    dataRequired: ['successful tool trajectories', 'final outcomes'],
    localOnly: true,
    mutatesBaseModelWeights: false,
    minimumExamples: 50,
    safetyGate: 'human_review',
  },
  {
    id: 'eval_driven_selection',
    name: 'Eval-driven model selection',
    purpose: 'Route future tasks to the best local or hosted model based on local benchmark results.',
    dataRequired: ['task evals', 'latency metrics', 'cost metrics'],
    localOnly: true,
    mutatesBaseModelWeights: false,
    minimumExamples: 30,
    safetyGate: 'automatic',
  },
]);
