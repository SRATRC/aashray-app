// Shapes returned by /mumukshu/validate (roomDetails / flatDetails). Only the
// fields the outcome UI reads are declared here; the endpoint returns more.
export type HoldReason =
  | 'ROLLING_WINDOW_LIMIT'
  | 'ROOM_UNAVAILABLE'
  | 'UTSAV_BOUNDARY'
  | 'MANUAL'
  | 'UNKNOWN';

export interface StayDetailRow {
  // Room / mumukshu rows key the person as `mumukshu`; guest rows use `guest`.
  mumukshu?: string;
  guest?: string;
  status: 'available' | 'waiting';
  charge: number;
  availableCredits?: number;
  holdReason?: HoldReason | null;
  holdReasonMeta?: { windowNights?: number; limit?: number } | null;
  // Backend-owned sentence for holdReason (HOLD_REASON_COPY[x].userMessage).
  holdReasonMessage?: string | null;
  dates?: string;
  range?: { start: string; end: string; overlappingWithUtsav?: boolean };
  nights: number;
  roomType?: string;
  floorType?: string;
  gender?: string;
  // A hard no: the centre is closed, or an Utsav this card does not attend.
  isBlocked?: boolean;
  // A hard no: this card already holds an overlapping room or flat booking.
  isAlreadyBooked?: boolean;
  // Backend-owned sentence for a hard no.
  unavailableReason?: string | null;
  requiresExtraStayReason?: boolean;
  roomno?: string;
  // Flat rows carry a flat number instead of a room number.
  flatno?: string | number;
}

// The three answers a member can get. Derived, never sent by the backend.
export type Verdict = 'confirmed' | 'waitlist' | 'unavailable';

export interface OutcomePerson {
  cardno: string;
  name: string;
  verdict: Verdict;
  reasonMessage?: string | null;
  windowNights?: number;
  windowLimit?: number;
  charge: number;
  roomType?: string;
  floorType?: string;
  roomno?: string;
  flatno?: string | number;
  requiresExtraStayReason?: boolean;
}

export interface OutcomeSegment {
  start: string;
  end: string;
  nights: number;
  // A day visit is checkin === checkout: 0 nights, no rolling-window cost.
  isDayVisit: boolean;
  // Grouped so people who share a verdict share a row.
  groups: { verdict: Verdict; people: OutcomePerson[] }[];
}

export interface StayOutcome {
  segments: OutcomeSegment[];
  // True when one requested range became more than one booking (Utsav split).
  isSplit: boolean;
  // Rolls up across every person and segment.
  overall: Verdict | 'mixed';
  totalCharge: number;
  requiresExtraStayReason: boolean;
  peopleCount: number;
}
