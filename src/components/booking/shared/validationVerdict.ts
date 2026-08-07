import type { Verdict } from '@/src/components/stay/stayOutcome.types';

/**
 * Reads the answer /validate gives for one booking type.
 *
 * The endpoint replies in two shapes: a stay carries a per-person `status`,
 * while a shibir or Utsav carries seat counts. Both the charges list and the
 * summary card need the same reading of them, so it lives here once.
 */

/** Store key -> the key /validate answers under. */
export const DETAIL_KEY: Record<string, string> = {
  room: 'roomDetails',
  flat: 'flatDetails',
  food: 'foodDetails',
  travel: 'travelDetails',
  adhyayan: 'adhyayanDetails',
  utsav: 'utsavDetails',
};

/**
 * A detail key holds one object or an array of them. A booking type that is not
 * part of the request comes back as `{}` or `[]`, so empty rows are dropped —
 * otherwise every absent type renders as a blank line.
 */
export const rowsOf = (value: any): any[] => {
  if (value == null) return [];
  const rows = Array.isArray(value) ? value : [value];
  return rows.filter((r) => r && typeof r === 'object' && Object.keys(r).length > 0);
};

/** Bookable, but not granted yet. */
export const isWaitlistedRow = (row: any): boolean => {
  if (row?.status) return row.status === 'waiting';
  if (row?.available != null || row?.waiting != null) {
    return Number(row.available) === 0 && Number(row.waiting) > 0;
  }
  return false;
};

/** Not bookable at all, so no waitlist would ever promote it. */
export const isUnavailableRow = (row: any): boolean =>
  Boolean(row?.isBlocked || row?.isAlreadyBooked || row?.unavailableReason);

export const rowsForType = (validationData: any, type: string): any[] =>
  rowsOf(validationData?.[DETAIL_KEY[type] ?? `${type}Details`]);

/**
 * The verdict for one booking type, or undefined when the answer says nothing
 * about it. The worst row wins: one person who cannot be booked matters more
 * than the others who can.
 */
export function verdictForType(validationData: any, type: string): Verdict | undefined {
  const rows = rowsForType(validationData, type);
  if (rows.length === 0) return undefined;
  if (rows.some(isUnavailableRow)) return 'unavailable';
  if (rows.some(isWaitlistedRow)) return 'waitlist';
  return 'confirmed';
}
