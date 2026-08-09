import { useFocusEffect } from 'expo-router';
import moment from 'moment';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import BookingShell from './shared/BookingShell';
import FieldGroup from './shared/FieldGroup';
import PartySection from './shared/PartySection';
import useBookingParty from './shared/useBookingParty';
import useBookingSubmit from './shared/useBookingSubmit';

import Callout from '@/src/components/Callout';
import CustomCalender from '@/src/components/CustomCalender';
import CustomSelectBottomSheet from '@/src/components/CustomSelectBottomSheet';
import InternationalPaymentWarning from '@/src/components/InternationalPaymentWarning';
import { dropdowns, types } from '@/src/constants';
import isInternationalUser from '@/src/utils/isInternationalUser';

/**
 * Raj Prasad. Dates, who is eating, and what they eat.
 *
 * Meals are ordered before 11 AM the day before, so the earliest bookable date
 * moves depending on the time of day.
 */

const MEAL_DEFAULTS = {
  meals: ['breakfast', 'lunch', 'dinner'],
  spicy: 1,
  hightea: 'NONE',
};

/** Earliest bookable day, given the 11 AM cut-off for the following day. */
const foodMinDate = () =>
  moment()
    .add(moment().hour() < 11 ? 1 : 2, 'days')
    .format('YYYY-MM-DD');

const FoodBooking = () => {
  const [resetKey, setResetKey] = useState(0);
  const [showInternationalWarning, setShowInternationalWarning] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);

  const party = useBookingParty({
    guestTemplate: { name: '', gender: '', mobno: '', type: '', ...MEAL_DEFAULTS },
    mumukshuTemplate: { cardno: '', mobno: '', ...MEAL_DEFAULTS },
    shared: { startDay: '', endDay: '', ...MEAL_DEFAULTS },
    validateGuestRow: (r) => r.meals?.length > 0 && r.spicy !== null && Boolean(r.hightea),
    validateMumukshuRow: (r) => r.meals?.length > 0 && r.spicy !== null && Boolean(r.hightea),
  });

  const { submit, isSubmitting } = useBookingSubmit();

  useFocusEffect(
    useCallback(() => {
      party.reset();
      setResetKey((k) => k + 1);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const { form, audience, user } = party;

  // A single-day order leaves the checkout blank; the API wants both dates.
  const endDay = form.endDay || form.startDay;

  const caption = useMemo(() => {
    if (!form.startDay) return 'Choose the dates';
    if (!form.endDay) return `${moment(form.startDay).format('D MMM')} · one day`;
    const days = moment(form.endDay).diff(moment(form.startDay), 'days') + 1;
    return `${moment(form.startDay).format('D MMM')} → ${moment(form.endDay).format(
      'D MMM'
    )} · ${days} days`;
  }, [form.startDay, form.endDay]);

  const selfMealsValid = form.meals?.length > 0 && form.spicy !== null && Boolean(form.hightea);
  const canContinue = Boolean(form.startDay) && party.isPartyValid && selfMealsValid;

  const footerNote = !form.startDay
    ? 'Pick the days you need meals for.'
    : !selfMealsValid && audience === 'self'
      ? 'Choose at least one meal to continue.'
      : !party.isPartyValid
        ? audience === 'guest'
          ? 'Fill in each guest’s details and meals to continue.'
          : 'Fill in each mumukshu’s details and meals to continue.'
        : undefined;

  /** Meal preferences. Reused for the member, each guest and each mumukshu. */
  const mealFields = (
    value: any,
    onChange: (field: string, v: any) => void,
    title?: string
  ) => (
    <FieldGroup title={title} className="mt-4">
      <CustomSelectBottomSheet
        variant="row"
        label="Meals"
        placeholder="Select meals"
        options={dropdowns.FOOD_TYPE_LIST}
        selectedValues={value.meals}
        onValuesChange={(v) => onChange('meals', v as string[])}
        multiSelect
        confirmButtonText="Select"
        maxSelectedDisplay={3}
      />
      <CustomSelectBottomSheet
        variant="row"
        label="Spice level"
        options={dropdowns.SPICE_LIST}
        selectedValue={value.spicy}
        onValueChange={(v: any) => onChange('spicy', v)}
      />
      <CustomSelectBottomSheet
        variant="row"
        label="High tea"
        options={dropdowns.HIGHTEA_LIST}
        selectedValue={value.hightea}
        onValueChange={(v: any) => onChange('hightea', v)}
      />
    </FieldGroup>
  );

  const groupForApi = (rows: any[], key: 'guests' | 'mumukshus') => {
    const groups: Record<string, any> = {};
    for (const row of rows) {
      const k = `${(row.meals || []).join(',')}_${row.spicy}_${row.hightea}`;
      if (!groups[k]) {
        groups[k] = {
          meals: row.meals,
          spicy: row.spicy,
          hightea: row.hightea,
          [key]: [],
        };
      }
      groups[k][key].push(
        key === 'guests' ? { issuedto: row.issuedto || row.name, cardno: row.cardno } : row
      );
    }
    return Object.values(groups);
  };

  const runSubmit = () =>
    submit({
      bookingType: 'food',
      audience,
      form: { ...form, endDay },
      buildPayload: (f) => {
        if (audience === 'guest') {
          return {
            startDay: f.startDay,
            endDay,
            guestGroup: groupForApi(f.guests, 'guests'),
          };
        }
        const rows =
          audience === 'mumukshu'
            ? f.mumukshus
            : [
                {
                  cardno: user.cardno,
                  mobno: user.mobno,
                  issuedto: user.name,
                  meals: f.meals,
                  spicy: f.spicy,
                  hightea: f.hightea,
                },
              ];
        return {
          startDay: f.startDay,
          endDay,
          mumukshuGroup: groupForApi(rows, 'mumukshus'),
        };
      },
    });

  // International cards are warned before a booking is created, because a
  // foreign card can fail at the gateway after the booking exists.
  const handleContinue = () => {
    if (isInternationalUser(user)) {
      pendingAction.current = runSubmit;
      setShowInternationalWarning(true);
      return;
    }
    runSubmit();
  };

  return (
    <BookingShell
      embedded
      title={types.booking_type_food}
      caption={caption}
      primaryLabel="Continue"
      onPrimary={handleContinue}
      primaryDisabled={!canContinue}
      primaryLoading={isSubmitting}
      footerNote={footerNote}>
      <View className="px-4">
        <Callout
          variant="warning"
          message="Meals must be booked before 11 AM the day before."
        />

        <CustomCalender
          key={resetKey}
          type="period"
          startDay={form.startDay}
          setStartDay={(d: any) => party.setSharedFields({ startDay: d, endDay: '' })}
          endDay={form.endDay}
          setEndDay={(d: any) => party.setSharedField('endDay', d)}
          minDate={foodMinDate()}
        />

        <PartySection
          className="mt-7"
          audiences={party.audiences}
          audience={audience}
          onAudienceChange={party.setAudience}
          guestFormProps={party.guestFormProps}
          mumukshuFormProps={party.mumukshuFormProps}
          renderGuestExtras={(i) =>
            mealFields(form.guests[i] ?? {}, (field, v) =>
              party.guestFormProps.handleGuestFormChange(i, field, v)
            )
          }
          renderMumukshuExtras={(i) =>
            mealFields(form.mumukshus[i] ?? {}, (field, v) =>
              party.mumukshuFormProps.handleMumukshuFormChange(i, field, v)
            )
          }
        />

        {audience === 'self'
          ? mealFields(form, (field, v) => party.setSharedField(field, v), 'Your meals')
          : null}
      </View>

      <InternationalPaymentWarning
        visible={showInternationalWarning}
        country={user?.country}
        onClose={() => setShowInternationalWarning(false)}
        onProceed={() => {
          setShowInternationalWarning(false);
          pendingAction.current?.();
          pendingAction.current = null;
        }}
      />
    </BookingShell>
  );
};

export default FoodBooking;
