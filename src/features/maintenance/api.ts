// src/features/maintenance/api.ts
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { MaintenanceForm, MaintenanceRequest } from './types';

import { apiClient } from '@/lib/api/client';

export const maintenanceKeys = {
  // Prefix key (no chip) — used by the create mutation so it invalidates
  // every chip variant of the list at once, matching the original screen's
  // `queryClient.invalidateQueries({ queryKey: ['maintenance', cardno] })`.
  base: (cardno: string) => ['maintenance', cardno],
  list: (cardno: string, status: string) => ['maintenance', cardno, status],
};

// GET /maintenance — matches legacy: staleTime 30 min, page-advances while the
// last page is non-empty, stops only on an empty (not merely short) page.
export function useMaintenanceList(cardno: string, status: string) {
  return useInfiniteQuery({
    queryKey: maintenanceKeys.list(cardno, status),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await apiClient.get<{ message?: string; data: MaintenanceRequest[] }>(
        '/maintenance',
        { params: { cardno, page: pageParam, status } }
      );
      return Array.isArray(res.data) ? res.data : [];
    },
    initialPageParam: 1,
    // Original: `if (!lastPage || !Array.isArray(lastPage) || lastPage.length === 0) return undefined;
    // return (pages?.length || 0) + 1;`
    getNextPageParam: (lastPage, pages) =>
      !lastPage || lastPage.length === 0 ? undefined : pages.length + 1,
    enabled: !!cardno,
    staleTime: 1000 * 60 * 30,
  });
}

// POST /maintenance/request — invalidates the cardno-prefix key so it
// refreshes the list regardless of which status chip is currently selected.
export function useCreateMaintenanceRequest(cardno: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: MaintenanceForm) =>
      apiClient.post('/maintenance/request', { cardno, ...form }),
    onSuccess: () => qc.invalidateQueries({ queryKey: maintenanceKeys.base(cardno) }),
  });
}
