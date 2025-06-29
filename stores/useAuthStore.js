import { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const mmkv = new MMKV();

const mmkvStorage = {
  setItem: (key, value) => {
    try {
      // The `value` is the state object, we need to stringify it
      mmkv.set(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error storing to MMKV:', error);
    }
  },
  getItem: (key) => {
    try {
      const value = mmkv.getString(key);
      // The value is a string, we need to parse it
      return value ? JSON.parse(value) : null;
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

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => {
        set({ user: null });
      },
    }),
    {
      name: 'auth-store',
      storage: mmkvStorage,
      partialize: (state) => ({ user: state.user }),
    }
  )
);