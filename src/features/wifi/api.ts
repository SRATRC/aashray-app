// src/features/wifi/api.ts
import { useMutation, useQuery } from '@tanstack/react-query';

import type { TempWifiCode, PermanentWifiCode } from './types';

import { apiClient } from '@/lib/api/client';
import { wifiCache } from '@/lib/wifiCache';

interface WifiEnvelope<T> {
  message?: string;
  data: T;
}

export const wifiKeys = {
  temp: (cardno: string) => ['wifi', cardno],
  permanent: (cardno: string) => ['wifi-permanent', cardno],
};

// GET /wifi — temporary passwords. Caches to wifiCache (offline seed) inside the
// queryFn (v5 has no onSuccess). allowToast:false mirrors the legacy call.
export function useTempWifiCodes(cardno: string) {
  return useQuery<TempWifiCode[]>({
    queryKey: wifiKeys.temp(cardno),
    queryFn: async () => {
      const res = await apiClient.get<WifiEnvelope<TempWifiCode[]>>('/wifi', {
        params: { cardno },
        allowToast: false,
      });
      const data = Array.isArray(res.data) ? res.data : [];
      wifiCache.set(`wifi:${cardno}`, data);
      return data;
    },
    enabled: !!cardno,
    staleTime: 1000 * 60 * 30,
    refetchOnMount: 'always',
    initialData: () => wifiCache.get<TempWifiCode[]>(`wifi:${cardno}`) ?? undefined,
  });
}

// GET /wifi/permanent — permanent code status.
export function usePermanentWifiCode(cardno: string) {
  return useQuery<PermanentWifiCode[]>({
    queryKey: wifiKeys.permanent(cardno),
    queryFn: async () => {
      const res = await apiClient.get<WifiEnvelope<PermanentWifiCode[]>>('/wifi/permanent', {
        params: { cardno },
        allowToast: false,
      });
      const data = Array.isArray(res.data) ? res.data : [];
      wifiCache.set(`permanent:${cardno}`, data);
      return data;
    },
    enabled: !!cardno,
    staleTime: 1000 * 60 * 30,
    refetchOnMount: 'always',
    initialData: () => wifiCache.get<PermanentWifiCode[]>(`permanent:${cardno}`) ?? undefined,
  });
}

// GET /wifi/generate — generate a temp code (server side-effect; response ignored).
export function useGenerateTempCode(cardno: string) {
  return useMutation<void, unknown, void>({
    mutationFn: async () => {
      await apiClient.get('/wifi/generate', { params: { cardno } });
    },
  });
}

// POST /wifi/permanent — request a permanent code.
export function useRequestPermanentCode(cardno: string) {
  return useMutation<void, unknown, { deviceType: string }>({
    mutationFn: async ({ deviceType }) => {
      await apiClient.post('/wifi/permanent', { cardno, deviceType });
    },
  });
}

// POST /wifi/permanent/reset — reset an approved permanent code.
export function useResetPermanentCode(cardno: string) {
  return useMutation<void, unknown, number>({
    mutationFn: async (id) => {
      await apiClient.post('/wifi/permanent/reset', { id, cardno });
    },
  });
}
