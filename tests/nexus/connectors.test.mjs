import assert from 'node:assert/strict';
import test from 'node:test';

import { CONNECTOR_CATALOG, CONNECTOR_COUNT, findConnector } from '../../.tmp/nexus-build/src/nexus/connectors/app-catalog.js';
import { evaluateDelegatedAction } from '../../.tmp/nexus-build/src/nexus/connectors/consent-policy.js';
import { createConnectorMcpManifest } from '../../.tmp/nexus-build/src/nexus/connectors/mcp-bridge.js';

test('connector catalog exposes 300+ app definitions', () => {
  assert.equal(CONNECTOR_COUNT >= 300, true);
  assert.equal(CONNECTOR_CATALOG.some((connector) => connector.id === 'whatsapp'), true);
  assert.equal(CONNECTOR_CATALOG.some((connector) => connector.id === 'google_drive'), true);
});

test('delegated send is denied without credential and consent', () => {
  const decision = evaluateDelegatedAction({
    userId: 'user_123',
    connectorId: 'whatsapp',
    action: 'send_message',
    payload: { text: 'hello' },
  });
  assert.equal(decision.allowed, false);
  assert.match(decision.reason, /credential/i);
});

test('delegated send is allowed with credential reference and consent token', () => {
  const decision = evaluateDelegatedAction({
    userId: 'user_123',
    connectorId: 'whatsapp',
    action: 'send_message',
    payload: { text: 'hello' },
    credentialRef: 'vault://users/user_123/whatsapp',
    consentToken: 'consent_abc',
  });
  assert.equal(decision.allowed, true);
});

test('MCP manifest exposes list and delegated action tools', () => {
  const manifest = createConnectorMcpManifest();
  assert.equal(manifest.name, 'nexus-connector-mcp');
  assert.deepEqual(manifest.tools.map((tool) => tool.name), ['list_connectors', 'request_delegated_action']);
});

test('catalog definitions default disabled until explicit user setup', () => {
  const connector = findConnector('instagram');
  assert.equal(connector?.enabledByDefault, false);
  assert.equal(connector?.authModes.includes('oauth2_pkce'), true);
});
