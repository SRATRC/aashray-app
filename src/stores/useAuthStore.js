import { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as Sentry from '@sentry/react-native';

import { wifiCache } from '../utils/wifiCache';

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
        wifiCache.clear();
      },
    }),
    {
      name: 'auth-store',
      storage: mmkvStorage,
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// Fires on every state change, including MMKV rehydration on cold start, so
// a crash can always be traced back to the member it happened to. cardno is
// redacted everywhere else (HandleApiCall.js's SENSITIVE_KEYS) because that
// guards against it turning up unintended inside bulk request/response
// dumps — this is the one deliberate, minimal exception: Sentry's dedicated
// user-identity field, with no name/email/phone attached.
//
// Ordering: this file is a static import of src/app/_layout.tsx and so
// finishes evaluating — including this subscribe() registration — before
// _layout.tsx's own top-level Sentry.init() call runs. zustand/persist's
// rehydration is deferred past that point (a microtask), so its first fire
// lands after Sentry.init() too. Calling Sentry.setUser before Sentry.init
// is a silent no-op, not a crash, but if this assumption ever breaks the
// symptom is "cold-start user identity missing," not an error.
useAuthStore.subscribe((state) => {
  Sentry.setUser(state.user?.cardno ? { id: state.user.cardno } : null);
});
