// src/features/support/api.ts
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AttachmentRef, TicketDetail, TicketListItem, TicketMessage } from './types';

import { apiClient } from '@/lib/api/client';

interface Envelope<T> {
  message?: string;
  data: T;
}

export const ticketKeys = {
  list: (cardno: string) => ['tickets', cardno],
  detail: (id: string, cardno: string) => ['ticket', id, cardno],
};

export function useTicketList(cardno: string, pageSize = 10) {
  return useInfiniteQuery({
    queryKey: ticketKeys.list(cardno),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await apiClient.get<Envelope<TicketListItem[]>>('/tickets', {
        params: { cardno, page: pageParam, page_size: pageSize },
      });
      return Array.isArray(res.data) ? res.data : [];
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === pageSize ? pages.length + 1 : undefined,
    enabled: !!cardno,
  });
}

export function useTicketDetail(id: string, cardno: string) {
  return useQuery<TicketDetail>({
    queryKey: ticketKeys.detail(id, cardno),
    queryFn: async () => {
      const res = await apiClient.get<Envelope<TicketDetail>>(`/tickets/${id}`, {
        params: { cardno },
      });
      return res.data;
    },
    enabled: !!id && !!cardno,
    refetchOnMount: 'always',
  });
}

export function useCreateTicket(cardno: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      service: string;
      description?: string;
      os?: string;
      app_version?: string;
      metadata?: Record<string, unknown>;
      attachments?: AttachmentRef[];
    }) => apiClient.post('/tickets', { cardno, ...body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ticketKeys.list(cardno) }),
  });
}

// NOTE: send-message keeps its optimistic onMutate/onError/onSettled logic in the
// SCREEN (moved verbatim from [id].tsx) because that logic is coupled to the SSE
// reconciliation contract. This hook exposes only the raw mutationFn shape; the
// screen supplies the optimistic callbacks unchanged. See Task 8.
export function sendTicketMessage(
  id: string,
  cardno: string,
  body: { message?: string; attachments?: AttachmentRef[] }
) {
  return apiClient.post<Envelope<TicketMessage>>(
    `/tickets/${id}/messages`,
    { cardno, sender_type: 'user', ...body },
    { allowToast: false }
  );
}

export function resolveTicket(id: string, cardno: string) {
  return apiClient.patch(`/tickets/${id}/resolve`, { cardno }, { allowToast: false });
}
