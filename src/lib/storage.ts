import { MMKV } from 'react-native-mmkv';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

// The single shared MMKV instance for the app.
export const storage = new MMKV();

// Raw string <-> MMKV adapter. createJSONStorage handles JSON (de)serialization,
// matching the previous behavior of both stores.
const stateStorage: StateStorage = {
  setItem: (key, value) => {
    try {
      storage.set(key, value);
    } catch (error) {
      console.error('Error storing to MMKV:', error);
    }
  },
  getItem: (key) => {
    try {
      return storage.getString(key) ?? null;
    } catch (error) {
      console.error('Error reading from MMKV:', error);
      return null;
    }
  },
  removeItem: (key) => {
    try {
      storage.delete(key);
    } catch (error) {
      console.error('Error removing from MMKV:', error);
    }
  },
};

// Pass this to zustand persist: persist(config, { name, storage: zustandMmkvStorage })
export const zustandMmkvStorage = createJSONStorage(() => stateStorage);
