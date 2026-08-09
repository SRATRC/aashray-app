import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import type { Audience } from './useBookingParty';

import { useAuthStore, useBookingStore } from '@/src/stores';
import handleAPICall from '@/src/utils/HandleApiCall';

/**
 * Commits the first step of a booking and advances to the shared lifecycle.
 *
 * Every booking type used to inline this, once per audience — RoomBooking alone
 * carried six copies. The steps are always the same:
 *
 *   1. If booking for guests, register them so each has a cardno.
 *   2. Record who the booking is for, for later display.
 *   3. Write the normalised payload into the booking store.
 *   4. Navigate into the add-on step.
 *
 * Only the payload shape is per-type, so that is the one thing a caller passes.
 */

/** Where the audience's booking data lives, and which route stack renders it. */
const STACK: Record<Audience, string> = {
  self: 'booking',
  guest: 'guestBooking',
  mumukshu: 'mumukshuBooking',
};

interface SubmitArgs {
  /** The store slice and route segment, e.g. 'room' | 'travel' | 'adhyayan'. */
  bookingType: string;
  audience: Audience;
  /** The audience's form, straight from useBookingParty. */
  form: any;
  /**
   * Turns the form into the shape the store and payload builder expect. For a
   * guest booking it receives the form with each row's `cardno` filled in.
   */
  buildPayload: (form: any) => any;
  /** Runs instead of navigating, for bookings that complete in one call. */
  onDone?: () => void;
}

export function useBookingSubmit() {
  const router = useRouter();
  const user = useAuthStore((s: any) => s.user);
  const updateGuestBooking = useBookingStore((s: any) => s.updateGuestBooking);
  const updateMumukshuBooking = useBookingStore((s: any) => s.updateMumukshuBooking);
  const setGuestInfo = useBookingStore((s: any) => s.setGuestInfo);
  const setMumukshuInfo = useBookingStore((s: any) => s.setMumukshuInfo);

  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Registers guests and returns the form with each row's cardno attached. */
  const registerGuests = useCallback(
    (form: any) =>
      new Promise<any>((resolve, reject) => {
        handleAPICall(
          'POST',
          '/guest',
          null,
          { cardno: user.cardno, guests: form.guests },
          (res: any) => {
            const registered = res.guests || [];
            setGuestInfo(
              registered.map((g: any) => ({
                cardno: g.cardno,
                name: g.issuedto || g.name,
              }))
            );
            // Match on the name the row was created with; fall back to position
            // so an unnamed row still receives its card. Each registered guest
            // is consumed once, because two rows can carry the same name — a
            // plain find() gave both of them the first card and left the second
            // guest booked under someone else's number.
            const unclaimed = [...registered];
            const guests = form.guests.map((row: any, i: number) => {
              const at = unclaimed.findIndex(
                (g: any) => g.issuedto === row.name || g.name === row.name
              );
              const match = at >= 0 ? unclaimed.splice(at, 1)[0] : (registered[i] ?? null);
              return match ? { ...row, cardno: match.cardno } : row;
            });
            resolve({ ...form, guests });
          },
          () => {},
          (err: any) => reject(new Error(err?.message || 'Could not save guest details'))
        );
      }),
    [user?.cardno, setGuestInfo]
  );

  const submit = useCallback(
    async ({ bookingType, audience, form, buildPayload, onDone }: SubmitArgs) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      try {
        let resolvedForm = form;

        if (audience === 'guest') {
          resolvedForm = await registerGuests(form);
        }

        if (audience === 'mumukshu') {
          setMumukshuInfo(
            (form.mumukshus || []).map((m: any) => ({
              cardno: m.cardno,
              name: m.issuedto || `${m.firstname || ''} ${m.lastname || ''}`.trim() || m.cardno,
            }))
          );
        }

        const payload = buildPayload(resolvedForm);

        if (audience === 'guest') {
          await updateGuestBooking(bookingType, payload);
        } else {
          // Self bookings ride the mumukshu store and endpoints, with the
          // signed-in member as the single occupant.
          await updateMumukshuBooking(bookingType, payload);
        }

        if (onDone) {
          onDone();
        } else {
          router.push(`/${STACK[audience]}/${bookingType}`);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      registerGuests,
      setMumukshuInfo,
      updateGuestBooking,
      updateMumukshuBooking,
      router,
    ]
  );

  return { submit, isSubmitting, setIsSubmitting };
}

export default useBookingSubmit;
