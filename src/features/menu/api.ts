// src/features/menu/api.ts
import { useQuery } from '@tanstack/react-query';

import type { MenuData } from './types';

import { apiClient } from '@/lib/api/client';

interface MenuEnvelope {
  message?: string;
  data: MenuData | null;
}

export const menuKeys = {
  all: (cardno: string) => ['menu', cardno],
};

// GET /food/menu — matches legacy: staleTime 3 days, no retry, only enabled
// once we have a cardno.
export function useMenu(cardno: string) {
  return useQuery<MenuData | null>({
    queryKey: menuKeys.all(cardno),
    queryFn: async () => {
      const res = await apiClient.get<MenuEnvelope>('/food/menu', {
        params: { cardno },
      });
      return res.data ?? null;
    },
    enabled: !!cardno,
    staleTime: 1000 * 60 * 60 * 24 * 3,
    retry: false,
  });
}
