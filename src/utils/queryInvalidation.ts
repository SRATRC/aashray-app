import type { QueryClient } from '@tanstack/react-query';

/**
 * Every server-state query a completed booking or payment can change. The
 * global query defaults turn off refetch on mount, focus and reconnect, and the
 * tab screens never unmount, so without an explicit invalidation the home
 * carousel and the bookings lists show pre-booking data for the whole session.
 *
 * Prefix keys: each list below matches `[key, cardno, ...]`. `refetchType: 'all'`
 * because `refetchOnMount: false` also suppresses the refetch of an invalidated
 * query when it next mounts — marking stale is not enough here.
 */
const POST_BOOKING_QUERY_KEYS: string[][] = [
  // Home screen
  ['nextStay'],
  ['homeAdhyayans'],
  ['homeTravels'],
  ['homeUtsavs'],
  // Bookings tab lists
  ['roomBooking'],
  ['foodBooking'],
  ['travelBooking'],
  ['adhyayanBooking'],
  ['utsavBooking'],
  // Transaction history, the pending payments screen and the home alert (one
  // shared query, see utils/pendingPayments)
  ['transactions'],
  // Room availability shown on the stay calendar
  ['blockedDates'],
];

/** Also the right call after a cancellation: it frees dates, seats and dues too. */
export const invalidatePostBookingQueries = (queryClient: QueryClient): Promise<unknown> =>
  Promise.all(
    POST_BOOKING_QUERY_KEYS.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey, refetchType: 'all' })
    )
  );
