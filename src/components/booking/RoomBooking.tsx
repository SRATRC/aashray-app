import { useFocusEffect } from 'expo-router';
import moment from 'moment';
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text } from 'react-native';

import BookingShell from './shared/BookingShell';
import FieldGroup, { FieldRow } from './shared/FieldGroup';
import ModeSwitch from './shared/ModeSwitch';
import PartySection from './shared/PartySection';
import useBookingParty from './shared/useBookingParty';
import useBookingSubmit from './shared/useBookingSubmit';

import CustomSelectBottomSheet from '@/src/components/CustomSelectBottomSheet';
import StayCalendar from '@/src/components/stay/StayCalendar';
import { dropdowns, types } from '@/src/constants';

/**
 * Raj Sharan. Dates, then who, then the room they want.
 *
 * The shell, the audience switch, the party forms and the commit step are all
 * shared with every other booking type. Only the body below is specific to a
 * room: a stay calendar, and room type plus floor.
 */

const ROOM_LABEL: Record<string, string> = { ac: 'AC', nac: 'Non AC', NA: 'No room' };
const FLOOR_LABEL: Record<string, string> = { n: 'Any Floor', SC: 'Only Ground Floor' };

const ROOM_DEFAULTS = {
  roomType: dropdowns.ROOM_TYPE_LIST[0].key,
  floorType: dropdowns.FLOOR_TYPE_LIST[0].key,
};

/** Groups occupants who asked for the same room, the shape the API expects. */
const groupByRoom = (rows: any[], key: 'guests' | 'mumukshus') => {
  const groups: Record<string, any> = {};
  for (const row of rows) {
    const k = `${row.roomType}_${row.floorType}`;
    if (!groups[k]) groups[k] = { roomType: row.roomType, floorType: row.floorType, [key]: [] };
    groups[k][key].push(
      key === 'guests' ? { issuedto: row.issuedto || row.name, cardno: row.cardno } : row
    );
  }
  return Object.values(groups);
};

const RoomBooking = () => {
  const [dayVisit, setDayVisit] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const party = useBookingParty({
    guestTemplate: { name: '', gender: '', mobno: '', type: '', ...ROOM_DEFAULTS },
    mumukshuTemplate: { cardno: '', mobno: '', ...ROOM_DEFAULTS },
    shared: { startDay: '', endDay: '', ...ROOM_DEFAULTS },
    validateGuestRow: (r) => Boolean(r.roomType && r.floorType),
    validateMumukshuRow: (r) => Boolean(r.roomType && r.floorType),
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
  const startDay = form.startDay;
  const endDay = form.endDay;

  // A day visit is one date, so checkin and checkout are the same day.
  const checkout = dayVisit ? startDay : endDay;
  const nights = startDay && checkout ? moment(checkout).diff(moment(startDay), 'days') : 0;

  const datesChosen = Boolean(startDay && checkout);
  const needsRoom = !dayVisit || form.roomType !== 'NA';

  const dateSummary = useMemo(() => {
    if (!startDay) return null;
    if (dayVisit) return `${moment(startDay).format('D MMM')} · day visit`;
    if (!endDay) return `${moment(startDay).format('D MMM')} → pick a checkout`;
    return `${moment(startDay).format('D MMM')} → ${moment(endDay).format('D MMM')} · ${nights} night${
      nights === 1 ? '' : 's'
    }`;
  }, [startDay, endDay, dayVisit, nights]);

  const canContinue = datesChosen && party.isPartyValid;

  const footerNote = !datesChosen
    ? dayVisit
      ? 'Pick the day you are visiting.'
      : 'Pick a check-in and a check-out date.'
    : !party.isPartyValid
      ? audience === 'guest'
        ? 'Fill in each guest’s details to continue.'
        : 'Fill in each mumukshu’s details to continue.'
      : undefined;

  const handleContinue = () =>
    submit({
      bookingType: types.ROOM_DETAILS_TYPE,
      audience,
      form: { ...form, endDay: checkout },
      buildPayload: (f) => {
        if (audience === 'guest') {
          return {
            startDay: f.startDay,
            endDay: checkout,
            guestGroup: groupByRoom(f.guests, 'guests'),
          };
        }
        const occupants =
          audience === 'mumukshu'
            ? f.mumukshus
            : [
                {
                  cardno: user.cardno,
                  mobno: user.mobno,
                  issuedto: user.name,
                  gender: user.gender,
                  res_status: user.res_status,
                  roomType: f.roomType,
                  floorType: f.floorType,
                },
              ];
        return {
          startDay: f.startDay,
          endDay: checkout,
          mumukshuGroup: groupByRoom(occupants, 'mumukshus'),
        };
      },
    });

  /** Room type and floor, as a grouped list. Reused per guest / per mumukshu. */
  const roomFields = (
    value: { roomType?: string; floorType?: string },
    onChange: (field: string, v: any) => void,
    title?: string
  ) => (
    <FieldGroup title={title} className="mt-4">
      <CustomSelectBottomSheet
        variant="row"
        label="Room type"
        placeholder="Select"
        options={dropdowns.ROOM_TYPE_LIST}
        selectedValue={value.roomType}
        onValueChange={(v: any) => onChange('roomType', v)}
      />
      <CustomSelectBottomSheet
        variant="row"
        label="Floor"
        placeholder="Select"
        options={dropdowns.FLOOR_TYPE_LIST}
        selectedValue={value.floorType}
        onValueChange={(v: any) => onChange('floorType', v)}
      />
    </FieldGroup>
  );

  return (
    <BookingShell
      embedded
      title={types.booking_type_room}
      caption={dateSummary ?? 'Choose your dates'}
      primaryLabel="Continue"
      onPrimary={handleContinue}
      primaryDisabled={!canContinue}
      primaryLoading={isSubmitting}
      footerNote={footerNote}>
      <View className="px-4">
        <ModeSwitch
          options={[
            { key: 'range', label: 'Select dates' },
            { key: 'day', label: 'One day visit' },
          ]}
          value={dayVisit ? 'day' : 'range'}
          onChange={(k) => {
            setDayVisit(k === 'day');
            party.setSharedFields({ startDay: '', endDay: '' });
            setResetKey((v) => v + 1);
          }}
        />

        <StayCalendar
          key={`${dayVisit ? 'single' : 'period'}-${resetKey}`}
          mode={dayVisit ? 'single' : 'period'}
          startDay={startDay}
          setStartDay={(d: string) => party.setSharedFields({ startDay: d, endDay: '' })}
          endDay={endDay}
          setEndDay={(d: string | null) => party.setSharedField('endDay', d)}
          selectedDay={startDay}
          setSelectedDay={(d: string) => party.setSharedFields({ startDay: d, endDay: d })}
        />

        <PartySection
          className="mt-7"
          audiences={party.audiences}
          audience={audience}
          onAudienceChange={party.setAudience}
          guestFormProps={party.guestFormProps}
          mumukshuFormProps={party.mumukshuFormProps}
          renderGuestExtras={(i) =>
            roomFields(form.guests[i] ?? {}, (field, v) =>
              party.guestFormProps.handleGuestFormChange(i, field, v)
            )
          }
          renderMumukshuExtras={(i) =>
            roomFields(form.mumukshus[i] ?? {}, (field, v) =>
              party.mumukshuFormProps.handleMumukshuFormChange(i, field, v)
            )
          }
        />

        {audience === 'self' ? (
          <>
            {dayVisit ? (
              <FieldGroup
                title="Room"
                className="mt-4"
                footer="A day visit does not need a room unless you want to rest during the day.">
                <CustomSelectBottomSheet
                  variant="row"
                  label="Need a room?"
                  options={[
                    { key: 'NA', value: 'No' },
                    { key: dropdowns.ROOM_TYPE_LIST[0].key, value: 'Yes' },
                  ]}
                  selectedValue={form.roomType === 'NA' ? 'NA' : dropdowns.ROOM_TYPE_LIST[0].key}
                  onValueChange={(v: any) => party.setSharedField('roomType', v)}
                />
              </FieldGroup>
            ) : null}

            {needsRoom
              ? roomFields(form, (field, v) => party.setSharedField(field, v), 'Room')
              : null}
          </>
        ) : null}

        {audience !== 'self' && form.roomType ? (
          <Text className="mt-4 px-1 font-pregular text-xs leading-5 text-gray-500">
            {ROOM_LABEL[form.roomType] ?? form.roomType} ·{' '}
            {FLOOR_LABEL[form.floorType] ?? 'Any Floor'}
          </Text>
        ) : null}
      </View>
    </BookingShell>
  );
};

export default RoomBooking;
