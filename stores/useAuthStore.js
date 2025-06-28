import { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const mmkv = new MMKV();

const mmkvStorage = {
  setItem: (key, value) => {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      mmkv.set(key, stringValue);
    } catch (error) {
      console.error('Error storing to MMKV:', error);
    }
  },
  getItem: (key) => {
    try {
      return mmkv.getString(key) ?? null;
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
    (set, get) => ({
      user: null,
      loading: true,

      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),

      removeItem: (key) => {
        try {
          mmkv.delete(key);
        } catch (error) {
          console.error('Error removing item from MMKV:', error);
        }
      },

      initializeAuth: async () => {
        try {
          set({ loading: true });

          const userData = mmkv.getString('user');
          const user = userData ? JSON.parse(userData) : null;

          set({ user, loading: false });
        } catch (error) {
          console.error('Error initializing auth:', error);
          set({ user: null, loading: false });
        }
      },

      logout: () => {
        set({ user: null });
        try {
          mmkv.delete('user');
        } catch (error) {
          console.error('Error clearing auth data:', error);
        }
      },
    }),
    {
      name: 'auth-store',
      storage: mmkvStorage,
      partialize: (state) => ({ user: state.user }),
    }
  )
);
