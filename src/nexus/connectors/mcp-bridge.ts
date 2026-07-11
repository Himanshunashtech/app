import { CONNECTOR_CATALOG } from './app-catalog';
import type { AppConnectorDefinition } from './types';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    required: string[];
    properties: Record<string, unknown>;
  };
}

export interface McpServerManifest {
  name: string;
  version: string;
  tools: McpToolDefinition[];
}

export function createConnectorMcpManifest(connectors: readonly AppConnectorDefinition[] = CONNECTOR_CATALOG): McpServerManifest {
  return {
    name: 'nexus-connector-mcp',
    version: '1.0.0',
    tools: [
      buildListConnectorsTool(connectors.length),
      buildRequestDelegatedActionTool(),
    ],
  };
}

function buildListConnectorsTool(connectorCount: number): McpToolDefinition {
  return {
    name: 'list_connectors',
    description: `List ${connectorCount}+ available Nexus connector definitions with auth modes, scopes, and supported actions.`,
    inputSchema: {
      type: 'object',
      required: [],
      properties: {
        category: { type: 'string', description: 'Optional connector category filter.' },
      },
    },
  };
}

function buildRequestDelegatedActionTool(): McpToolDefinition {
  return {
    name: 'request_delegated_action',
    description: 'Request a consent-checked action through an official app API connector. Write actions require credentialRef and consentToken.',
    inputSchema: {
      type: 'object',
      required: ['userId', 'connectorId', 'action', 'payload', 'credentialRef'],
      properties: {
        userId: { type: 'string', minLength: 1 },
        connectorId: { type: 'string', minLength: 1 },
        action: { type: 'string', enum: ['read', 'search', 'draft', 'send_message', 'publish_post', 'create_task', 'update_record'] },
        payload: { type: 'object' },
        credentialRef: { type: 'string', description: 'Opaque reference to encrypted user credentials in the secrets vault.' },
        consentToken: { type: 'string', description: 'Required for external writes, sends, and publishes.' },
      },
    },
  };
}
