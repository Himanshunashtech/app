export type ConnectorCategory =
  | 'social'
  | 'messaging'
  | 'productivity'
  | 'commerce'
  | 'developer'
  | 'crm'
  | 'storage'
  | 'calendar'
  | 'payments'
  | 'marketing';

export type ConnectorAuthMode = 'oauth2_pkce' | 'oauth2_client_credentials' | 'api_key' | 'webhook_signature' | 'no_auth_public_read';
export type ConnectorAction = 'read' | 'search' | 'draft' | 'send_message' | 'publish_post' | 'create_task' | 'update_record';
export type ConnectorRisk = 'read_only' | 'draft_only' | 'external_write' | 'financial' | 'destructive';

export interface AppConnectorDefinition {
  id: string;
  name: string;
  category: ConnectorCategory;
  authModes: ConnectorAuthMode[];
  actions: ConnectorAction[];
  risk: ConnectorRisk;
  mcpServerName: string;
  officialApiBaseUrl?: string;
  requiredScopes: string[];
  enabledByDefault: boolean;
}

export interface DelegatedActionRequest {
  userId: string;
  connectorId: string;
  action: ConnectorAction;
  payload: Record<string, unknown>;
  consentToken?: string;
  credentialRef?: string;
}

export interface DelegatedActionDecision {
  allowed: boolean;
  reason: string;
  requiresHumanConfirmation: boolean;
}
