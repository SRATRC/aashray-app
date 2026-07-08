import { View, Text } from 'react-native';
import React, { useState, useCallback, useEffect } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { types, dropdowns, status } from '@/src/constants';
import { useAuthStore, useBookingStore } from '@/src/stores';
import { useUtsavDate } from '@/src/hooks/useUtsavDate';
import { useTabBarPadding } from '@/src/hooks/useTabBarPadding';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import CustomButton from '../CustomButton';
import CustomCalender from '../CustomCalender';
import Callout from '../Callout';
import FormField from '../FormField';
import CustomModal from '../CustomModal';
import CustomChipGroup from '../CustomChipGroup';
import OtherMumukshuForm from '../OtherMumukshuForm';
import FormDisplayField from '../FormDisplayField';
import CustomSelectBottomSheet from '../CustomSelectBottomSheet';
import GuestForm from '../GuestForm';
import handleAPICall from '@/src/utils/HandleApiCall';
import moment from 'moment';

let CHIPS = ['Self', 'Mumukshus', 'Guest'];

const INITIAL_GUEST_TRAVEL_FORM = {
  date: '',
  guests: [
    {
      name: '',
      gender: '',
      mobno: '',
      type: '',
      pickup: '',
      drop: '',
      luggage: [],
      travelType: dropdowns.BOOKING_TYPE_LIST[0].value,
      arrival_time: '',
      special_request: '',
      total_people: null,
    },
  ],
};

const INITIAL_MUMUKSHU_FORM = {
  date: '',
  mumukshus: [
    {
      cardno: '',
      mobno: '',
      pickup: '',
      drop: '',
      luggage: [],
      type: dropdowns.BOOKING_TYPE_LIST[0].value,
      total_people: null,
      special_request: '',
      arrival_time: '',
    },
  ],
};

const TravelBooking = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateMumukshuBooking = useBookingStore((state) => state.updateMumukshuBooking);
  const setMumukshuInfo = useBookingStore((state) => state.setMumukshuInfo);
  const updateGuestBooking = useBookingStore((state) => state.updateGuestBooking);
  const setGuestInfo = useBookingStore((state) => state.setGuestInfo);
  const tabBarPadding = useTabBarPadding();

  const otherLocation = dropdowns.LOCATION_LIST.find((loc) => loc.key === 'other');

  // Helper function to check if pickup or drop location requires arrival time
  const requiresArrivalTime = (pickup: string, drop: string) => {
    return (
      (pickup &&
        dropdowns.LOCATION_LIST.find(
          (loc) =>
            loc.value === pickup &&
            (loc.key.toLowerCase().includes('railway') || loc.key.toLowerCase().includes('airport'))
        )) ||
      (drop &&
        dropdowns.LOCATION_LIST.find(
          (loc) =>
            loc.value === drop &&
            (loc.key.toLowerCase().includes('railway') || loc.key.toLowerCase().includes('airport'))
        ))
    );
  };

  if (user.res_status == status.STATUS_GUEST) {
    CHIPS = ['Self'];
  }

  useEffect(
    useCallback(() => {
      setIsSubmitting(false);
    }, [])
  );

  const [selectedChip, setSelectedChip] = useState('Self');
  const handleChipClick = (chip: any) => {
    setSelectedChip(chip);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [activeMumukshuIndex, setActiveMumukshuIndex] = useState(null);
  const [activeGuestTravelIndex, setActiveGuestTravelIndex] = useState<number | null>(null);

  // Round trip = a date RANGE (like room booking): the calendar's start day is the onward
  // date and the end day is the return date. A single date (no end day) is one-way; when an
  // end day is chosen the return leg is the exact reverse of the onward route on that date.
  const [returnDate, setReturnDate] = useState<string>('');

  const [travelForm, setTravelForm] = useState({
    date: '',
    pickup: '',
    drop: '',
    arrival_time: '',
    luggage: [],
    type: dropdowns.BOOKING_TYPE_LIST[0].value,
    total_people: null,
    special_request: '',
  });

  // One-way (no return date) is always valid; a chosen return date must be on/after onward.
  const isReturnLegValid = () => {
    if (!returnDate) return true;
    return !moment(returnDate).isBefore(moment(travelForm.date), 'day');
  };

  const isSelfFormValid = () => {
    const requiresTime = requiresArrivalTime(travelForm.pickup, travelForm.drop);

    if (travelForm.type == dropdowns.BOOKING_TYPE_LIST[1].value && !travelForm.total_people) {
      return false;
    }

    const requiresSpecialRequest =
      travelForm.pickup === otherLocation?.value || travelForm.drop === otherLocation?.value;

    return (
      travelForm.date &&
      travelForm.pickup &&
      travelForm.drop &&
      travelForm.luggage.length > 0 &&
      travelForm.type &&
      (!requiresTime || (requiresTime && travelForm.arrival_time)) &&
      (!requiresSpecialRequest ||
        (requiresSpecialRequest && travelForm.special_request.trim() !== '')) &&
      !(
        (travelForm.pickup == dropdowns.LOCATION_LIST[0].value &&
          travelForm.drop == dropdowns.LOCATION_LIST[0].value) ||
        (travelForm.pickup != dropdowns.LOCATION_LIST[0].value &&
          travelForm.drop != dropdowns.LOCATION_LIST[0].value)
      ) &&
      isReturnLegValid()
    );
  };

  const [mumukshuForm, setMumukshuForm] = useState(INITIAL_MUMUKSHU_FORM);

  const addMumukshuForm = () => {
    setMumukshuForm((prev) => ({
      ...prev,
      mumukshus: [
        ...prev.mumukshus,
        {
          cardno: '',
          mobno: '',
          pickup: '',
          drop: '',
          luggage: [],
          type: dropdowns.BOOKING_TYPE_LIST[0].value,
          total_people: null,
          special_request: '',
          arrival_time: '',
        },
      ],
    }));
  };

  const removeMumukshuForm = (indexToRemove: any) => {
    setMumukshuForm((prev) => ({
      ...prev,
      mumukshus: prev.mumukshus.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleMumukshuFormChange = (index: any, key: any, value: any) => {
    setMumukshuForm((prev) => ({
      ...prev,
      mumukshus: prev.mumukshus.map((mumukshu, i) => {
        if (i !== index) return mumukshu;

        const updated = { ...mumukshu, [key]: value } as any;

        if (key === 'pickup') {
          if (value == 'Research Centre') {
            updated.drop = mumukshu.drop === 'Research Centre' ? '' : mumukshu.drop;
          } else {
            updated.drop = 'Research Centre';
          }
        }
        if (key === 'drop') {
          if (value === 'Research Centre') {
            updated.pickup = mumukshu.pickup === 'Research Centre' ? '' : mumukshu.pickup;
          } else {
            updated.pickup = 'Research Centre';
          }
        }
        return updated;
      }),
    }));
  };

  const isMumukshuFormValid = () => {
    return (
      mumukshuForm.date &&
      mumukshuForm.mumukshus.every((mumukshu) => {
        const requiresTime = requiresArrivalTime(mumukshu.pickup, mumukshu.drop);

        if (mumukshu.type == dropdowns.BOOKING_TYPE_LIST[1].value && !mumukshu.total_people) {
          return false;
        }

        const requiresSpecialRequest =
          mumukshu.pickup === otherLocation?.value || mumukshu.drop === otherLocation?.value;

        return (
          mumukshu.mobno?.length === 10 &&
          mumukshu.cardno &&
          mumukshu.pickup &&
          mumukshu.drop &&
          mumukshu.luggage.length > 0 &&
          mumukshu.type &&
          (!requiresTime || (requiresTime && mumukshu.arrival_time)) &&
          (!requiresSpecialRequest ||
            (requiresSpecialRequest && mumukshu.special_request.trim() !== '')) &&
          !(
            (mumukshu.pickup === dropdowns.LOCATION_LIST[0].value &&
              mumukshu.drop === dropdowns.LOCATION_LIST[0].value) ||
            (mumukshu.pickup !== dropdowns.LOCATION_LIST[0].value &&
              mumukshu.drop !== dropdowns.LOCATION_LIST[0].value)
          )
        );
      }) &&
      isReturnLegValid()
    );
  };

  const [guestTravelForm, setGuestTravelForm] = useState(INITIAL_GUEST_TRAVEL_FORM);

  const addGuestTravelForm = () => {
    setGuestTravelForm((prev) => ({
      ...prev,
      guests: [
        ...prev.guests,
        {
          name: '',
          gender: '',
          mobno: '',
          type: '',
          pickup: '',
          drop: '',
          luggage: [],
          travelType: dropdowns.BOOKING_TYPE_LIST[0].value,
          arrival_time: '',
          special_request: '',
          total_people: null,
        },
      ],
    }));
  };

  const removeGuestTravelForm = (indexToRemove: any) => {
    setGuestTravelForm((prev) => ({
      ...prev,
      guests: prev.guests.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleGuestTravelFormChange = (index: any, field: any, value: any) => {
    setGuestTravelForm((prev) => ({
      ...prev,
      guests: prev.guests.map((guest, i) => {
        if (i !== index) return guest;

        const updated = { ...guest, [field]: value } as any;

        if (field === 'pickup') {
          if (value == 'Research Centre') {
            updated.drop = guest.drop === 'Research Centre' ? '' : guest.drop;
          } else {
            updated.drop = 'Research Centre';
          }
          if (!requiresArrivalTime(value, updated.drop)) updated.arrival_time = '';
        }
        if (field === 'drop') {
          if (value === 'Research Centre') {
            updated.pickup = guest.pickup === 'Research Centre' ? '' : guest.pickup;
          } else {
            updated.pickup = 'Research Centre';
          }
          if (!requiresArrivalTime(updated.pickup, value)) updated.arrival_time = '';
        }
        return updated;
      }),
    }));
  };

  const isGuestTravelFormValid = () => {
    return (
      guestTravelForm.date &&
      guestTravelForm.guests.every((guest: any) => {
        const requiresTime = requiresArrivalTime(guest.pickup, guest.drop);

        if (guest.travelType == dropdowns.BOOKING_TYPE_LIST[1].value && !guest.total_people) {
          return false;
        }

        const requiresSpecialRequest =
          guest.pickup === otherLocation?.value || guest.drop === otherLocation?.value;

        const hasGuestIdentity = guest.cardno
          ? guest.mobno?.length === 10
          : guest.name && guest.gender && guest.type && guest.mobno?.length === 10;

        return (
          hasGuestIdentity &&
          guest.pickup &&
          guest.drop &&
          guest.luggage.length > 0 &&
          guest.travelType &&
          (!requiresTime || (requiresTime && guest.arrival_time)) &&
          (!requiresSpecialRequest ||
            (requiresSpecialRequest && guest.special_request.trim() !== '')) &&
          !(
            (guest.pickup === dropdowns.LOCATION_LIST[0].value &&
              guest.drop === dropdowns.LOCATION_LIST[0].value) ||
            (guest.pickup !== dropdowns.LOCATION_LIST[0].value &&
              guest.drop !== dropdowns.LOCATION_LIST[0].value)
          )
        );
      }) &&
      isReturnLegValid()
    );
  };

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

  // A round trip books a second leg that is the exact reverse of the onward route
  // (pickup/drop swapped) on the chosen return date. Return timing is coordinated by staff,
  // so the return leg carries no arrival_time. Both legs keep the same per-group shape so
  // preparingRequestBody runs them through the identical transform.
  const attachReturnLeg = (temp: any) => {
    if (!returnDate) return temp;

    const sourceGroup = temp.mumukshuGroup || temp.guestGroup;
    if (!sourceGroup) return temp;

    const returnGroup = sourceGroup.map((g: any) => ({
      ...g,
      pickup: g.drop,
      drop: g.pickup,
      arrival_time: '',
      // Also clear per-person arrival_time; otherwise transformMumukshuGroup's fallback
      // resurrects the onward flight/train time onto the return leg.
      ...(g.mumukshus
        ? { mumukshus: g.mumukshus.map((m: any) => ({ ...m, arrival_time: '' })) }
        : {}),
    }));

    const result = { ...temp, return_date: returnDate };
    if (temp.mumukshuGroup) {
      result.returnMumukshuGroup = returnGroup;
    } else {
      result.returnGuestGroup = returnGroup;
    }
    return result;
  };

  return (
    <View className="mt-3 w-full flex-1">
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: tabBarPadding + 20,
        }}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
        keyboardShouldPersistTaps="handled">
        <Callout
          variant="warning"
          message="For a round trip, add a return date — the same route is booked in reverse."
        />
        <CustomCalender
          type={'period'}
          startDay={travelForm.date}
          setStartDay={(day: any) => {
            setTravelForm((prev) => ({ ...prev, date: day }));
            setMumukshuForm((prev) => ({ ...prev, date: day }));
            setGuestTravelForm((prev) => ({ ...prev, date: day }));
            setReturnDate('');
          }}
          endDay={returnDate}
          setEndDay={(day: any) => {
            if (!day) {
              setReturnDate('');
              return;
            }
            // A tap before the onward date restarts the range at that day (no invalid
            // return-before-onward state) — mirrors setStartDay.
            if (moment(day).isBefore(moment(travelForm.date), 'day')) {
              setTravelForm((prev) => ({ ...prev, date: day }));
              setMumukshuForm((prev) => ({ ...prev, date: day }));
              setGuestTravelForm((prev) => ({ ...prev, date: day }));
              setReturnDate('');
              return;
            }
            setReturnDate(day);
          }}
          minDate={moment(new Date()).format('YYYY-MM-DD')}
        />

        <View className="mt-7 flex w-full flex-col">
          <Text className="font-pmedium text-base text-gray-600">Book for</Text>
          <CustomChipGroup
            chips={CHIPS}
            selectedChip={selectedChip}
            handleChipPress={handleChipClick}
            containerStyles={'mt-1'}
            chipContainerStyles={'py-2'}
            textStyles={'text-sm'}
          />
        </View>

        {selectedChip == CHIPS[0] && (
          <View>
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
                let newDrop = travelForm.drop;
                if (val === 'Research Centre') {
                  // If selecting Research Centre as pickup, drop must be something else
                  newDrop = travelForm.drop === 'Research Centre' ? '' : travelForm.drop;
                } else {
                  // If selecting anything else as pickup, drop must be Research Centre
                  newDrop = 'Research Centre';
                }

                setTravelForm({
                  ...travelForm,
                  pickup: val,
                  drop: newDrop,
                  // Clear arrival_time if the new pickup/drop combination doesn't require it
                  arrival_time: requiresArrivalTime(val, newDrop) ? travelForm.arrival_time : '',
                });
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
                let newPickup = travelForm.pickup;
                if (val === 'Research Centre') {
                  // If selecting Research Centre as drop, pickup must be something else
                  newPickup = travelForm.pickup === 'Research Centre' ? '' : travelForm.pickup;
                } else {
                  // If selecting anything else as drop, pickup must be Research Centre
                  newPickup = 'Research Centre';
                }

                setTravelForm({
                  ...travelForm,
                  drop: val,
                  pickup: newPickup,
                  // Clear arrival_time if the new pickup/drop combination doesn't require it
                  arrival_time: requiresArrivalTime(newPickup, val) ? travelForm.arrival_time : '',
                });
              }}
              saveKeyInsteadOfValue={false}
            />

            {requiresArrivalTime(travelForm.pickup, travelForm.drop) ? (
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
                  onPress={() => setDatePickerVisibility(true)}
                />
                <DateTimePickerModal
                  isVisible={isDatePickerVisible}
                  mode="time"
                  date={
                    travelForm.arrival_time
                      ? moment(travelForm.arrival_time, 'HH:mm').toDate()
                      : new Date()
                  }
                  onConfirm={(date: Date) => {
                    const timeOnly = moment(date).format('HH:mm');
                    setTravelForm((prev) => ({
                      ...prev,
                      arrival_time: timeOnly,
                    }));
                    setDatePickerVisibility(false);
                  }}
                  onCancel={() => setDatePickerVisibility(false)}
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
              handleChangeText={(e: any) => setTravelForm({ ...travelForm, special_request: e })}
              otherStyles="mt-7"
              containerStyles="bg-gray-100"
              keyboardType="default"
              inputStyles={'font-pmedium text-black text-lg'}
              placeholder="Please specify a location if 'Other' is selected, or provide any additional requests here..."
              multiline={true}
              numberOfLines={2}
            />
          </View>
        )}

        {selectedChip == CHIPS[1] && (
          <View>
            <OtherMumukshuForm
              mumukshuForm={mumukshuForm}
              setMumukshuForm={setMumukshuForm}
              handleMumukshuFormChange={handleMumukshuFormChange}
              addMumukshuForm={addMumukshuForm}
              removeMumukshuForm={removeMumukshuForm}>
              {(index: any) => (
                <>
                  <CustomSelectBottomSheet
                    className="mt-7"
                    label="Booking Type"
                    placeholder="Select Booking Type"
                    options={dropdowns.BOOKING_TYPE_LIST}
                    selectedValue={mumukshuForm.mumukshus[index].type}
                    onValueChange={(val: any) => handleMumukshuFormChange(index, 'type', val)}
                    saveKeyInsteadOfValue={false}
                  />

                  {mumukshuForm.mumukshus[index].type == dropdowns.BOOKING_TYPE_LIST[1].value && (
                    <FormField
                      text="Total People"
                      value={mumukshuForm.mumukshus[index].total_people}
                      handleChangeText={(e: any) =>
                        handleMumukshuFormChange(index, 'total_people', e)
                      }
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
                    options={getLocationOptions(mumukshuForm.date)}
                    selectedValue={mumukshuForm.mumukshus[index].pickup}
                    onValueChange={(val: any) => {
                      handleMumukshuFormChange(index, 'pickup', val);
                      // Clear arrival_time if the new pickup/drop combination doesn't require it
                      if (!requiresArrivalTime(val, mumukshuForm.mumukshus[index].drop)) {
                        handleMumukshuFormChange(index, 'arrival_time', '');
                      }
                    }}
                    saveKeyInsteadOfValue={false}
                  />

                  <CustomSelectBottomSheet
                    className="mt-7"
                    label="Drop Location"
                    placeholder="Select Drop Location"
                    options={getLocationOptions(mumukshuForm.date)}
                    selectedValue={mumukshuForm.mumukshus[index].drop}
                    onValueChange={(val: any) => {
                      handleMumukshuFormChange(index, 'drop', val);
                      // Clear arrival_time if the new pickup/drop combination doesn't require it
                      if (!requiresArrivalTime(mumukshuForm.mumukshus[index].pickup, val)) {
                        handleMumukshuFormChange(index, 'arrival_time', '');
                      }
                    }}
                    saveKeyInsteadOfValue={false}
                  />

                  {requiresArrivalTime(
                    mumukshuForm.mumukshus[index].pickup,
                    mumukshuForm.mumukshus[index].drop
                  ) ? (
                    <>
                      <FormDisplayField
                        text="Flight/Train Time"
                        value={
                          mumukshuForm.mumukshus[index].arrival_time
                            ? moment(mumukshuForm.mumukshus[index].arrival_time, 'HH:mm').format(
                                'h:mm a'
                              )
                            : ''
                        }
                        placeholder="Flight/Train Time"
                        otherStyles="mt-5"
                        inputStyles="font-pmedium text-black text-lg"
                        backgroundColor="bg-gray-100"
                        onPress={() => {
                          setDatePickerVisibility(true);
                          setActiveMumukshuIndex(index);
                        }}
                      />
                      <DateTimePickerModal
                        isVisible={isDatePickerVisible && activeMumukshuIndex === index}
                        mode="time"
                        date={
                          mumukshuForm.mumukshus[index].arrival_time
                            ? moment(mumukshuForm.mumukshus[index].arrival_time, 'HH:mm').toDate()
                            : new Date()
                        }
                        onConfirm={(date: Date) => {
                          const timeOnly = moment(date).format('HH:mm');
                          handleMumukshuFormChange(index, 'arrival_time', timeOnly);
                          setDatePickerVisibility(false);
                        }}
                        onCancel={() => setDatePickerVisibility(false)}
                      />
                    </>
                  ) : null}

                  <CustomSelectBottomSheet
                    className="mt-7"
                    label="Luggage"
                    placeholder="Select any luggage"
                    options={dropdowns.LUGGAGE_LIST}
                    selectedValues={mumukshuForm.mumukshus[index].luggage}
                    onValuesChange={(val: any) => handleMumukshuFormChange(index, 'luggage', val)}
                    saveKeyInsteadOfValue={false}
                    multiSelect={true}
                    confirmButtonText="Select"
                    maxSelectedDisplay={3}
                  />

                  <FormField
                    text="Comments"
                    value={mumukshuForm.mumukshus[index].special_request}
                    handleChangeText={(e: any) =>
                      handleMumukshuFormChange(index, 'special_request', e)
                    }
                    otherStyles="mt-7"
                    containerStyles="bg-gray-100"
                    keyboardType="default"
                    inputStyles={'font-pmedium text-black text-lg'}
                    placeholder="Please specify a location if 'Other' is selected, or provide any additional requests here..."
                    multiline={true}
                    numberOfLines={2}
                  />
                </>
              )}
            </OtherMumukshuForm>
          </View>
        )}

        {selectedChip == 'Guest' && (
          <View>
            <GuestForm
              guestForm={guestTravelForm}
              setGuestForm={setGuestTravelForm}
              handleGuestFormChange={handleGuestTravelFormChange}
              addGuestForm={addGuestTravelForm}
              removeGuestForm={removeGuestTravelForm}>
              {(index: any) => (
                <>
                  <CustomSelectBottomSheet
                    className="mt-7"
                    label="Booking Type"
                    placeholder="Select Booking Type"
                    options={dropdowns.BOOKING_TYPE_LIST}
                    selectedValue={guestTravelForm.guests[index].travelType}
                    onValueChange={(val: any) =>
                      handleGuestTravelFormChange(index, 'travelType', val)
                    }
                    saveKeyInsteadOfValue={false}
                  />

                  {guestTravelForm.guests[index].travelType ==
                    dropdowns.BOOKING_TYPE_LIST[1].value && (
                    <FormField
                      text="Total People"
                      value={guestTravelForm.guests[index].total_people}
                      handleChangeText={(e: any) =>
                        handleGuestTravelFormChange(index, 'total_people', e)
                      }
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
                    options={getLocationOptions(guestTravelForm.date)}
                    selectedValue={guestTravelForm.guests[index].pickup}
                    onValueChange={(val: any) =>
                      handleGuestTravelFormChange(index, 'pickup', val)
                    }
                    saveKeyInsteadOfValue={false}
                  />

                  <CustomSelectBottomSheet
                    className="mt-7"
                    label="Drop Location"
                    placeholder="Select Drop Location"
                    options={getLocationOptions(guestTravelForm.date)}
                    selectedValue={guestTravelForm.guests[index].drop}
                    onValueChange={(val: any) => handleGuestTravelFormChange(index, 'drop', val)}
                    saveKeyInsteadOfValue={false}
                  />

                  {requiresArrivalTime(
                    guestTravelForm.guests[index].pickup,
                    guestTravelForm.guests[index].drop
                  ) ? (
                    <>
                      <FormDisplayField
                        text="Flight/Train Time"
                        value={
                          guestTravelForm.guests[index].arrival_time
                            ? moment(guestTravelForm.guests[index].arrival_time, 'HH:mm').format(
                                'h:mm a'
                              )
                            : ''
                        }
                        placeholder="Flight/Train Time"
                        otherStyles="mt-5"
                        inputStyles="font-pmedium text-black text-lg"
                        backgroundColor="bg-gray-100"
                        onPress={() => {
                          setDatePickerVisibility(true);
                          setActiveGuestTravelIndex(index);
                        }}
                      />
                      <DateTimePickerModal
                        isVisible={isDatePickerVisible && activeGuestTravelIndex === index}
                        mode="time"
                        date={
                          guestTravelForm.guests[index].arrival_time
                            ? moment(guestTravelForm.guests[index].arrival_time, 'HH:mm').toDate()
                            : new Date()
                        }
                        onConfirm={(date: Date) => {
                          const timeOnly = moment(date).format('HH:mm');
                          handleGuestTravelFormChange(index, 'arrival_time', timeOnly);
                          setDatePickerVisibility(false);
                        }}
                        onCancel={() => setDatePickerVisibility(false)}
                      />
                    </>
                  ) : null}

                  <CustomSelectBottomSheet
                    className="mt-7"
                    label="Luggage"
                    placeholder="Select any luggage"
                    options={dropdowns.LUGGAGE_LIST}
                    selectedValues={guestTravelForm.guests[index].luggage}
                    onValuesChange={(val: any) =>
                      handleGuestTravelFormChange(index, 'luggage', val)
                    }
                    saveKeyInsteadOfValue={false}
                    multiSelect={true}
                    confirmButtonText="Select"
                    maxSelectedDisplay={3}
                  />

                  <FormField
                    text="Comments"
                    value={guestTravelForm.guests[index].special_request}
                    handleChangeText={(e: any) =>
                      handleGuestTravelFormChange(index, 'special_request', e)
                    }
                    otherStyles="mt-7"
                    containerStyles="bg-gray-100"
                    keyboardType="default"
                    inputStyles={'font-pmedium text-black text-lg'}
                    placeholder="Please specify a location if 'Other' is selected, or provide any additional requests here..."
                    multiline={true}
                    numberOfLines={2}
                  />
                </>
              )}
            </GuestForm>
          </View>
        )}

        <CustomButton
          text="Book Now"
          handlePress={async () => {
            setIsSubmitting(true);
            if (selectedChip == CHIPS[0]) {
              if (!isSelfFormValid()) {
                setModalVisible(true);
                setModalMessage('Please fill all fields');
                setIsSubmitting(false);
                return;
              }

              const temp = transformMumukshuData({
                date: travelForm.date,
                mumukshus: [
                  {
                    cardno: user.cardno,
                    mobno: user.mobno,
                    pickup: travelForm.pickup,
                    drop: travelForm.drop,
                    luggage: travelForm.luggage,
                    type: travelForm.type,
                    total_people: travelForm.total_people,
                    special_request: travelForm.special_request,
                    arrival_time: travelForm.arrival_time,
                  },
                ],
              });

              await updateMumukshuBooking('travel', attachReturnLeg(temp));
              router.push(`/booking/${types.TRAVEL_DETAILS_TYPE}`);
            }
            if (selectedChip == CHIPS[1]) {
              if (!isMumukshuFormValid()) {
                setModalVisible(true);
                setModalMessage('Please fill all fields');
                setIsSubmitting(false);
                return;
              }
              const mumukshuInfoArray = mumukshuForm.mumukshus.map((mumukshu: any) => ({
                cardno: mumukshu.cardno,
                name: mumukshu.issuedto,
              }));
              setMumukshuInfo(mumukshuInfoArray);
              const temp = transformMumukshuData(mumukshuForm);
              await updateMumukshuBooking('travel', attachReturnLeg(temp));
              router.push(`/mumukshuBooking/${types.TRAVEL_DETAILS_TYPE}`);
            }
            if (selectedChip == 'Guest') {
              if (!isGuestTravelFormValid()) {
                setModalVisible(true);
                setModalMessage('Please fill all fields');
                setIsSubmitting(false);
                return;
              }

              await handleAPICall(
                'POST',
                '/guest',
                null,
                {
                  cardno: user.cardno,
                  guests: guestTravelForm.guests,
                },
                async (res: any) => {
                  const guestInfoArray = res.guests.map((apiGuest: any) => ({
                    cardno: apiGuest.cardno,
                    name: apiGuest.issuedto || apiGuest.name,
                  }));
                  setGuestInfo(guestInfoArray);

                  const updatedGuests = guestTravelForm.guests.map((formGuest) => {
                    const matchingApiGuest = res.guests.find(
                      (apiGuest: any) => apiGuest.issuedto === formGuest.name
                    );
                    return matchingApiGuest
                      ? { ...formGuest, cardno: matchingApiGuest.cardno }
                      : formGuest;
                  });

                  const temp = transformGuestTravelData({
                    date: guestTravelForm.date,
                    guests: updatedGuests,
                  });

                  updateGuestBooking('travel', attachReturnLeg(temp));
                  setIsSubmitting(false);
                  setGuestTravelForm(INITIAL_GUEST_TRAVEL_FORM);
                  router.push(`/guestBooking/${types.TRAVEL_DETAILS_TYPE}`);
                },
                () => {
                  setIsSubmitting(false);
                }
              );
            }
          }}
          containerStyles="mt-7 w-full px-1 min-h-[62px]"
          isLoading={isSubmitting}
          isDisabled={
            selectedChip == CHIPS[0]
              ? !isSelfFormValid()
              : selectedChip == 'Guest'
                ? !isGuestTravelFormValid()
                : !isMumukshuFormValid()
          }
        />
      </KeyboardAwareScrollView>
      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        message={modalMessage}
        btnText={'Okay'}
      />
    </View>
  );
};

function transformMumukshuData(inputData: any) {
  const { date, mumukshus } = inputData;

  const groupedMumukshus = mumukshus.reduce((acc: any, mumukshu: any) => {
    const key = `${mumukshu.pickup}-${mumukshu.drop}-${mumukshu.type}-${mumukshu.total_people || 'none'}`;
    if (!acc[key]) {
      acc[key] = {
        pickup: mumukshu.pickup,
        drop: mumukshu.drop,
        type: mumukshu.type,
        arrival_time: mumukshu.arrival_time,
        luggage: mumukshu.luggage,
        special_request: mumukshu.special_request,
        total_people: mumukshu.total_people,
        mumukshus: [],
      };
    }
    acc[key].mumukshus.push(mumukshu);

    return acc;
  }, {});

  const mumukshuGroup = Object.values(groupedMumukshus);

  return {
    date: date,
    mumukshuGroup: mumukshuGroup,
  };
}

function transformGuestTravelData(inputData: any) {
  const { date, guests } = inputData;

  const groupedGuests = guests.reduce((acc: any, guest: any) => {
    const key = `${guest.pickup}-${guest.drop}-${guest.travelType}-${guest.total_people || 'none'}`;
    if (!acc[key]) {
      acc[key] = {
        pickup: guest.pickup,
        drop: guest.drop,
        type: guest.travelType,
        arrival_time: guest.arrival_time,
        luggage: guest.luggage,
        special_request: guest.special_request,
        total_people: guest.total_people,
        guests: [],
      };
    }
    acc[key].guests.push({
      issuedto: guest.issuedto || guest.name,
      cardno: guest.cardno,
    });

    return acc;
  }, {});

  const guestGroup = Object.values(groupedGuests);

  return {
    date: date,
    guestGroup: guestGroup,
  };
}

export default TravelBooking;
