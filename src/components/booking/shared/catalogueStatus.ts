import { status } from '@/src/constants';

/**
 * Whether a bookable event is out of seats.
 *
 * A full event is still bookable — it goes on the waitlist — so this decides
 * whether to say so, never whether to allow the tap. The catalogue screens and
 * the add-on sections both need the same answer, so it lives here once: the
 * add-on lists used to show no seat information at all, which let a member pick
 * a full shibir without knowing it.
 */

export const isShibirFull = (item: any): boolean =>
  item?.status === status.STATUS_CLOSED || item?.available_seats === 0;

export const isUtsavFull = (item: any): boolean => item?.utsav_status === status.STATUS_CLOSED;

/** "3 seats left", or nothing when the count is unknown. */
export const seatsLeftLabel = (item: any): string | undefined => {
  const seats = Number(item?.available_seats);
  if (!Number.isFinite(seats) || seats <= 0) return undefined;
  return `${seats} seat${seats === 1 ? '' : 's'} left`;
};
