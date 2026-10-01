import { status } from '@/src/constants';

/**
 * Shared tag style for a stay row coming back from /validate, used by every
 * booking-detail card (Room/Flat x self/Mumukshu/Guest).
 *
 * Three answers, three colors:
 *  - green  -> confirmed (status === available)
 *  - orange -> waitlist (status === waiting), whatever the hold reason
 *  - gray   -> cannot be booked (isBlocked or isAlreadyBooked)
 *
 * Red is deliberately absent. A waitlist is "yes, but", not a failure, and a
 * blocked date is not the member's mistake. Red stays reserved for cancelled and
 * failed states on the bookings list.
 *
 * This previously colored a waitlist RED unless the hold reason was
 * ROLLING_WINDOW_LIMIT, so ROOM_UNAVAILABLE, UTSAV_BOUNDARY and MANUAL — three
 * of the four reasons — looked to the member like the booking had failed.
 *
 * `bookings` is the full (unfiltered) array for the group; filtering by
 * `statusKey` happens here, as it did before.
 */
const rowsFor = (statusKey: string, bookings: any[] | undefined | null) =>
  (bookings || []).filter((b: any) => b.status == statusKey);

const cannotBook = (statusKey: string, bookings: any[] | undefined | null) => {
  const rows = rowsFor(statusKey, bookings);
  return rows.length > 0 && rows.every((b: any) => b.isBlocked || b.isAlreadyBooked);
};

export const getStatusTagStyle = (statusKey: string, bookings: any[] | undefined | null) => {
  if (cannotBook(statusKey, bookings)) {
    return { textStyles: 'text-gray-600', containerStyles: 'bg-gray-100 mx-1' };
  }
  if (statusKey == status.STATUS_AVAILABLE) {
    return { textStyles: 'text-green-200', containerStyles: 'bg-green-100 mx-1' };
  }
  return { textStyles: 'text-secondary-200', containerStyles: 'bg-secondary-50 mx-1' };
};

/**
 * The member-facing word for a raw /validate status. The backend words
 * `available` and `waiting` must never reach a member.
 */
export const getStatusTagLabel = (statusKey: string, bookings: any[] | undefined | null) => {
  if (cannotBook(statusKey, bookings)) return 'Unavailable';
  return statusKey == status.STATUS_AVAILABLE ? 'Confirmed' : 'Waitlist';
};
