// src/features/events/api.ts
import { useQuery } from '@tanstack/react-query';

import type { Adhyayan, AdhyayanFeedbackAnswers, Utsav, UtsavFeedbackAnswer } from './types';

import { apiClient } from '@/lib/api/client';

interface Envelope<T> {
  data: T;
  message?: string;
}

export const eventKeys = {
  adhyayan: (id: string, cardno: string) => ['adhyayan', id, cardno],
  // PRESERVE the original (unusual) utsav key so cache behavior is unchanged.
  utsav: (id: string, cardno: string) => ['utsavdeeplink', id, cardno],
};

// GET /adhyayan/:id — matches legacy `['adhyayan', id, cardno]` query, 5 min
// stale/gc, enabled only once both id and cardno are known.
export function useAdhyayanDetail(id: string, cardno: string) {
  return useQuery<Adhyayan>({
    queryKey: eventKeys.adhyayan(id, cardno),
    queryFn: async () => {
      const res = await apiClient.get<Envelope<Adhyayan>>(`/adhyayan/${id}`, {
        params: { cardno },
      });
      return res.data;
    },
    enabled: !!id && !!cardno,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });
}

// GET /utsav/:id — matches legacy `['utsavdeeplink', id, cardno]` query
// (unusual key, kept verbatim). Normalizes `packages` to `[]` when missing,
// as the original screen does.
export function useUtsavDetail(id: string, cardno: string) {
  return useQuery<Utsav>({
    queryKey: eventKeys.utsav(id, cardno),
    queryFn: async () => {
      const res = await apiClient.get<Envelope<Utsav>>(`/utsav/${id}`, { params: { cardno } });
      const u = res.data;
      return { ...u, packages: Array.isArray(u?.packages) ? u.packages : [] };
    },
    enabled: !!id && !!cardno,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });
}

// Shared guest-creation endpoint used by the event register flow. Response field
// is `guests` (not `data`). Returns the created guests array.
export function createGuests(cardno: string, guests: unknown[]) {
  return apiClient.post<{ guests: unknown[] }>('/guest', { cardno, guests }).then((r) => r.guests);
}

// GET /adhyayan/feedback/validate — legacy screen calls handleAPICall with
// `allowToast=false` (last arg) so a 403/etc doesn't pop a toast.
export function validateAdhyayanFeedback(shibir_id: string, cardno: string) {
  return apiClient.get('/adhyayan/feedback/validate', {
    params: { shibir_id, cardno },
    allowToast: false,
  });
}

// POST /adhyayan/feedback — body is FLAT: `{cardno, shibir_id, ...answersByQuestionId}`.
export function submitAdhyayanFeedback(
  cardno: string,
  shibir_id: string,
  answers: AdhyayanFeedbackAnswers
) {
  return apiClient.post('/adhyayan/feedback', { cardno, shibir_id, ...answers });
}

// GET /utsav/feedback/validate — same `allowToast=false` behavior as the adhyayan validate call.
export function validateUtsavFeedback(utsav_id: string, cardno: string) {
  return apiClient.get('/utsav/feedback/validate', {
    params: { utsav_id, cardno },
    allowToast: false,
  });
}

// POST /utsav/feedback — body is `{cardno, utsav_id, answers: [...]}` (ARRAY of
// {question_id, question_text, question_type, answer}), unlike the adhyayan flat body.
export function submitUtsavFeedback(
  cardno: string,
  utsav_id: string,
  answers: UtsavFeedbackAnswer[]
) {
  return apiClient.post('/utsav/feedback', { cardno, utsav_id, answers });
}
