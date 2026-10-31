import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoredSession {
  isAuthenticated: boolean;
  email: string;
  role: 'superadmin' | 'buyer';
  businessId?: number;
  token?: string;
  businessName?: string;
  ownerName?: string;
  slug?: string;
}

export type UserSession = StoredSession;

const AUTH_STORAGE_KEY = '@sd_cards_auth_session';
const LEGACY_STORAGE_KEY = '@moniq_user_session';

export async function saveSession(session: StoredSession): Promise<void> {
  try {
    const json = JSON.stringify(session);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, json);
  } catch (error) {
    console.error('[AuthStorage] Error saving session:', error);
  }
}

export async function getSession(): Promise<StoredSession | null> {
  try {
    let json = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!json) {
      json = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    }
    if (!json) return null;

    const parsed = JSON.parse(json);
    if (parsed && typeof parsed.isAuthenticated === 'boolean') {
      return parsed as StoredSession;
    }
    return null;
  } catch (error) {
    console.error('[AuthStorage] Error loading session:', error);
    return null;
  }
}

export async function clearSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (error) {
    console.error('[AuthStorage] Error clearing session:', error);
  }
}

export const AuthStorage = {
  saveSession,
  getSession,
  loadSession: getSession,
  clearSession
};

export default AuthStorage;
