import moment from 'moment';

export const PAST_BOOKING_GRACE_DAYS = 3;

// A booking only counts as "past" once its end date is this many days old,
// so it stays visible in the active list for a short grace period after it ends.
export function splitActiveAndPastBookings<T>(
  items: T[],
  getEndDate: (item: T) => string | undefined,
  graceDays: number = PAST_BOOKING_GRACE_DAYS
): { activeItems: T[]; pastItems: T[] } {
  const cutoff = moment().subtract(graceDays, 'days');
  const activeItems: T[] = [];
  const pastItems: T[] = [];

  for (const item of items) {
    if (moment(getEndDate(item)).isBefore(cutoff, 'day')) {
      pastItems.push(item);
    } else {
      activeItems.push(item);
    }
  }

  return { activeItems, pastItems };
}
