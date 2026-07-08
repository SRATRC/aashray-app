import React, { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { icons, colors, dropdowns } from '@/src/constants';
import { useUtsavDate } from '@/src/hooks/useUtsavDate';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import CustomSelectBottomSheet from '../CustomSelectBottomSheet';
import HorizontalSeparator from '../HorizontalSeparator';
import FormDisplayField from '../FormDisplayField';
import FormField from '../FormField';
import AddonItem from '../AddonItem';
import TravelReturnDetails from '../TravelReturnDetails';
import type { ReturnGroup } from '../TravelReturnGroups';
import moment from 'moment';

interface GuestTravelAddonProps {
  travelForm: any;
  setTravelForm: any;
  addTravelForm: any;
  updateTravelForm: any;
  resetTravelForm: any;
  removeTravelForm: any;
  guest_dropdown: any;
  isDatePickerVisible: any;
  setDatePickerVisibility: (pickerType: string, isVisible: boolean) => void;
  onToggle?: (isOpen: boolean) => void;
}

const GuestTravelAddon: React.FC<GuestTravelAddonProps> = ({
  travelForm,
  setTravelForm,
  addTravelForm,
  updateTravelForm,
  resetTravelForm,
  removeTravelForm,
  guest_dropdown,
  isDatePickerVisible,
  setDatePickerVisibility,
  onToggle,
}) => {
  const [activeGuestIndex, setActiveGuestIndex] = useState(null);

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
          (l.key.toLowerCase().includes('railway') || l.key.toLowerCase().includes('airport'))
      );
    return isRailwayOrAirport(pickup) || isRailwayOrAirport(drop);
  }, []);

  const getAvailableGuests = (currentGroupIndex: number) => {
    // Get all selected guest indices from other groups
    const selectedIndices = travelForm.guestGroup.reduce(
      (acc: number[], group: any, idx: number) => {
        if (idx !== currentGroupIndex) {
          return [...acc, ...group.guestIndices];
        }
        return acc;
      },
      []
    );

    // Filter out guests that are already selected in other groups
    return guest_dropdown.filter((guest: any) => !selectedIndices.includes(guest.value));
  };

  const hasAvailableGuests = () => {
    // Get all selected guest indices from all groups
    const selectedIndices = travelForm.guestGroup.flatMap((group: any) => group.guestIndices);
    // Check if there are any unselected guests
    return guest_dropdown.some((guest: any) => !selectedIndices.includes(guest.value));
  };

  // The return travelers are the same people as the onward roster (no new travelers on the
  // return). guestIndices reference this list; cardno is resolved at request time in the screen.
  const travelers = guest_dropdown.map((g: any) => ({
    index: String(g.key),
    issuedto: g.value,
  }));

  // Default return legs: reverse each onward group (swap pickup/drop), keep type/luggage/people,
  // clear arrival time, carry the same travelers by index.
  const reverseGroups = (): ReturnGroup[] =>
    travelForm.guestGroup.map((g: any) => ({
      pickup: g.drop || '',
      drop: g.pickup || '',
      type: g.type || '',
      luggage: g.luggage || [],
      arrival_time: '',
      comments: g.special_request || '',
      total_people: g.total_people ?? null,
      travelerIndices: (g.guestIndices || []).map(String),
    }));

  return (
    <AddonItem
      onCollapse={() => {
        resetTravelForm();
      }}
      onToggle={onToggle}
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

      {travelForm.guestGroup.map((assignment: any, index: any) => (
        <View key={index} style={{ marginBottom: 15 }}>
          {index > 0 && (
            <View>
              <HorizontalSeparator otherStyles={'w-full mt-3'} />
              <TouchableOpacity
                onPress={removeTravelForm(index)}
                className="mt-3 flex-1 flex-row items-center justify-end gap-x-1">
                <Image
                  source={icons.remove}
                  tintColor={'red'}
                  className="h-3 w-3"
                  resizeMode="contain"
                />
                <Text className="font-pregular text-xs text-red-500">Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          <CustomSelectBottomSheet
            className="mt-5"
            label={`Guests group - ${index + 1}`}
            placeholder="Select Guests"
            options={getAvailableGuests(index)}
            selectedValues={assignment.guestIndices}
            onValuesChange={(val) => updateTravelForm(index, 'guests', val)}
            multiSelect={true}
            confirmButtonText="Select"
          />

          <CustomSelectBottomSheet
            className="mt-7"
            label="Booking Type"
            placeholder="Booking Type"
            options={dropdowns.BOOKING_TYPE_LIST}
            selectedValue={assignment.type}
            onValueChange={(val: any) => updateTravelForm(index, 'type', val)}
            saveKeyInsteadOfValue={false}
          />

          {assignment.type == dropdowns.BOOKING_TYPE_LIST[1].value && (
            <FormField
              text="Total People"
              value={assignment.total_people}
              handleChangeText={(e: any) => updateTravelForm(index, 'total_people', e)}
              otherStyles="mt-7"
              containerStyles="bg-gray-100"
              keyboardType="number-pad"
              placeholder="please specify total people here..."
              inputStyles={'font-pmedium text-black text-lg'}
            />
          )}

          <CustomSelectBottomSheet
            className="mt-5"
            label="Pickup Location"
            placeholder="Select Pickup Location"
            options={getLocationOptions(travelForm.date)}
            selectedValue={assignment.pickup}
            onValueChange={(val: any) => {
              if (val === 'Research Centre') {
                // If selecting Research Centre as pickup, drop must be something else
                updateTravelForm(index, 'pickup', val);
                if (assignment.drop === 'Research Centre') {
                  updateTravelForm(index, 'drop', '');
                }
              } else {
                // If selecting anything else as pickup, drop must be Research Centre
                updateTravelForm(index, 'pickup', val);
                updateTravelForm(index, 'drop', 'Research Centre');
              }
            }}
            saveKeyInsteadOfValue={false}
          />

          <CustomSelectBottomSheet
            className="mt-5"
            label="Drop Location"
            placeholder="Select Drop Location"
            options={getLocationOptions(travelForm.date)}
            selectedValue={assignment.drop}
            onValueChange={(val: any) => {
              if (val === 'Research Centre') {
                // If selecting Research Centre as drop, pickup must be something else
                updateTravelForm(index, 'drop', val);
                if (assignment.pickup === 'Research Centre') {
                  updateTravelForm(index, 'pickup', '');
                }
              } else {
                // If selecting anything else as drop, pickup must be Research Centre
                updateTravelForm(index, 'drop', val);
                updateTravelForm(index, 'pickup', 'Research Centre');
              }
            }}
            saveKeyInsteadOfValue={false}
          />

          {(travelForm.guestGroup[index].pickup &&
            dropdowns.LOCATION_LIST.find(
              (loc) =>
                loc.value === travelForm.guestGroup[index].pickup &&
                (loc.key.toLowerCase().includes('railway') ||
                  loc.key.toLowerCase().includes('airport'))
            )) ||
          (travelForm.guestGroup[index].drop &&
            dropdowns.LOCATION_LIST.find(
              (loc) =>
                loc.value === travelForm.guestGroup[index].drop &&
                (loc.key.toLowerCase().includes('railway') ||
                  loc.key.toLowerCase().includes('airport'))
            )) ? (
            <>
              <FormDisplayField
                text="Flight/Train Time"
                value={
                  travelForm.guestGroup[index].arrival_time
                    ? moment(travelForm.guestGroup[index].arrival_time, 'HH:mm').format('h:mm a')
                    : ''
                }
                placeholder="Flight/Train Time"
                otherStyles="mt-5"
                inputStyles={'font-pmedium text-black text-lg'}
                backgroundColor="bg-gray-100"
                onPress={() => {
                  setDatePickerVisibility('travel_time', true);
                  setActiveGuestIndex(index);
                }}
              />
              <DateTimePickerModal
                isVisible={isDatePickerVisible.travel_time && activeGuestIndex === index}
                mode="time"
                date={
                  travelForm.guestGroup[index].arrival_time
                    ? moment(travelForm.guestGroup[index].arrival_time, 'HH:mm').toDate()
                    : new Date()
                }
                onConfirm={(date: Date) => {
                  const timeOnly = moment(date).format('HH:mm');
                  updateTravelForm(index, 'arrival_time', timeOnly);
                  setDatePickerVisibility('travel_time', false);
                }}
                onCancel={() => setDatePickerVisibility('travel_time', false)}
              />
            </>
          ) : null}

          <CustomSelectBottomSheet
            className="mt-5"
            label="Luggage"
            placeholder="Select any Luggage"
            options={dropdowns.LUGGAGE_LIST}
            selectedValues={assignment.luggage}
            onValuesChange={(val: any) => updateTravelForm(index, 'luggage', val)}
            saveKeyInsteadOfValue={false}
            multiSelect={true}
            confirmButtonText="Select"
            maxSelectedDisplay={3}
          />

          <FormField
            text="Comments"
            value={assignment.special_request}
            handleChangeText={(e: any) => updateTravelForm(index, 'special_request', e)}
            otherStyles="mt-7"
            containerStyles="bg-gray-100"
            keyboardType="default"
            placeholder="Please specify a location if 'Other' is selected, or provide any additional requests here..."
            multiline={true}
            numberOfLines={2}
            inputStyles={'font-pmedium text-black text-lg'}
          />
        </View>
      ))}

      <TouchableOpacity
        className={`mt-4 w-full flex-row items-center justify-start gap-x-1 ${
          !hasAvailableGuests() ? 'opacity-50' : ''
        }`}
        onPress={hasAvailableGuests() ? addTravelForm : undefined}
        disabled={!hasAvailableGuests()}>
        <Image
          source={icons.addon}
          tintColor={colors.black}
          className="h-4 w-4"
          resizeMode="contain"
        />
        <Text className="text-base text-black underline">Add More Guests</Text>
      </TouchableOpacity>
    </AddonItem>
  );
};

export default GuestTravelAddon;
