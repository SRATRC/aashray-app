// src/features/booking/types.ts

export type { BookingType } from '@/stores/bookingTypes';

/**
 * A single line-item inside a validation response's `*Details` collections
 * (room/adhyayan/utsav/flat entries, or the travel/food singleton). Callers
 * deep-access type-specific fields (mumukshu, shibirName, roomno, nights,
 * pickup, drop, ...) that vary per booking type without narrowing — this
 * mirrors the `[key: string]: any` shape used by the 3 hand-rolled local
 * `ValidationData` interfaces this type replaces (self/guest/mumukshu review
 * screens).
 */
export interface ValidationDetailItem {
  charge: number;
  availableCredits?: number;
  [key: string]: unknown;
}

/**
 * Canonical shape of the `data` field returned by `POST /mumukshu/validate`
 * and `POST /guest/validate`. `roomDetails`/`adhyayanDetails`/`utsavDetails`/
 * `flatDetails` are arrays; `travelDetails` is always a single object.
 * `foodDetails` is inconsistent across the two review screens today — the
 * guest review screen reads it as a single object, the mumukshu review
 * screen reduces it as an array — so it stays a union here rather than
 * unifying (unifying would be a behavior change to one of the two screens).
 */
export interface ValidationResponse {
  roomDetails?: ValidationDetailItem[];
  flatDetails?: ValidationDetailItem[];
  adhyayanDetails?: ValidationDetailItem[];
  foodDetails?: ValidationDetailItem | ValidationDetailItem[];
  travelDetails?: ValidationDetailItem;
  utsavDetails?: ValidationDetailItem[];
  totalCharge: number;
}

/**
 * The Razorpay order envelope embedded in `POST /mumukshu/booking` (as
 * `order`) and `POST /guest/booking` (as `data`) success responses. When the
 * charge is fully covered by credits, the backend instead returns
 * `{amount: 0}` with no `id` — callers short-circuit on `amount === 0`
 * before reading `id`, so `id` stays optional here.
 */
export interface RazorpayOrder {
  id?: string;
  amount: number;
}
