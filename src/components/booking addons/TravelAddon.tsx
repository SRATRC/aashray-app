import React, { useState, useCallback } from 'react';
import { View, Text, Image } from 'react-native';
import { icons, dropdowns } from '@/src/constants';
import { useAuthStore, useBookingStore } from '@/src/stores';
import { useUtsavDate } from '@/src/hooks/useUtsavDate';
import FormField from '../FormField';
import AddonItem from '../AddonItem';
import FormDisplayField from '../FormDisplayField';
import TravelReturnDetails from '../TravelReturnDetails';
import type { ReturnGroup } from '../TravelReturnGroups';
import CustomSelectBottomSheet from '../CustomSelectBottomSheet';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';

interface TravelAddonProps {
  travelForm: any;
  setTravelForm: any;
  isDatePickerVisible: any;
  setDatePickerVisibility: (pickerType: any, isVisible: any) => void;
  onToggle?: (isOpen: boolean) => void;
}

const TravelAddon: React.FC<TravelAddonProps> = ({
  travelForm,
  setTravelForm,
  isDatePickerVisible,
  setDatePickerVisibility,
  onToggle,
}) => {
  const user = useAuthStore((state) => state.user);
  const mumukshuData = useBookingStore((state) => state.mumukshuData);
  const setMumukshuData = useBookingStore((state) => state.setMumukshuData);

  const { isUtsavDate } = useUtsavDate();

  const getLocationOptions = useCallback(
    (selectedDate: string) => {
      if (isUtsavDate(selectedDate)) {
        return dropdowns.EVENT_LOCATION_LIST;
      }
      return dropdowns.LOCATION_LIST;
    },
    [isUtsavDate]
  );

  const requiresArrivalTime = useCallback((pickup: string, drop: string) => {
    const isRailwayOrAirport = (loc: string) =>
      !!loc &&
      dropdowns.LOCATION_LIST.some(
        (l) =>
          l.value === loc &&
          (l.value.toLowerCase().includes('railway') || l.value.toLowerCase().includes('airport'))
      );
    return isRailwayOrAirport(pickup) || isRailwayOrAirport(drop);
  }, []);

  // The single self traveler. Return groups reference this by index '0'.
  const travelers = [{ index: '0', issuedto: user.issuedto || user.name, cardno: user.cardno }];

  // Default return leg: reverse the flat onward route for the same traveler.
  const reverseGroups = (): ReturnGroup[] => [
    {
      pickup: travelForm.drop || '',
      drop: travelForm.pickup || '',
      type: travelForm.type || '',
      luggage: travelForm.luggage || [],
      arrival_time: '',
      comments: travelForm.special_request || '',
      total_people: travelForm.total_people ?? null,
      travelerIndices: ['0'],
    },
  ];

  return (
    <AddonItem
      onToggle={onToggle}
      onCollapse={() => {
        const primaryStart =
          mumukshuData.room?.startDay ||
          (mumukshuData.adhyayan && mumukshuData.adhyayan.adhyayan?.start_date) ||
          mumukshuData.flat?.startDay ||
          mumukshuData.utsav?.utsav?.utsav_start ||
          '';
        const primaryEnd =
          mumukshuData.room?.endDay ||
          (mumukshuData.adhyayan && mumukshuData.adhyayan.adhyayan?.end_date) ||
          mumukshuData.flat?.endDay ||
          mumukshuData.utsav?.utsav?.utsav_end ||
          '';
        setTravelForm({
          date: primaryStart,
          return_date: primaryEnd && primaryEnd !== primaryStart ? primaryEnd : '',
          pickup: '',
          drop: '',
          arrival_time: '',
          luggage: [],
          type: dropdowns.BOOKING_TYPE_LIST[0].value,
          total_people: null,
          special_request: '',
          returnGroups: [],
          returnEdited: false,
        });
        setMumukshuData((prev: any) => {
          const { travel, ...rest } = prev;
          return rest;
        });
      }}
      visibleContent={
        <View className="flex flex-row items-center gap-x-4">
          <Image source={icons.travel} className="h-10 w-10" resizeMode="contain" />
          <Text className="font-pmedium">Raj Pravas Booking</Text>
        </View>
      }
      containerStyles={'mt-3'}>
      <FormDisplayField
        text="Travel Date"
        value={travelForm.date ? moment(travelForm.date).format('Do MMMM YYYY') : ''}
        placeholder="Travel Date"
        otherStyles="mt-7"
        backgroundColor="bg-gray-100"
        onPress={() => setDatePickerVisibility('travel', true)}
      />
      <DateTimePickerModal
        isVisible={isDatePickerVisible.travel}
        mode="date"
        date={travelForm.date ? moment(travelForm.date).toDate() : moment().add(1, 'days').toDate()}
        minimumDate={moment().toDate()}
        onConfirm={(date: Date) => {
          const selected = moment(date);
          const today = moment().format('YYYY-MM-DD');
          const validDate = selected.isBefore(today) ? today : selected.format('YYYY-MM-DD');
          setTravelForm({ ...travelForm, date: validDate });
          setDatePickerVisibility('travel', false);
        }}
        onCancel={() => setDatePickerVisibility('travel', false)}
      />

      <TravelReturnDetails
        showDatePicker
        variant="flat"
        returnDate={travelForm.return_date}
        onwardDate={travelForm.date}
        travelers={travelers}
        returnGroups={travelForm.returnGroups || []}
        onPickReturnDate={(date: string) => {
          if (travelForm.returnEdited) {
            setTravelForm({ ...travelForm, return_date: date });
          } else {
            setTravelForm({
              ...travelForm,
              return_date: date,
              returnGroups: reverseGroups(),
            });
          }
        }}
        onClearReturnDate={() => {
          setTravelForm({
            ...travelForm,
            return_date: '',
            returnGroups: [],
            returnEdited: false,
          });
        }}
        onChangeReturnGroups={(g: ReturnGroup[]) => {
          setTravelForm({
            ...travelForm,
            returnGroups: g,
            returnEdited: true,
          });
        }}
        locationOptions={getLocationOptions(travelForm.return_date || travelForm.date)}
        requiresArrivalTime={requiresArrivalTime}
      />

      <CustomSelectBottomSheet
        className="mt-7"
        label="Booking Type"
        placeholder="Booking Type"
        options={dropdowns.BOOKING_TYPE_LIST}
        selectedValue={travelForm.type}
        onValueChange={(val: any) => setTravelForm({ ...travelForm, type: val })}
        saveKeyInsteadOfValue={false}
      />

      {travelForm.type == dropdowns.BOOKING_TYPE_LIST[1].value && (
        <FormField
          text="Total People"
          value={travelForm.total_people}
          handleChangeText={(e: any) => setTravelForm({ ...travelForm, total_people: e })}
          otherStyles="mt-7"
          containerStyles="bg-gray-100"
          keyboardType="number-pad"
          placeholder="please specify total people here..."
          inputStyles={'font-pmedium text-black text-lg'}
        />
      )}

      <CustomSelectBottomSheet
        className="mt-7"
        label="Pickup Location"
        placeholder="Select Pickup Location"
        options={getLocationOptions(travelForm.date)}
        selectedValue={travelForm.pickup}
        onValueChange={(val: any) => {
          if (val === 'Research Centre') {
            // If selecting Research Centre as pickup, drop must be something else
            setTravelForm({
              ...travelForm,
              pickup: val,
              drop: travelForm.drop === 'Research Centre' ? '' : travelForm.drop,
            });
          } else {
            // If selecting anything else as pickup, drop must be Research Centre
            setTravelForm({
              ...travelForm,
              pickup: val,
              drop: 'Research Centre',
            });
          }
        }}
        saveKeyInsteadOfValue={false}
      />

      <CustomSelectBottomSheet
        className="mt-7"
        label="Drop Location"
        placeholder="Select Drop Location"
        options={getLocationOptions(travelForm.date)}
        selectedValue={travelForm.drop}
        onValueChange={(val: any) => {
          if (val === 'Research Centre') {
            // If selecting Research Centre as drop, pickup must be something else
            setTravelForm({
              ...travelForm,
              drop: val,
              pickup: travelForm.pickup === 'Research Centre' ? '' : travelForm.pickup,
            });
          } else {
            // If selecting anything else as drop, pickup must be Research Centre
            setTravelForm({
              ...travelForm,
              drop: val,
              pickup: 'Research Centre',
            });
          }
        }}
        saveKeyInsteadOfValue={false}
      />

      {(travelForm.pickup &&
        dropdowns.LOCATION_LIST.find(
          (loc) =>
            loc.value === travelForm.pickup &&
            (loc.value.toLowerCase().includes('railway') ||
              loc.value.toLowerCase().includes('airport'))
        )) ||
      (travelForm.drop &&
        dropdowns.LOCATION_LIST.find(
          (loc) =>
            loc.value === travelForm.drop &&
            (loc.value.toLowerCase().includes('railway') ||
              loc.value.toLowerCase().includes('airport'))
        )) ? (
        <>
          <FormDisplayField
            text="Flight/Train Time"
            value={
              travelForm.arrival_time
                ? moment(travelForm.arrival_time, 'HH:mm').format('h:mm a')
                : ''
            }
            placeholder="Flight/Train Time"
            otherStyles="mt-5"
            inputStyles="font-pmedium text-black text-lg"
            backgroundColor="bg-gray-100"
            onPress={() => setDatePickerVisibility('travel_time', true)}
          />
          <DateTimePickerModal
            isVisible={isDatePickerVisible.travel_time}
            mode="time"
            date={
              travelForm.arrival_time
                ? moment(travelForm.arrival_time, 'HH:mm').toDate()
                : new Date()
            }
            onConfirm={(date: Date) => {
              const timeOnly = moment(date).format('HH:mm');
              setTravelForm({
                ...travelForm,
                arrival_time: timeOnly,
              });
              setDatePickerVisibility('travel_time', false);
            }}
            onCancel={() => setDatePickerVisibility('travel_time', false)}
          />
        </>
      ) : null}

      <CustomSelectBottomSheet
        className="mt-7"
        label="Luggage"
        placeholder="Select any Luggage"
        options={dropdowns.LUGGAGE_LIST}
        selectedValues={travelForm.luggage}
        onValuesChange={(val: any) => setTravelForm({ ...travelForm, luggage: val })}
        saveKeyInsteadOfValue={false}
        multiSelect={true}
        confirmButtonText="Select"
        maxSelectedDisplay={3}
      />

      <FormField
        text="Comments"
        value={travelForm.special_request}
        handleChangeText={(e: any) =>
          setTravelForm({
            ...travelForm,
            special_request: e,
          })
        }
        otherStyles="mt-7"
        containerStyles="bg-gray-100"
        keyboardType="default"
        placeholder="Please specify a location if 'Other' is selected, or provide any additional requests here..."
        multiline={true}
        numberOfLines={2}
        inputStyles={'font-pmedium text-black text-lg'}
      />
    </AddonItem>
  );
};

export default TravelAddon;
