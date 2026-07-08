// src/features/profile/api.ts
import { useInfiniteQuery } from '@tanstack/react-query';

import type { Profile, ProfileFormData, Transaction } from './types';

import { apiClient } from '@/lib/api/client';
import type { ApiEnvelope } from '@/lib/api/types';

export const profileKeys = {
  transactions: (cardno: string, status: string) => ['transactions', cardno, status],
};

// GET /profile
export function fetchProfile(cardno: string) {
  return apiClient
    .get<ApiEnvelope<Profile>>('/profile', { params: { cardno } })
    .then((r) => r.data);
}

// PUT /profile
export function updateProfile(cardno: string, form: ProfileFormData) {
  return apiClient.put<ApiEnvelope<Profile>>('/profile', { cardno, ...form }).then((r) => r.data);
}

// POST /client/updatePassword
export function updatePassword(cardno: string, current_password: string, new_password: string) {
  return apiClient.post('/client/updatePassword', { cardno, current_password, new_password });
}

// GET /client/logout
export function logoutRequest(cardno: string) {
  return apiClient.get('/client/logout', { params: { cardno } });
}

// GET /profile/transactions — matches legacy `transactions.tsx`: default status
// 'all', staleTime 30 min, and the empty-page heuristic (NOT pagination.hasMore)
// for `getNextPageParam`.
export function useTransactions(cardno: string, status: string = 'all') {
  return useInfiniteQuery({
    queryKey: profileKeys.transactions(cardno, status),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await apiClient.get<ApiEnvelope<Transaction[]>>('/profile/transactions', {
        params: { cardno, page: pageParam, status },
      });
      return Array.isArray(res.data) ? res.data : [];
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      !lastPage || lastPage.length === 0 ? undefined : pages.length + 1,
    enabled: !!cardno,
    staleTime: 1000 * 60 * 30,
  });
}
