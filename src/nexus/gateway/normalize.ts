import type { InternalMessage } from '../types';

export function normalizeCliInput(text: string, overrides: Partial<Pick<InternalMessage, 'userId' | 'sessionId'>> = {}): InternalMessage {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Task text is required.');

  return {
    id: cryptoRandomId(),
    userId: overrides.userId ?? 'local-user',
    sessionId: overrides.sessionId ?? 'local-session',
    source: 'cli',
    text: trimmed,
    createdAt: new Date().toISOString(),
  };
}

function cryptoRandomId(): string {
  const random = globalThis.crypto?.randomUUID?.();
  return random ?? `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
