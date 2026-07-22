import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'wifi-cache' });

// Long-term offline cache for WiFi codes. No expiry: entries are overwritten
// on each successful fetch and cleared on logout. All ops are best-effort — a
// storage failure must never break a fetch or logout.
export const wifiCache = {
  get: <T = unknown>(key: string): T | null => {
    try {
      const value = storage.getString(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      return null;
    }
  },
  set: (key: string, value: unknown): void => {
    try {
      storage.set(key, JSON.stringify(value));
    } catch {
      // ignore write failures
    }
  },
  clear: (): void => {
    try {
      storage.clearAll();
    } catch {
      // ignore
    }
  },
};
