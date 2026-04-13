import AsyncStorage from '@react-native-async-storage/async-storage';

export type StatusItem = {
  id: string;
  name: string;
  text: string;
  createdAt: string;
  mine?: boolean;
};

export type CallRecord = {
  id: string;
  name: string;
  direction: 'incoming' | 'outgoing' | 'missed';
  timestamp: string;
};

const STATUS_KEY = 'chat.status_feed.v1';
const CALLS_KEY = 'chat.call_log.v1';

const now = new Date();

const DEFAULT_STATUS: StatusItem[] = [
  { id: 's1', name: 'Emma', text: 'Shipping the feature today 🚀', createdAt: new Date(now.getTime() - 1000 * 60 * 35).toISOString() },
  { id: 's2', name: 'Ava', text: 'At the airport ✈️', createdAt: new Date(now.getTime() - 1000 * 60 * 90).toISOString() },
  { id: 's3', name: 'Leo', text: 'Coffee + code', createdAt: new Date(now.getTime() - 1000 * 60 * 160).toISOString() },
];

const DEFAULT_CALLS: CallRecord[] = [
  { id: 'c1', name: 'Ava Thompson', direction: 'incoming', timestamp: new Date(now.getTime() - 1000 * 60 * 15).toISOString() },
  { id: 'c2', name: 'Design Team', direction: 'outgoing', timestamp: new Date(now.getTime() - 1000 * 60 * 70).toISOString() },
  { id: 'c3', name: 'Dad', direction: 'missed', timestamp: new Date(now.getTime() - 1000 * 60 * 220).toISOString() },
];

export async function getStatuses(): Promise<StatusItem[]> {
  const raw = await AsyncStorage.getItem(STATUS_KEY);
  if (!raw) {
    await AsyncStorage.setItem(STATUS_KEY, JSON.stringify(DEFAULT_STATUS));
    return DEFAULT_STATUS;
  }

  try {
    return JSON.parse(raw) as StatusItem[];
  } catch {
    return DEFAULT_STATUS;
  }
}

export async function addMyStatus(text: string): Promise<StatusItem[]> {
  const statuses = await getStatuses();
  const newItem: StatusItem = {
    id: `mine-${Date.now()}`,
    name: 'You',
    text,
    mine: true,
    createdAt: new Date().toISOString(),
  };
  const next = [newItem, ...statuses].slice(0, 200);
  await AsyncStorage.setItem(STATUS_KEY, JSON.stringify(next));
  return next;
}

export async function getCallRecords(): Promise<CallRecord[]> {
  const raw = await AsyncStorage.getItem(CALLS_KEY);
  if (!raw) {
    await AsyncStorage.setItem(CALLS_KEY, JSON.stringify(DEFAULT_CALLS));
    return DEFAULT_CALLS;
  }

  try {
    return JSON.parse(raw) as CallRecord[];
  } catch {
    return DEFAULT_CALLS;
  }
}

export async function addCallRecord(name: string): Promise<CallRecord[]> {
  const calls = await getCallRecords();
  const item: CallRecord = {
    id: `call-${Date.now()}`,
    name,
    direction: 'outgoing',
    timestamp: new Date().toISOString(),
  };
  const next = [item, ...calls].slice(0, 500);
  await AsyncStorage.setItem(CALLS_KEY, JSON.stringify(next));
  return next;
}
