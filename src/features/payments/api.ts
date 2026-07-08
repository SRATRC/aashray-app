// src/features/payments/api.ts
import { useQuery } from '@tanstack/react-query';

import type { RazorpayOrder, Transaction } from './types';

import { apiClient } from '@/lib/api/client';

const PENDING_STATUS = 'pending,cash pending,failed';

export const paymentKeys = {
  pending: (cardno: string) => ['transactions', cardno, PENDING_STATUS],
};

// GET /profile/transactions — matches the legacy `pendingPayments.tsx` query:
// same params, query key, staleTime, and refetchOnMount.
export function usePendingTransactions(cardno: string) {
  return useQuery<Transaction[]>({
    queryKey: paymentKeys.pending(cardno),
    queryFn: async () => {
      const res = await apiClient.get<{ message?: string; data: Transaction[] }>(
        '/profile/transactions',
        { params: { cardno, page: 1, page_size: 100, status: PENDING_STATUS } }
      );
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!cardno,
    staleTime: 1000 * 60 * 30,
    refetchOnMount: 'always',
  });
}

// POST /razorpay/payv2 — returns the full response envelope (not just `.data`)
// so callers can read `result.data.amount` / `result.data.id` exactly as the
// original screen did.
export function createPaymentOrder(
  cardno: string,
  data: { bookingid: string; category: string }[]
) {
  return apiClient.post<{ message: string; data: RazorpayOrder }>('/razorpay/payv2', {
    cardno,
    data,
  });
}
