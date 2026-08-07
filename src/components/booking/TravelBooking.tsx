import { useFocusEffect } from 'expo-router';
import moment from 'moment';
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import BookingShell from './shared/BookingShell';
import FieldGroup from './shared/FieldGroup';
import PartySection from './shared/PartySection';
import {
  applyRoutePairing,
  describeLegProblem,
  requiresArrivalTime,
  requiresSpecialRequest,
  requiresTotalPeople,
  type TravelLeg,
} from './shared/travelRules';
import useBookingParty from './shared/useBookingParty';
import useBookingSubmit from './shared/useBookingSubmit';

import CustomCalender from '@/src/components/CustomCalender';
import CustomSelectBottomSheet from '@/src/components/CustomSelectBottomSheet';
import FormField from '@/src/components/FormField';
import { dropdowns, types } from '@/src/constants';
import { useUtsavDate } from '@/src/hooks/useUtsavDate';

/**
 * Raj Pravas. One date, then who is travelling, then each person's journey.
 *
 * The route rules live in travelRules.ts so the member's own leg and each
 * mumukshu's leg are judged identically.
 */

const LEG_DEFAULTS = {
  pickup: '',
  drop: '',
  luggage: [] as any[],
  adhyayan: dropdowns.TRAVEL_ADHYAYAN_ASK_LIST[1].value,
  type: dropdowns.BOOKING_TYPE_LIST[0].value,
  total_people: null,
  special_request: '',
  arrival_time: '',
};

const TravelBooking = () => {
  const [resetKey, setResetKey] = useState(0);
  const { isUtsavDate } = useUtsavDate();

  const party = useBookingParty({
    allow: ['self', 'mumukshu'],
    mumukshuTemplate: { cardno: '', mobno: '', ...LEG_DEFAULTS },
    shared: { date: '', ...LEG_DEFAULTS },
    validateMumukshuRow: (r) => describeLegProblem(r) === undefined,
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

  // Utsav days run a different set of pickup points.
  const locations = useMemo(
    () => (isUtsavDate(form.date) ? dropdowns.EVENT_LOCATION_LIST : dropdowns.LOCATION_LIST),
    [isUtsavDate, form.date]
  );

  const selfProblem = audience === 'self' ? describeLegProblem(form) : undefined;
  const canContinue = Boolean(form.date) && party.isPartyValid && !selfProblem;

  const footerNote = !form.date
    ? 'Pick the date you are travelling.'
    : (selfProblem ??
      (party.isPartyValid ? undefined : 'Complete each traveller’s journey to continue.'));

  /** One person's journey. Used for the member and for each mumukshu. */
  const legFields = (
    leg: TravelLeg & Record<string, any>,
    patch: (changes: Record<string, any>) => void,
    title?: string
  ) => {
    const needsTime = requiresArrivalTime(leg.pickup, leg.drop);
    const needsPeople = requiresTotalPeople(leg);
    const needsNote = requiresSpecialRequest(leg);

    return (
      <View className="mt-4">
        <FieldGroup title={title}>
          <CustomSelectBottomSheet
            variant="row"
            label="Pickup"
            options={locations}
            selectedValue={leg.pickup}
            saveKeyInsteadOfValue={false}
            onValueChange={(v: any) => patch(applyRoutePairing(leg, 'pickup', v))}
          />
          <CustomSelectBottomSheet
            variant="row"
            label="Drop"
            options={locations}
            selectedValue={leg.drop}
            saveKeyInsteadOfValue={false}
            onValueChange={(v: any) => patch(applyRoutePairing(leg, 'drop', v))}
          />
          <CustomSelectBottomSheet
            variant="row"
            label="Luggage"
            placeholder="Select"
            options={dropdowns.LUGGAGE_LIST}
            selectedValues={leg.luggage}
            onValuesChange={(v) => patch({ luggage: v })}
            multiSelect
            confirmButtonText="Select"
            saveKeyInsteadOfValue={false}
          />
          <CustomSelectBottomSheet
            variant="row"
            label="Car type"
            options={dropdowns.BOOKING_TYPE_LIST}
            selectedValue={leg.type}
            saveKeyInsteadOfValue={false}
            onValueChange={(v: any) =>
              patch({ type: v, ...(requiresTotalPeople({ type: v }) ? {} : { total_people: null }) })
            }
          />
          <CustomSelectBottomSheet
            variant="row"
            label="Leaving after adhyayan?"
            options={dropdowns.TRAVEL_ADHYAYAN_ASK_LIST}
            selectedValue={leg.adhyayan}
            saveKeyInsteadOfValue={false}
            onValueChange={(v: any) => patch({ adhyayan: v })}
          />
        </FieldGroup>

        {needsPeople || needsTime || needsNote ? (
          <View className="mt-4 gap-y-4">
            {needsPeople ? (
              <FormField
                text="How many people are travelling?"
                value={leg.total_people ? String(leg.total_people) : ''}
                handleChangeText={(v: string) => patch({ total_people: v.replace(/[^0-9]/g, '') })}
                placeholder="e.g. 4"
                keyboardType="number-pad"
                maxLength={2}
              />
            ) : null}

            {needsTime ? (
              <FormField
                text="Train or flight arrival time"
                value={leg.arrival_time}
                handleChangeText={(v: string) => patch({ arrival_time: v })}
                placeholder="e.g. 14:30"
              />
            ) : null}

            {needsNote ? (
              <FormField
                text="Where exactly? *"
                value={leg.special_request}
                handleChangeText={(v: string) => patch({ special_request: v })}
                placeholder="Describe the pickup or drop point"
                multiline
                numberOfLines={2}
              />
            ) : null}
          </View>
        ) : null}
      </View>
    );
  };

  const handleContinue = () =>
    submit({
      bookingType: types.TRAVEL_DETAILS_TYPE,
      audience,
      form,
      buildPayload: (f) => ({
        date: f.date,
        mumukshuGroup:
          audience === 'mumukshu'
            ? f.mumukshus
            : [
                {
                  cardno: user.cardno,
                  mobno: user.mobno,
                  pickup: f.pickup,
                  drop: f.drop,
                  luggage: f.luggage,
                  adhyayan: f.adhyayan,
                  type: f.type,
                  total_people: f.total_people,
                  special_request: f.special_request,
                  arrival_time: f.arrival_time,
                },
              ],
      }),
    });

  return (
    <BookingShell
      embedded
      title={types.booking_type_travel}
      caption={form.date ? moment(form.date).format('ddd, D MMM YYYY') : 'Choose the date'}
      primaryLabel="Continue"
      onPrimary={handleContinue}
      primaryDisabled={!canContinue}
      primaryLoading={isSubmitting}
      footerNote={footerNote}>
      <View className="px-4">
        <CustomCalender
          key={resetKey}
          selectedDay={form.date}
          setSelectedDay={(d: any) => party.setSharedField('date', d)}
          minDate={moment().format('YYYY-MM-DD')}
        />

        <PartySection
          className="mt-7"
          audiences={party.audiences}
          audience={audience}
          onAudienceChange={party.setAudience}
          guestFormProps={party.guestFormProps}
          mumukshuFormProps={party.mumukshuFormProps}
          renderMumukshuExtras={(i) =>
            legFields(form.mumukshus[i] ?? {}, (changes) => {
              Object.entries(changes).forEach(([k, v]) =>
                party.mumukshuFormProps.handleMumukshuFormChange(i, k, v)
              );
            })
          }
        />

        {audience === 'self'
          ? legFields(
              form,
              (changes) => party.setSharedFields(changes),
              'Your journey'
            )
          : null}
      </View>
    </BookingShell>
  );
};

export default TravelBooking;
