import { status } from '@/src/constants';

/**
 * Which listed bookings belong on the member's own home screen.
 *
 * The list endpoints also return bookings the member made FOR someone else (the
 * member is `bookedBy`; the guest's card is the owner). Stays name the guest
 * `bookedFor`; the other lists name them `cardno`. The next-stay hero and the
 * upcoming carousel both show the member's own trips, so both use these.
 */

// Anything that is over, refused, or released is not an upcoming booking.
const INACTIVE_STATUSES = new Set(
  [
    status.STATUS_CANCELLED,
    status.STATUS_ADMIN_CANCELLED,
    status.STATUS_REJECTED,
    status.ROOM_STATUS_CHECKEDOUT,
    'seats full cancel',
    'wrong form cancel',
  ].map((s) => String(s).toLowerCase())
);

export const isActiveBooking = (item: any) =>
  !INACTIVE_STATUSES.has(String(item.status ?? '').toLowerCase());

export const isOwnBooking = (item: any, cardno: string) => {
  const owner = item.bookedFor ?? item.cardno;
  return owner == null || String(owner) === String(cardno);
};
