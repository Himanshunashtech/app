export { classifyTask } from './classifier/task-classifier';
export { CostGovernor } from './governor/cost-governor';
export { normalizeCliInput } from './gateway/normalize';
export { NexusOrchestrator } from './orchestrator/state-machine';
export { routeModel } from './router/model-router';
export type { AgentResult, InternalMessage, ModelChoice, TaskClassification } from './types';

export { CONNECTOR_CATALOG, CONNECTOR_COUNT, buildConnectorCatalog, findConnector } from './connectors/app-catalog';
export { evaluateDelegatedAction } from './connectors/consent-policy';
export { createConnectorMcpManifest } from './connectors/mcp-bridge';
export type { AppConnectorDefinition, DelegatedActionDecision, DelegatedActionRequest } from './connectors/types';

export { LocalMachineStore } from './local-store/machine-store';
export { LocalMemoryManager } from './local-store/memory-manager';
export type { LocalAgentStore, LocalRecord, LocalRecordKind, LocalStoreQuery } from './local-store/types';
export { TRAINING_METHODS } from './training/methods';
export { SelfImprovementPlanner } from './training/self-improvement';
export type { TrainingMethod, TrainingMethodId } from './training/methods';
export type { TrainingPlan, TrainingSignal } from './training/self-improvement';
