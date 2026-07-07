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
import FormField from '../FormField';
import CustomModal from '../CustomModal';
import CustomChipGroup from '../CustomChipGroup';
import OtherMumukshuForm from '../OtherMumukshuForm';
import FormDisplayField from '../FormDisplayField';
import CustomSelectBottomSheet from '../CustomSelectBottomSheet';
import moment from 'moment';

let CHIPS = ['Self', 'Mumukshus'];

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

  // Round-trip state (applies to both Self and Mumukshu branches)
  const [tripType, setTripType] = useState<'one_way' | 'round_trip'>('one_way');
  const [returnDate, setReturnDate] = useState<string>('');
  const [returnPickup, setReturnPickup] = useState<string>('');
  const [returnDrop, setReturnDrop] = useState<string>('');
  const [returnArrivalTime, setReturnArrivalTime] = useState<string>('');
  const [isReturnDatePickerVisible, setReturnDatePickerVisibility] = useState(false);

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

  // Round trip is valid when off, or when a return date on/after the onward date is chosen
  const isReturnLegValid = () => {
    if (tripType !== 'round_trip') return true;
    return !!returnDate && !moment(returnDate).isBefore(moment(travelForm.date), 'day');
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

  // Default reversed route shown/used when the user hasn't overridden return pickup/drop
  const defaultReturnPickup =
    selectedChip == CHIPS[0] ? travelForm.drop : mumukshuForm.mumukshus[0]?.drop || '';
  const defaultReturnDrop =
    selectedChip == CHIPS[0] ? travelForm.pickup : mumukshuForm.mumukshus[0]?.pickup || '';

  // Mirrors the onward mumukshuGroup into a return leg, keeping the same per-group shape
  // (pickup/drop/type/luggage/special_request/total_people/mumukshus) so preparingRequestBody
  // can run both legs through the identical transform.
  const attachReturnLeg = (temp: any) => {
    if (tripType !== 'round_trip') return temp;

    const returnGroup = (temp.mumukshuGroup || []).map((g: any) => ({
      ...g,
      pickup: returnPickup || g.drop,
      drop: returnDrop || g.pickup,
      arrival_time: returnArrivalTime || '',
    }));

    return {
      ...temp,
      return_date: returnDate,
      returnMumukshuGroup: returnGroup,
    };
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
        <CustomCalender
          selectedDay={travelForm.date}
          setSelectedDay={(day: any) => {
            setTravelForm((prev) => ({ ...prev, date: day }));
            setMumukshuForm((prev) => ({ ...prev, date: day }));
          }}
          minDate={moment(new Date()).format('YYYY-MM-DD')}
        />

        <View className="mt-7 flex w-full flex-col">
          <Text className="font-pmedium text-base text-gray-600">Trip Type</Text>
          <CustomChipGroup
            chips={['One-way', 'Round trip']}
            selectedChip={tripType === 'one_way' ? 'One-way' : 'Round trip'}
            handleChipPress={(chip: any) =>
              setTripType(chip === 'One-way' ? 'one_way' : 'round_trip')
            }
            containerStyles={'mt-1'}
            chipContainerStyles={'py-2'}
            textStyles={'text-sm'}
          />
        </View>

        {tripType === 'round_trip' && (
          <View className="mt-7 flex w-full flex-col">
            <CustomCalender
              selectedDay={returnDate}
              setSelectedDay={(day: any) => setReturnDate(day)}
              minDate={travelForm.date || moment(new Date()).format('YYYY-MM-DD')}
            />
            <Text className="mt-2 font-pregular text-sm text-gray-500">
              We'll book your return trip on this date. Edit the return stops below if needed.
            </Text>
            <Text className="mt-3 font-pregular text-xs text-gray-400">
              Default return route: {defaultReturnPickup || '—'} → {defaultReturnDrop || '—'}{' '}
              (reverse of onward route)
            </Text>

            <CustomSelectBottomSheet
              className="mt-7"
              label="Return Pickup Location"
              placeholder="Select Return Pickup Location"
              options={getLocationOptions(returnDate || travelForm.date)}
              selectedValue={returnPickup || defaultReturnPickup}
              onValueChange={(val: any) => {
                const currentDrop = returnDrop || defaultReturnDrop;
                let newDrop = currentDrop;
                if (val === 'Research Centre') {
                  newDrop = currentDrop === 'Research Centre' ? '' : currentDrop;
                } else {
                  newDrop = 'Research Centre';
                }
                setReturnPickup(val);
                setReturnDrop(newDrop);
                if (!requiresArrivalTime(val, newDrop)) setReturnArrivalTime('');
              }}
              saveKeyInsteadOfValue={false}
            />

            <CustomSelectBottomSheet
              className="mt-7"
              label="Return Drop Location"
              placeholder="Select Return Drop Location"
              options={getLocationOptions(returnDate || travelForm.date)}
              selectedValue={returnDrop || defaultReturnDrop}
              onValueChange={(val: any) => {
                const currentPickup = returnPickup || defaultReturnPickup;
                let newPickup = currentPickup;
                if (val === 'Research Centre') {
                  newPickup = currentPickup === 'Research Centre' ? '' : currentPickup;
                } else {
                  newPickup = 'Research Centre';
                }
                setReturnDrop(val);
                setReturnPickup(newPickup);
                if (!requiresArrivalTime(newPickup, val)) setReturnArrivalTime('');
              }}
              saveKeyInsteadOfValue={false}
            />

            {requiresArrivalTime(
              returnPickup || defaultReturnPickup,
              returnDrop || defaultReturnDrop
            ) ? (
              <>
                <FormDisplayField
                  text="Return Flight/Train Time"
                  value={
                    returnArrivalTime ? moment(returnArrivalTime, 'HH:mm').format('h:mm a') : ''
                  }
                  placeholder="Return Flight/Train Time"
                  otherStyles="mt-5"
                  inputStyles="font-pmedium text-black text-lg"
                  backgroundColor="bg-gray-100"
                  onPress={() => setReturnDatePickerVisibility(true)}
                />
                <DateTimePickerModal
                  isVisible={isReturnDatePickerVisible}
                  mode="time"
                  date={
                    returnArrivalTime ? moment(returnArrivalTime, 'HH:mm').toDate() : new Date()
                  }
                  onConfirm={(date: Date) => {
                    setReturnArrivalTime(moment(date).format('HH:mm'));
                    setReturnDatePickerVisibility(false);
                  }}
                  onCancel={() => setReturnDatePickerVisibility(false)}
                />
              </>
            ) : null}
          </View>
        )}

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
          }}
          containerStyles="mt-7 w-full px-1 min-h-[62px]"
          isLoading={isSubmitting}
          isDisabled={selectedChip == CHIPS[0] ? !isSelfFormValid() : !isMumukshuFormValid()}
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

export default TravelBooking;
