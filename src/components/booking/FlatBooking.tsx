import { useFocusEffect } from 'expo-router';
import moment from 'moment';
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import BookingShell from './shared/BookingShell';
import PartySection from './shared/PartySection';
import useBookingParty from './shared/useBookingParty';
import useBookingSubmit from './shared/useBookingSubmit';

import StayCalendar from '@/src/components/stay/StayCalendar';
import { types } from '@/src/constants';

/**
 * Flat. A flat owner books their own flat for other people, so there is no
 * "Myself" audience and no room choice — only dates and who is staying.
 *
 * Flats deliberately bypass the Research Centre block: an owner may use their
 * flat while the centre is closed. The 9-night cap still applies, enforced by
 * the backend.
 */
const FlatBooking = () => {
  const [resetKey, setResetKey] = useState(0);

  const party = useBookingParty({
    allow: ['mumukshu', 'guest'],
    shared: { startDay: '', endDay: '' },
  });
  const { submit, isSubmitting } = useBookingSubmit();

  useFocusEffect(
    useCallback(() => {
      party.reset();
      setResetKey((k) => k + 1);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const { form, audience } = party;
  const nights =
    form.startDay && form.endDay ? moment(form.endDay).diff(moment(form.startDay), 'days') : 0;

  const caption = useMemo(() => {
    if (!form.startDay) return 'Choose the dates';
    if (!form.endDay) return `${moment(form.startDay).format('D MMM')} → pick a checkout`;
    return `${moment(form.startDay).format('D MMM')} → ${moment(form.endDay).format(
      'D MMM'
    )} · ${nights} night${nights === 1 ? '' : 's'}`;
  }, [form.startDay, form.endDay, nights]);

  const datesChosen = Boolean(form.startDay && form.endDay);
  const canContinue = datesChosen && party.isPartyValid;

  const footerNote = !datesChosen
    ? 'Pick a check-in and a check-out date.'
    : !party.isPartyValid
      ? audience === 'guest'
        ? 'Fill in each guest’s details to continue.'
        : 'Fill in each mumukshu’s details to continue.'
      : undefined;

  return (
    <BookingShell
      embedded
      title={types.booking_type_flat}
      caption={caption}
      primaryLabel="Continue"
      onPrimary={() =>
        submit({
          bookingType: types.FLAT_DETAILS_TYPE,
          audience,
          form,
          buildPayload: (f) =>
            audience === 'guest'
              ? { startDay: f.startDay, endDay: f.endDay, guests: f.guests }
              : { startDay: f.startDay, endDay: f.endDay, mumukshuGroup: f.mumukshus },
        })
      }
      primaryDisabled={!canContinue}
      primaryLoading={isSubmitting}
      footerNote={footerNote}>
      <View className="px-4">
        <StayCalendar
          key={resetKey}
          mode="period"
          startDay={form.startDay}
          setStartDay={(d: string) => party.setSharedFields({ startDay: d, endDay: '' })}
          endDay={form.endDay}
          setEndDay={(d: string | null) => party.setSharedField('endDay', d)}
          minDate={moment().format('YYYY-MM-DD')}
        />

        <PartySection
          className="mt-7"
          audiences={party.audiences}
          audience={audience}
          onAudienceChange={party.setAudience}
          guestFormProps={party.guestFormProps}
          mumukshuFormProps={party.mumukshuFormProps}
        />
      </View>
    </BookingShell>
  );
};

export default FlatBooking;
