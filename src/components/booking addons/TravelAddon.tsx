import React, { useState, useCallback } from 'react';
import { View, Text, Image } from 'react-native';
import { icons, dropdowns } from '@/src/constants';
import { useAuthStore, useBookingStore } from '@/src/stores';
import { useUtsavDate } from '@/src/hooks/useUtsavDate';
import FormField from '../FormField';
import AddonItem from '../AddonItem';
import FormDisplayField from '../FormDisplayField';
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

  const [tempTravelDate, setTempTravelDate] = useState(
    travelForm.date ? moment(travelForm.date).toDate() : moment().add(1, 'days').toDate()
  );

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

  return (
    <AddonItem
      onToggle={onToggle}
      onCollapse={() => {
        setTravelForm({
          date:
            mumukshuData.room?.startDay ||
            (mumukshuData.adhyayan && mumukshuData.adhyayan.adhyayan?.start_date) ||
            mumukshuData.flat?.startDay ||
            mumukshuData.utsav?.utsav?.utsav_start ||
            '',
          pickup: '',
          drop: '',
          arrival_time: '',
          luggage: [],
          adhyayan: dropdowns.TRAVEL_ADHYAYAN_ASK_LIST[1].value,
          type: dropdowns.BOOKING_TYPE_LIST[0].value,
          total_people: null,
          special_request: '',
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
        text="Date"
        value={travelForm.date ? moment(travelForm.date).format('Do MMMM YYYY') : 'Date'}
        otherStyles="mt-7"
        backgroundColor="bg-gray-100"
        onPress={() => setDatePickerVisibility('travel', true)}
      />
      <DateTimePickerModal
        isVisible={isDatePickerVisible.travel}
        mode="date"
        date={tempTravelDate}
        onConfirm={(date: Date) => {
          // Ensure the selected date isn't before tomorrow
          const selectedMoment = moment(date);
          const today = moment().format('YYYY-MM-DD');
          const validDate = selectedMoment.isBefore(today)
            ? today
            : selectedMoment.format('YYYY-MM-DD');

          setTravelForm({
            ...travelForm,
            date: validDate,
          });
          setDatePickerVisibility('travel', false);
        }}
        onCancel={() => setDatePickerVisibility('travel', false)}
        minimumDate={moment().toDate()}
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
                ? moment(travelForm.arrival_time).format('h:mm a')
                : 'Flight/Train Time'
            }
            otherStyles="mt-5"
            inputStyles={'font-pmedium text-lg'}
            backgroundColor="bg-gray-100"
            onPress={() => setDatePickerVisibility('travel_time', true)}
          />
          <DateTimePickerModal
            isVisible={isDatePickerVisible.travel_time}
            mode="time"
            date={travelForm.arrival_time ? moment(travelForm.arrival_time).toDate() : new Date()}
            onConfirm={(date: Date) => {
              setTravelForm({
                ...travelForm,
                arrival_time: date.toISOString(),
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

      {travelForm.pickup == dropdowns.LOCATION_LIST[0].value && (
        <CustomSelectBottomSheet
          className="mt-7"
          label="Leaving post adhyayan?"
          placeholder="Leaving post adhyayan?"
          options={dropdowns.TRAVEL_ADHYAYAN_ASK_LIST}
          selectedValue={travelForm.adhyayan}
          onValueChange={(val: any) => setTravelForm({ ...travelForm, adhyayan: val })}
          saveKeyInsteadOfValue={false}
        />
      )}

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
