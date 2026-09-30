import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

// What a phone lookup fills in. If the phone number changes, none of it is
// about the same person any more; the attendee answers (package, arrival...) stay.
const IDENTITY_KEYS = ['cardno', 'issuedto', 'name', 'gender', 'type', 'res_status', 'mobno'];

const withPhoneChange = (row: any, template: Record<string, any>, value: any) => {
  if (!row.cardno) return { ...row, mobno: value };
  const kept: Record<string, any> = {};
  for (const key of Object.keys(row)) {
    if (!IDENTITY_KEYS.includes(key) && key in template) kept[key] = row[key];
  }
  return { ...template, ...kept, mobno: value };
};

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
  // `allow` is usually an inline array, a new identity every render. Its
  // contents are what matter, so key on the joined string.
  const allowKey = allow.join(',');
  const audiences = useMemo<Audience[]>(
    () =>
      user?.res_status === status.STATUS_GUEST ? ['self'] : (allowKey.split(',') as Audience[]),
    [user?.res_status, allowKey]
  );

  const [audience, setAudience] = useState<Audience>(audiences[0]);

  // The templates and shared fields are usually inline objects, a new identity
  // every render, so the callbacks below must not depend on them. They read the
  // latest values through this ref instead. It is written in an effect (never
  // during render) and only read inside event handlers, after commit.
  const latest = useRef({ shared, guestTemplate, mumukshuTemplate });
  useEffect(() => {
    latest.current = { shared, guestTemplate, mumukshuTemplate };
  });

  // Lazy initialisers: run once, on the first render only.
  const [guestForm, setGuestForm] = useState<any>(() => ({
    ...shared,
    guests: [{ ...guestTemplate }],
  }));
  const [mumukshuForm, setMumukshuForm] = useState<any>(() => ({
    ...shared,
    mumukshus: [{ ...mumukshuTemplate }],
  }));
  const [selfForm, setSelfForm] = useState<any>(() => ({ ...shared }));

  const addGuestForm = useCallback(() => {
    const template = latest.current.guestTemplate;
    setGuestForm((prev: any) => ({ ...prev, guests: [...prev.guests, { ...template }] }));
  }, []);

  const removeGuestForm = useCallback((index: number) => {
    setGuestForm((prev: any) => ({
      ...prev,
      guests: prev.guests.filter((_: any, i: number) => i !== index),
    }));
  }, []);

  const handleGuestFormChange = useCallback((index: number, field: string, value: any) => {
    const template = latest.current.guestTemplate;
    setGuestForm((prev: any) => ({
      ...prev,
      guests: prev.guests.map((row: any, i: number) =>
        i !== index
          ? row
          : field === 'mobno' && value !== row.mobno
            ? withPhoneChange(row, template, value)
            : { ...row, [field]: value }
      ),
    }));
  }, []);

  const addMumukshuForm = useCallback(() => {
    const template = latest.current.mumukshuTemplate;
    setMumukshuForm((prev: any) => ({
      ...prev,
      mumukshus: [...prev.mumukshus, { ...template }],
    }));
  }, []);

  const removeMumukshuForm = useCallback((index: number) => {
    setMumukshuForm((prev: any) => ({
      ...prev,
      mumukshus: prev.mumukshus.filter((_: any, i: number) => i !== index),
    }));
  }, []);

  const handleMumukshuFormChange = useCallback((index: number, field: string, value: any) => {
    const template = latest.current.mumukshuTemplate;
    setMumukshuForm((prev: any) => ({
      ...prev,
      mumukshus: prev.mumukshus.map((row: any, i: number) =>
        i !== index
          ? row
          : field === 'mobno' && value !== row.mobno
            ? withPhoneChange(row, template, value)
            : { ...row, [field]: value }
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
    const current = latest.current;
    setGuestForm({ ...current.shared, guests: [{ ...current.guestTemplate }] });
    setMumukshuForm({ ...current.shared, mumukshus: [{ ...current.mumukshuTemplate }] });
    setSelfForm({ ...current.shared });
    setAudience(audiences[0]);
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
