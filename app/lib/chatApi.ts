const API_BASE_URL = process.env.EXPO_PUBLIC_CHAT_API_URL ?? 'http://localhost:8000';
const USER_ID = process.env.EXPO_PUBLIC_CHAT_USER_ID ?? 'demo-user';

let tokenCache: string | null = null;

export type ChatSummary = {
  id: string;
  title: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
};

export type ChatMessage = {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  created_at: string;
};

async function getToken(): Promise<string> {
  if (tokenCache) return tokenCache;

  const response = await fetch(`${API_BASE_URL}/auth/dev-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: USER_ID }),
  });
  if (!response.ok) {
    throw new Error(`Failed to obtain auth token: ${response.status}`);
  }

  const body = (await response.json()) as { access_token: string };
  tokenCache = body.access_token;
  return body.access_token;
}

async function authHeaders(): Promise<Record<string, string>> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${await getToken()}`,
  };
}

export async function fetchChats(): Promise<ChatSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/chats`, {
    headers: await authHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch chats: ${response.status}`);
  }
  return response.json();
}

export async function fetchMessages(chatId: string): Promise<ChatMessage[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/chats/${chatId}/messages`, {
    headers: await authHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.status}`);
  }
  return response.json();
}

export async function sendMessage(chatId: string, text: string): Promise<ChatMessage> {
  const response = await fetch(`${API_BASE_URL}/api/v1/chats/messages`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      chat_id: chatId,
      sender_id: USER_ID,
      text,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.status}`);
  }
  return response.json();
}

export function currentUserId(): string {
  return USER_ID;
}
