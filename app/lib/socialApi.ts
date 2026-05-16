import { currentUserId, fetchChats } from './chatApi';

const API_BASE_URL = process.env.EXPO_PUBLIC_CHAT_API_URL ?? 'http://localhost:8000';

let tokenCache: string | null = null;

async function getToken(): Promise<string> {
  if (tokenCache) return tokenCache;
  const response = await fetch(`${API_BASE_URL}/auth/dev-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: currentUserId() }),
  });
  if (!response.ok) throw new Error('auth token failed');
  const data = (await response.json()) as { access_token: string };
  tokenCache = data.access_token;
  return data.access_token;
}

async function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${await getToken()}` };
}

export type Status = { id: string; text: string; created_at: string; user_id: string };
export type Call = { id: string; peer_name: string; direction: string; created_at: string; user_id: string };
export type Profile = {
  user_id: string;
  display_name: string;
  about: string;
  phone: string;
  notifications_enabled: boolean;
  read_receipts_enabled: boolean;
};

export async function listStatuses(): Promise<Status[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/social/statuses`, { headers: await authHeaders() });
  if (!res.ok) throw new Error('status list failed');
  return res.json();
}

export async function postStatus(text: string): Promise<Status> {
  const res = await fetch(`${API_BASE_URL}/api/v1/social/statuses`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('status post failed');
  return res.json();
}

export async function listCalls(): Promise<Call[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/social/calls`, { headers: await authHeaders() });
  if (!res.ok) throw new Error('calls list failed');
  return res.json();
}

export async function createCall(peer_name: string): Promise<Call> {
  const res = await fetch(`${API_BASE_URL}/api/v1/social/calls`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ peer_name }),
  });
  if (!res.ok) throw new Error('call create failed');
  return res.json();
}

export async function getProfile(): Promise<Profile> {
  const res = await fetch(`${API_BASE_URL}/api/v1/social/profile`, { headers: await authHeaders() });
  if (!res.ok) throw new Error('profile get failed');
  return res.json();
}

export async function updateProfile(payload: Omit<Profile, 'user_id'>): Promise<Profile> {
  const res = await fetch(`${API_BASE_URL}/api/v1/social/profile`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('profile update failed');
  return res.json();
}

export async function prewarmApp(): Promise<void> {
  await Promise.all([fetchChats(), listStatuses(), listCalls(), getProfile()]);
}
