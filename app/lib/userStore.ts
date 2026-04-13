import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserProfile = {
  id: string;
  displayName: string;
  about: string;
  phone: string;
  notificationsEnabled: boolean;
  readReceiptsEnabled: boolean;
};

const PROFILE_KEY = 'chat.user_profile.v1';

const DEFAULT_PROFILE: UserProfile = {
  id: 'demo-user',
  displayName: 'Jordan Taylor',
  about: 'Available',
  phone: '+1 555 0100',
  notificationsEnabled: true,
  readReceiptsEnabled: true,
};

export async function getUserProfile(): Promise<UserProfile> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (!raw) {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE));
    return DEFAULT_PROFILE;
  }

  try {
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) } as UserProfile;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
