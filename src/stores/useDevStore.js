import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandMmkvStorage } from '../lib/storage';

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
      storage: zustandMmkvStorage,
    }
  )
);
