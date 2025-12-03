import { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const mmkv = new MMKV();

const mmkvStorage = {
  setItem: (key, value) => {
    try {
      mmkv.set(key, value);
    } catch (error) {
      console.error('Error storing to MMKV:', error);
    }
  },
  getItem: (key) => {
    try {
      const value = mmkv.getString(key);
      return value ?? null;
    } catch (error) {
      console.error('Error reading from MMKV:', error);
      return null;
    }
  },
  removeItem: (key) => {
    try {
      mmkv.delete(key);
    } catch (error) {
      console.error('Error removing from MMKV:', error);
    }
  },
};

export const useDevStore = create(
  persist(
    (set) => ({
      useDevBackend: false,
      devPrNumber: '',
      setUseDevBackend: (value) => set({ useDevBackend: value }),
      setDevPrNumber: (value) => set({ devPrNumber: value }),
    }),
    {
      name: 'dev-store',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
