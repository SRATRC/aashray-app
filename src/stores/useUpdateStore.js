import { create } from 'zustand';

// The launch update check's answer when this phone's OS can't install the required
// release, so the Profile banner can explain it. Not persisted: every launch re-checks.
export const useUpdateStore = create((set) => ({
  // { minOsVersion, updateVersion, storeUrl } or null
  unsupported: null,
  setUnsupported: (value) => set({ unsupported: value }),
}));
