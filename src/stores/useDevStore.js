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
      /** 'prod' | 'qa' | 'local' — see src/constants/backends.js */
      backend: 'prod',
      /** Only read when backend is 'qa'. */
      qaPrNumber: '',
      /** Only read when backend is 'local'. Blank means DEFAULT_LOCAL_PORT. */
      localPort: '',
      setBackend: (backend) => set({ backend }),
      setQaPrNumber: (qaPrNumber) => set({ qaPrNumber }),
      setLocalPort: (localPort) => set({ localPort }),
    }),
    {
      name: 'dev-store',
      version: 1,
      storage: createJSONStorage(() => mmkvStorage),
      // v0 held a boolean `useDevBackend`, where true meant the QA backend.
      // Without this an existing install rehydrates with no `backend` at all and
      // silently falls back to prod, losing whichever target was selected.
      migrate: (state, version) =>
        version === 0
          ? {
              backend: state?.useDevBackend ? 'qa' : 'prod',
              qaPrNumber: state?.devPrNumber ?? '',
            }
          : state,
    }
  )
);
