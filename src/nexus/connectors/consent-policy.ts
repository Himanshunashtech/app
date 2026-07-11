import { findConnector } from './app-catalog';
import type { DelegatedActionDecision, DelegatedActionRequest } from './types';

const EXTERNAL_WRITE_ACTIONS = new Set(['send_message', 'publish_post', 'create_task', 'update_record']);

export function evaluateDelegatedAction(request: DelegatedActionRequest): DelegatedActionDecision {
  const connector = findConnector(request.connectorId);
  if (!connector) {
    return deny('Unknown connector.', false);
  }
  if (!connector.actions.includes(request.action)) {
    return deny(`Connector ${connector.id} does not support ${request.action}.`, false);
  }
  if (!request.credentialRef) {
    return deny('A credential reference is required. Nexus does not bypass third-party authentication.', true);
  }
  if (EXTERNAL_WRITE_ACTIONS.has(request.action) && !request.consentToken) {
    return deny('Human consent token is required before Nexus can send or publish on behalf of a user.', true);
  }
  if (connector.authModes.includes('no_auth_public_read') && EXTERNAL_WRITE_ACTIONS.has(request.action)) {
    return deny('Unauthenticated connectors are limited to public read-only operations.', true);
  }

  return {
    allowed: true,
    reason: 'Delegated action satisfies connector capability, credential, and consent requirements.',
    requiresHumanConfirmation: false,
  };
}

function deny(reason: string, requiresHumanConfirmation: boolean): DelegatedActionDecision {
  return { allowed: false, reason, requiresHumanConfirmation };
}
