import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();
const SNOOZE_KEY = 'update-snooze-until';

export const getSnoozeUntil = (): number | null => {
  try {
    const value = storage.getString(SNOOZE_KEY);
    if (!value) return null;
    const ts = parseInt(value, 10);
    return Number.isFinite(ts) ? ts : null;
  } catch (e) {
    return null;
  }
};

export const setSnoozeUntil = (timestampMs: number) => {
  try {
    storage.set(SNOOZE_KEY, String(timestampMs));
  } catch (e) {
    // noop
  }
};

export const clearSnooze = () => {
  try {
    storage.delete(SNOOZE_KEY);
  } catch (e) {
    // noop
  }
};

