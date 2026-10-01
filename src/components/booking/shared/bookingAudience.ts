import {
  prepareGuestRequestBody,
  prepareMumukshuRequestBody,
} from '@/src/utils/preparingRequestBody';

import type { Audience } from './useBookingParty';

/**
 * Everything that genuinely differs between booking for yourself, for guests and
 * for mumukshus. It is a short list, which is why three parallel route stacks
 * were never warranted.
 *
 * Self and mumukshu share the same endpoints and payload builder — a self
 * booking is a mumukshu booking with the signed-in member as the only occupant.
 * Only guests have their own pair.
 */

export interface AudienceConfig {
  /** Booking store slice this audience writes to. */
  store: 'guestData' | 'mumukshuData';
  validateUrl: string;
  bookingUrl: string;
  buildPayload: (user: any, data: any) => any;
  /** Route segment, kept so existing links and pushes still resolve. */
  stack: string;
}

export const AUDIENCE_CONFIG: Record<Audience, AudienceConfig> = {
  self: {
    store: 'mumukshuData',
    validateUrl: '/mumukshu/validate',
    bookingUrl: '/mumukshu/booking',
    buildPayload: prepareMumukshuRequestBody,
    stack: 'booking',
  },
  mumukshu: {
    store: 'mumukshuData',
    validateUrl: '/mumukshu/validate',
    bookingUrl: '/mumukshu/booking',
    buildPayload: prepareMumukshuRequestBody,
    stack: 'mumukshuBooking',
  },
  guest: {
    store: 'guestData',
    validateUrl: '/guest/validate',
    bookingUrl: '/guest/booking',
    buildPayload: prepareGuestRequestBody,
    stack: 'guestBooking',
  },
};

/** Which audience a route belongs to, from its first path segment. */
export const audienceFromStack = (stack?: string): Audience =>
  stack === 'guestBooking' ? 'guest' : stack === 'mumukshuBooking' ? 'mumukshu' : 'self';
