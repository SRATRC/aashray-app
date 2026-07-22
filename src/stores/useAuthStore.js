import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandMmkvStorage } from '../lib/storage';

import { wifiCache } from '@/lib/wifiCache';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => {
        set({ user: null });
        wifiCache.clear();
      },
    }),
    {
      name: 'auth-store',
      storage: zustandMmkvStorage,
      partialize: (state) => ({ user: state.user }),
    }
  )
);
