import { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const mmkv = new MMKV({ id: 'wifi-store' });

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

export const useWifiStore = create(
  persist(
    (set) => ({
      wifiList: null,
      permanentWifiData: null,
      setWifiList: (wifiList) => set({ wifiList }),
      setPermanentWifiData: (permanentWifiData) => set({ permanentWifiData }),
      clearWifiStore: () => set({ wifiList: null, permanentWifiData: null }),
    }),
    {
      name: 'wifi-store-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
