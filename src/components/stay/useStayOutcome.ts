import { useMemo } from 'react';

import { buildStayOutcome } from './buildStayOutcome';
import type { StayDetailRow } from './stayOutcome.types';

import { useAuthStore, useBookingStore } from '@/src/stores';

type BookingScope = 'self' | 'guest' | 'mumukshu';

/**
 * The single place the app reads a stay verdict from.
 *
 * /validate already returns roomDetails / flatDetails with a per-person,
 * per-segment answer. Both the add-on screen and the review screen call that
 * endpoint, so neither needs a new request — they only needed to stop throwing
 * the answer away.
 */
export function useStayOutcome(scope: BookingScope = 'self') {
  const user = useAuthStore((state) => state.user);
  const mumukshuData = useBookingStore((state) => state.mumukshuData);
  const guestData = useBookingStore((state) => state.guestData);
  const guestInfo = useBookingStore((state) => state.guestInfo);
  const mumukshuInfo = useBookingStore((state) => state.mumukshuInfo);

  const data = scope === 'guest' ? guestData : mumukshuData;

  // cardno -> display name. Falls back to the cardno so a missing name shows an
  // identifier rather than "undefined".
  const names = useMemo(() => {
    const map: Record<string, string> = {};
    if (user?.cardno) {
      map[String(user.cardno)] = 'You';
    }
    for (const entry of (guestInfo as any[]) || []) {
      if (entry?.cardno) map[String(entry.cardno)] = entry.name || String(entry.cardno);
    }
    for (const entry of (mumukshuInfo as any[]) || []) {
      if (entry?.cardno) map[String(entry.cardno)] = entry.name || String(entry.cardno);
    }
    return map;
  }, [user?.cardno, guestInfo, mumukshuInfo]);

  return useMemo(() => {
    const validation = (data as any)?.validationData;
    if (!validation) return null;

    const rows: StayDetailRow[] = validation.roomDetails?.length
      ? validation.roomDetails
      : validation.flatDetails || [];

    const stay = (data as any)?.room || (data as any)?.flat;
    const fallbackRange = stay?.startDay
      ? { start: stay.startDay, end: stay.endDay || stay.startDay }
      : undefined;

    return buildStayOutcome(rows, names, fallbackRange);
  }, [data, names]);
}
