import moment from 'moment';

import type {
  OutcomePerson,
  OutcomeSegment,
  StayDetailRow,
  StayOutcome,
  Verdict,
} from './stayOutcome.types';

// Fallbacks only. The backend owns this copy via HOLD_REASON_COPY; a row that
// arrives without holdReasonMessage still gets a real sentence instead of a
// raw reason code leaking to the member.
const FALLBACK_REASON: Record<string, string> = {
  ROOM_UNAVAILABLE:
    'Rooms are full for these dates. You are on the waitlist and will be confirmed if one frees up.',
  ROLLING_WINDOW_LIMIT:
    'This stay goes past the 9-night limit within 30 days. It needs approval from an admin.',
  UTSAV_BOUNDARY:
    'This single night falls on an Utsav boundary date, so it goes to the waitlist for review.',
  MANUAL: 'An admin placed this booking on the waitlist.',
  UNKNOWN: 'This booking is on the waitlist and waiting for review.',
};

const FALLBACK_UNAVAILABLE = 'These dates cannot be booked.';

// A blocked date and a date you already hold are both hard noes. Neither may be
// offered as a waitlist: no cron promotes one, so it would wait forever.
const verdictOf = (row: StayDetailRow): Verdict => {
  if (row.isBlocked || row.isAlreadyBooked) return 'unavailable';
  return row.status === 'available' ? 'confirmed' : 'waitlist';
};

// Verdict order inside a segment: worst news first, so a member never has to
// scroll past a green row to find the one that needs their attention.
const VERDICT_RANK: Record<Verdict, number> = {
  unavailable: 0,
  waitlist: 1,
  confirmed: 2,
};

// Room rows carry `range` (and a `dates` string). Flat rows carry neither, only
// `nights`, so they fall back to the range the member picked.
const rangeOf = (row: StayDetailRow, fallback?: { start: string; end: string }) => {
  if (row.range?.start && row.range?.end) return { start: row.range.start, end: row.range.end };
  const parts = (row.dates || '').split(' to ');
  if (parts[0]) return { start: parts[0], end: parts[1] || parts[0] };
  if (fallback?.start) return { start: fallback.start, end: fallback.end || fallback.start };
  return { start: '', end: '' };
};

/**
 * Turns the flat roomDetails/flatDetails array from /mumukshu/validate into the
 * segment -> verdict -> people tree the outcome UI renders.
 *
 * `names` maps a cardno to a display name (guestInfo / mumukshuInfo in the
 * booking store, or the signed-in member for a self booking).
 *
 * `fallbackRange` supplies the dates for flat rows, which the backend returns
 * without a range.
 */
export function buildStayOutcome(
  rows: StayDetailRow[] | undefined | null,
  names: Record<string, string> = {},
  fallbackRange?: { start: string; end: string }
): StayOutcome | null {
  if (!rows || rows.length === 0) return null;

  const bySegment = new Map<string, OutcomeSegment>();

  for (const row of rows) {
    const { start, end } = rangeOf(row, fallbackRange);
    if (!start) continue;
    const key = `${start}_${end}`;

    if (!bySegment.has(key)) {
      bySegment.set(key, {
        start,
        end,
        nights: row.nights ?? moment(end).diff(moment(start), 'days'),
        isDayVisit: start === end,
        groups: [],
      });
    }
    const segment = bySegment.get(key)!;
    const verdict = verdictOf(row);

    // Guest validate rows key the person as `guest`; mumukshu rows use `mumukshu`.
    const cardno = String(row.mumukshu ?? row.guest ?? '');
    const person: OutcomePerson = {
      cardno,
      name: names[cardno] || cardno,
      verdict,
      reasonMessage:
        verdict === 'waitlist'
          ? row.holdReasonMessage || FALLBACK_REASON[row.holdReason || 'UNKNOWN']
          : verdict === 'unavailable'
            ? row.unavailableReason || FALLBACK_UNAVAILABLE
            : null,
      windowNights: row.holdReasonMeta?.windowNights,
      windowLimit: row.holdReasonMeta?.limit,
      charge: row.charge || 0,
      roomType: row.roomType,
      floorType: row.floorType,
      roomno: row.roomno,
      flatno: row.flatno,
      requiresExtraStayReason: row.requiresExtraStayReason,
    };

    // People collapse into one row only when everything the row states is true
    // for all of them: the verdict, the reason sentence, and the room they asked
    // for. Two people waitlisted for different reasons must stay apart, or the
    // sentence is wrong for one of them. Two people on different room types must
    // stay apart, or the room line is wrong for one of them.
    const group = segment.groups.find(
      (g) =>
        g.verdict === verdict &&
        g.people[0]?.reasonMessage === person.reasonMessage &&
        g.people[0]?.roomType === person.roomType &&
        g.people[0]?.floorType === person.floorType
    );
    if (group) group.people.push(person);
    else segment.groups.push({ verdict, people: [person] });
  }

  const segments = Array.from(bySegment.values()).sort((a, b) => (a.start < b.start ? -1 : 1));
  for (const segment of segments) {
    segment.groups.sort((a, b) => VERDICT_RANK[a.verdict] - VERDICT_RANK[b.verdict]);
  }

  const allVerdicts = segments.flatMap((s) => s.groups.map((g) => g.verdict));
  const distinct = Array.from(new Set(allVerdicts));
  const overall = distinct.length === 1 ? distinct[0] : 'mixed';

  const people = new Set(
    segments.flatMap((s) => s.groups.flatMap((g) => g.people.map((p) => p.cardno)))
  );

  return {
    segments,
    isSplit: segments.length > 1,
    overall,
    totalCharge: rows.reduce((sum, r) => sum + (r.charge || 0), 0),
    requiresExtraStayReason: rows.some((r) => r.requiresExtraStayReason),
    peopleCount: people.size,
  };
}
