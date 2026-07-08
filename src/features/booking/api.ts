// src/features/booking/api.ts
import { useInfiniteQuery } from '@tanstack/react-query';

import type { RazorpayOrder, ValidationResponse } from './types';

import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores';

// ---------------------------------------------------------------------------
// Validate / submit — self, guest, mumukshu review screens.
// Each fn returns the raw response body verbatim; callers read `data.order`
// vs `data.data` exactly as today (see per-fn notes) — do NOT unify.
// ---------------------------------------------------------------------------

// POST /mumukshu/validate — used by both the self review screen (self is
// transformed to a mumukshu-of-one before this call) and the mumukshu review
// screen. Response `data` is read straight into the ValidationResponse shape.
export function validateMumukshuBooking(body: unknown) {
  return apiClient.post<{ data: ValidationResponse }>('/mumukshu/validate', body);
}

// POST /mumukshu/booking — self + mumukshu review "Pay Now"/"Confirm"/"Pay
// Later" all hit this. Success envelope carries the Razorpay order under
// `order` (or `{amount: 0}` when fully covered by credits).
export function submitMumukshuBooking(body: unknown) {
  return apiClient.post<{
    message?: string;
    order?: RazorpayOrder;
    waitingBookingCountMap?: unknown;
  }>('/mumukshu/booking', body);
}

// POST /guest/validate — guest review screen. Response `data` is read straight
// into the ValidationResponse shape (then locally enriched with guest names).
export function validateGuestBooking(body: unknown) {
  return apiClient.post<{ data: ValidationResponse }>('/guest/validate', body);
}

// POST /guest/booking — guest review "Pay Now"/"Confirm"/"Pay Later". Success
// envelope carries the Razorpay order under `data` (NOT `order` — different
// from /mumukshu/booking, preserved faithfully, do not unify).
export function submitGuestBooking(body: unknown) {
  return apiClient.post<{
    message?: string;
    data?: RazorpayOrder;
    totalAmount?: number;
    orderId?: string;
  }>('/guest/booking', body);
}

// POST /guest — shared guest-registration endpoint used by RoomBooking,
// FlatBooking, FoodBooking, AdhyayanBooking, EventsBooking pickers. Response
// field is `guests` (not `data`); returns the created guests array directly.
export function createGuests(cardno: string, guests: unknown[]) {
  return apiClient.post<{ guests: unknown[] }>('/guest', { cardno, guests }).then((r) => r.guests);
}

// ---------------------------------------------------------------------------
// Cancellation — one GET (list) + one cancel fn per booking type, matching
// `src/components/cancel booking/*.tsx` exactly (including their allowToast
// overrides).
// ---------------------------------------------------------------------------

// GET /stay/bookings — response body is the bookings array directly (no
// `data` wrapper), unlike every other list endpoint below.
export function getStayBookings(cardno: string, page: number) {
  return apiClient.get<unknown[]>('/stay/bookings', { params: { cardno, page } });
}

// POST /stay/cancel — `bookedFor` is omitted (sent as undefined) when the
// caller passes the sentinel `'NA'`, matching RoomBookingCancellation.tsx.
export function cancelStay(cardno: string, bookingid: string, bookedFor?: string | null) {
  return apiClient.post('/stay/cancel', {
    cardno,
    bookingid,
    bookedFor: bookedFor === 'NA' ? undefined : bookedFor,
  });
}

// GET /adhyayan/getbooked — response body is `{data: [...]}`.
export function getBookedAdhyayan(cardno: string, page: number) {
  return apiClient.get<{ data: unknown[] }>('/adhyayan/getbooked', { params: { cardno, page } });
}

// DELETE /adhyayan/cancel — bookingid is sent in the request BODY (the backend
// reads `req.body.bookingid`), matching the original handleAPICall usage.
export function cancelAdhyayan(cardno: string, bookingid: string) {
  return apiClient.del('/adhyayan/cancel', { cardno, bookingid });
}

// GET /utsav/booking — allowToast:false, matching EventBookingCancellation.tsx
// (a failed fetch here does not pop an error toast).
export function getUtsavBookings(cardno: string | undefined, page: number) {
  return apiClient.get<{ data: unknown[] }>('/utsav/booking', {
    params: { cardno, page },
    allowToast: false,
  });
}

// DELETE /utsav/booking — bookingid in the request BODY (backend reads req.body).
export function cancelUtsavBooking(cardno: string, bookingid: string) {
  return apiClient.del('/utsav/booking', { cardno, bookingid }, { allowToast: false });
}

// GET /travel/booking — allowToast:false, matching TravelBookingCancellation.tsx.
export function getTravelBookings(cardno: string, page: number) {
  return apiClient.get<{ data: unknown[] }>('/travel/booking', {
    params: { cardno, page },
    allowToast: false,
  });
}

// DELETE /travel/booking — bookingid in the request BODY (backend reads req.body).
export function cancelTravelBooking(cardno: string, bookingid: string) {
  return apiClient.del('/travel/booking', { cardno, bookingid }, { allowToast: false });
}

// GET /food/get — response body is `{data: [...]}`.
export function getFoodBookings(params: {
  cardno: string;
  page: number;
  date?: string | null;
  meal?: string;
  spice?: string;
  bookedFor?: string;
}) {
  return apiClient.get<{ data: unknown[] }>('/food/get', { params });
}

// GET /food/getGuestsForFilter — response body is `{data: [...]}`.
export function getFoodGuestsForFilter(cardno: string) {
  return apiClient.get<{ data: unknown[] }>('/food/getGuestsForFilter', { params: { cardno } });
}

// PATCH /food/cancel
export function cancelFood(cardno: string, food_data: unknown[]) {
  return apiClient.patch('/food/cancel', { cardno, food_data });
}

// ---------------------------------------------------------------------------
// Adhyayan/Utsav range + list — used by the addon pickers and the book-now
// hub pickers.
// ---------------------------------------------------------------------------

// GET /adhyayan/getrange — used by AdhyayanAddon/GuestAdhyayanAddon/
// MumukshuAdhyayanAddon to list adhyayans overlapping a room/travel date
// range. Response body is `{data: [...]}`.
export function getAdhyayanRange(params: {
  cardno: string;
  start_date?: string;
  end_date?: string;
}) {
  return apiClient.get<{ data: unknown[] }>('/adhyayan/getrange', { params });
}

// GET /adhyayan/getall — infinite list, matches AdhyayanBooking.tsx's
// useInfiniteQuery config exactly (queryKey, staleTime/gcTime, pagination).
export function useAdhyayanList(cardno: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['adhyayans', cardno],
    queryFn: async ({ pageParam = 1 }: { pageParam?: number }) => {
      const res = await apiClient.get<{ data: unknown[] }>('/adhyayan/getall', {
        params: { cardno, page: pageParam },
      });
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    initialPageParam: 1,
    getNextPageParam: (lastPage: unknown[], pages: unknown[]) => {
      if (!lastPage || !Array.isArray(lastPage) || lastPage.length === 0) return undefined;
      return (pages?.length || 0) + 1;
    },
    enabled: !!cardno,
  });
}

// GET /utsav/upcoming — infinite list, matches EventsBooking.tsx's
// useInfiniteQuery config exactly. Reads cardno from the auth store itself
// (EventsBooking.tsx does the same), so callers don't pass it in.
export function useUtsavList() {
  const cardno = useAuthStore((state) => state.user?.cardno);

  return useInfiniteQuery({
    queryKey: ['utsavs', cardno],
    queryFn: async ({ pageParam = 1 }: { pageParam?: number }) => {
      if (!cardno) return [];
      const res = await apiClient.get<{ data: unknown[] }>('/utsav/upcoming', {
        params: { cardno, page: pageParam },
      });
      return Array.isArray(res.data) ? res.data : [];
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 30,
    getNextPageParam: (lastPage: unknown[], pages: unknown[]) => {
      if (!lastPage || !Array.isArray(lastPage) || lastPage.length === 0) return undefined;
      return (pages?.length || 0) + 1;
    },
    enabled: !!cardno,
  });
}
