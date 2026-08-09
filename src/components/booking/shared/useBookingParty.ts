import { useCallback, useMemo, useState } from 'react';

import { status } from '@/src/constants';
import { useAuthStore } from '@/src/stores';

/**
 * Who a booking is for, and the forms that describe them.
 *
 * Every booking type used to carry its own copy of this: ALL_CHIPS, a guest
 * form, a mumukshu form, and four near-identical handlers each
 * (add / change / remove / validate). Six copies, drifting apart. This is the
 * single implementation.
 *
 * The hook deliberately owns the WHOLE form object, including top-level fields
 * like dates, because every screen kept the audience forms in lockstep by
 * writing the same date into each of them by hand.
 */

export type Audience = 'self' | 'guest' | 'mumukshu';

export const AUDIENCE_LABEL: Record<Audience, string> = {
  self: 'Myself',
  guest: 'Guests',
  mumukshu: 'Mumukshus',
};

interface UseBookingPartyOptions {
  /** Which audiences this booking type supports. Travel has no guest option. */
  allow?: Audience[];
  /** A blank guest row. */
  guestTemplate?: Record<string, any>;
  /** A blank mumukshu row. */
  mumukshuTemplate?: Record<string, any>;
  /** Top-level fields shared by every audience, e.g. { startDay: '', endDay: '' }. */
  shared?: Record<string, any>;
  /** Extra per-row validation on top of the built-in identity checks. */
  validateGuestRow?: (row: any) => boolean;
  validateMumukshuRow?: (row: any) => boolean;
}

const DEFAULT_GUEST = { name: '', gender: '', mobno: '', type: '' };
const DEFAULT_MUMUKSHU = { cardno: '', mobno: '' };

const tenDigits = (v: any) => Boolean(v) && String(v).length === 10;

export function useBookingParty({
  allow = ['self', 'guest', 'mumukshu'],
  guestTemplate = DEFAULT_GUEST,
  mumukshuTemplate = DEFAULT_MUMUKSHU,
  shared = {},
  validateGuestRow,
  validateMumukshuRow,
}: UseBookingPartyOptions = {}) {
  const user = useAuthStore((s: any) => s.user);

  // A card issued to a guest may only ever book for itself.
  const audiences = useMemo<Audience[]>(
    () => (user?.res_status === status.STATUS_GUEST ? ['self'] : allow),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.res_status, allow.join(',')]
  );

  const [audience, setAudience] = useState<Audience>(audiences[0]);

  const initialGuest = useMemo(
    () => ({ ...shared, guests: [{ ...guestTemplate }] }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const initialMumukshu = useMemo(
    () => ({ ...shared, mumukshus: [{ ...mumukshuTemplate }] }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [guestForm, setGuestForm] = useState<any>(initialGuest);
  const [mumukshuForm, setMumukshuForm] = useState<any>(initialMumukshu);
  const [selfForm, setSelfForm] = useState<any>({ ...shared });

  const addGuestForm = useCallback(() => {
    setGuestForm((prev: any) => ({ ...prev, guests: [...prev.guests, { ...guestTemplate }] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeGuestForm = useCallback((index: number) => {
    setGuestForm((prev: any) => ({
      ...prev,
      guests: prev.guests.filter((_: any, i: number) => i !== index),
    }));
  }, []);

  const handleGuestFormChange = useCallback((index: number, field: string, value: any) => {
    setGuestForm((prev: any) => ({
      ...prev,
      guests: prev.guests.map((row: any, i: number) =>
        i === index ? { ...row, [field]: value } : row
      ),
    }));
  }, []);

  const addMumukshuForm = useCallback(() => {
    setMumukshuForm((prev: any) => ({
      ...prev,
      mumukshus: [...prev.mumukshus, { ...mumukshuTemplate }],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeMumukshuForm = useCallback((index: number) => {
    setMumukshuForm((prev: any) => ({
      ...prev,
      mumukshus: prev.mumukshus.filter((_: any, i: number) => i !== index),
    }));
  }, []);

  const handleMumukshuFormChange = useCallback((index: number, field: string, value: any) => {
    setMumukshuForm((prev: any) => ({
      ...prev,
      mumukshus: prev.mumukshus.map((row: any, i: number) =>
        i === index ? { ...row, [field]: value } : row
      ),
    }));
  }, []);

  /**
   * Writes a top-level field into every audience form at once. Screens used to
   * do this by hand, three setState calls per date change, which is how the
   * forms drifted out of step.
   */
  const setSharedField = useCallback((field: string, value: any) => {
    const apply = (prev: any) => ({ ...prev, [field]: value });
    setGuestForm(apply);
    setMumukshuForm(apply);
    setSelfForm(apply);
  }, []);

  const setSharedFields = useCallback((patch: Record<string, any>) => {
    const apply = (prev: any) => ({ ...prev, ...patch });
    setGuestForm(apply);
    setMumukshuForm(apply);
    setSelfForm(apply);
  }, []);

  const reset = useCallback(() => {
    setGuestForm({ ...shared, guests: [{ ...guestTemplate }] });
    setMumukshuForm({ ...shared, mumukshus: [{ ...mumukshuTemplate }] });
    setSelfForm({ ...shared });
    setAudience(audiences[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audiences]);

  // A guest row identified by an existing card only needs a phone number; a new
  // guest needs their details too.
  const guestRowValid = useCallback(
    (row: any) => {
      const base = row.cardno
        ? tenDigits(row.mobno)
        : Boolean(row.name && row.gender && row.type) && tenDigits(row.mobno);
      return base && (validateGuestRow ? validateGuestRow(row) : true);
    },
    [validateGuestRow]
  );

  const mumukshuRowValid = useCallback(
    (row: any) => {
      const base = Boolean(row.cardno) && tenDigits(row.mobno);
      return base && (validateMumukshuRow ? validateMumukshuRow(row) : true);
    },
    [validateMumukshuRow]
  );

  const isPartyValid = useMemo(() => {
    if (audience === 'self') return true;
    if (audience === 'guest') {
      return guestForm.guests.length > 0 && guestForm.guests.every(guestRowValid);
    }
    return mumukshuForm.mumukshus.length > 0 && mumukshuForm.mumukshus.every(mumukshuRowValid);
  }, [audience, guestForm, mumukshuForm, guestRowValid, mumukshuRowValid]);

  const form = audience === 'guest' ? guestForm : audience === 'mumukshu' ? mumukshuForm : selfForm;

  const count =
    audience === 'guest'
      ? guestForm.guests.length
      : audience === 'mumukshu'
        ? mumukshuForm.mumukshus.length
        : 1;

  /** Spread straight onto <GuestForm {...guestFormProps} />. */
  const guestFormProps = {
    guestForm,
    setGuestForm,
    handleGuestFormChange,
    addGuestForm,
    removeGuestForm,
  };

  /** Spread straight onto <OtherMumukshuForm {...mumukshuFormProps} />. */
  const mumukshuFormProps = {
    mumukshuForm,
    setMumukshuForm,
    handleMumukshuFormChange,
    addMumukshuForm,
    removeMumukshuForm,
  };

  return {
    user,
    audience,
    setAudience,
    audiences,
    form,
    count,
    isPartyValid,
    setSharedField,
    setSharedFields,
    reset,
    selfForm,
    setSelfForm,
    guestFormProps,
    mumukshuFormProps,
  };
}

export default useBookingParty;
