import { View, Alert, Text } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native-virtualized-view';
import { types, dropdowns, status } from '@/constants';
import { useAuthStore, useBookingStore } from '@/stores';
import SegmentedControl from '@/components/SegmentedControl';
import CustomButton from '@/components/CustomButton';
import CustomCalender from '@/components/CustomCalender';
import handleAPICall from '@/utils/HandleApiCall';
import CustomModal from '../CustomModal';
import CustomChipGroup from '@/components/CustomChipGroup';
import GuestForm from '../GuestForm';
import OtherMumukshuForm from '../OtherMumukshuForm';
import CustomSelectBottomSheet from '../CustomSelectBottomSheet';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';

const SWITCH_OPTIONS = ['Select Dates', 'One Day Visit'];
let CHIPS = ['Self', 'Guest', 'Mumukshus'];

const INITIAL_SIGNLE_DAY_GUEST_FORM = {
  guests: [
    {
      name: '',
      gender: '',
      mobno: '',
      type: '',
    },
  ],
};

const INITIAL_SINGLE_DAY_MUMUKSHU_FORM = {
  mumukshus: [
    {
      cardno: '',
      mobno: '',
    },
  ],
};

const INITIAL_MULTI_DAY_FORM = {
  startDay: '',
  endDay: '',
  roomType: dropdowns.ROOM_TYPE_LIST[0].key,
  floorType: dropdowns.FLOOR_TYPE_LIST[0].key,
};

const INITIAL_GUEST_FORM = {
  startDay: '',
  endDay: '',
  guests: [
    {
      name: '',
      gender: '',
      mobno: '',
      type: '',
      roomType: dropdowns.ROOM_TYPE_LIST[0].key,
      floorType: dropdowns.FLOOR_TYPE_LIST[0].key,
    },
  ],
};

const INITIAL_MUMUKSHU_FORM = {
  startDay: '',
  endDay: '',
  mumukshus: [
    {
      cardno: '',
      mobno: '',
      roomType: dropdowns.ROOM_TYPE_LIST[0].key,
      floorType: dropdowns.FLOOR_TYPE_LIST[0].key,
    },
  ],
};

const RoomBooking = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const tabBarPadding = useTabBarPadding();
  const updateGuestBooking = useBookingStore((state) => state.updateGuestBooking);
  const updateMumukshuBooking = useBookingStore((state) => state.updateMumukshuBooking);

  if (user.res_status == status.STATUS_GUEST) {
    CHIPS = ['Self'];
  }

  useEffect(
    useCallback(() => {
      setIsSubmitting(false);
    }, [])
  );

  // To re-render the page when navigating
  const [key, setKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setKey((prevKey) => prevKey + 1);
      setGuestForm(INITIAL_GUEST_FORM);
      setMumukshuForm(INITIAL_MUMUKSHU_FORM);
      setMultiDayForm(INITIAL_MULTI_DAY_FORM);
    }, [])
  );

  const [selectedChip, setSelectedChip] = useState(CHIPS[0]);
  const handleChipClick = (chip: any) => {
    setSelectedChip(chip);
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [value, setValue] = useState(SWITCH_OPTIONS[0]);

  const [selectedDay, setSelectedDay] = useState();

  const [singleDayGuestForm, setSingleDayGuestForm] = useState(INITIAL_SIGNLE_DAY_GUEST_FORM);

  const addSingleDayGuestForm = () => {
    setSingleDayGuestForm((prev) => ({
      ...prev,
      guests: [
        ...prev.guests,
        {
          name: '',
          gender: '',
          mobno: '',
          type: '',
        },
      ],
    }));
  };

  const handleSingleDayGuestFormChange = (index: any, field: any, value: any) => {
    const updatedForms = singleDayGuestForm.guests.map((guest, i) =>
      i === index ? { ...guest, [field]: value } : guest
    );
    setSingleDayGuestForm((prev) => ({ ...prev, guests: updatedForms }));
  };

  const removeSingleDayGuestForm = (indexToRemove: any) => {
    setSingleDayGuestForm((prev) => ({
      ...prev,
      guests: prev.guests.filter((_, index) => index !== indexToRemove),
    }));
  };

  const isSingleDayGuestFormValid = () => {
    return (
      selectedDay &&
      singleDayGuestForm.guests.every((guest: any) => {
        if (guest.cardno) return guest.mobno && guest.mobno?.length == 10;
        else
          return (
            guest.name && guest.gender && guest.type && guest.mobno && guest.mobno?.length == 10
          );
      })
    );
  };

  const [singleDayMumukshuForm, setSingleDayMumukshuForm] = useState(
    INITIAL_SINGLE_DAY_MUMUKSHU_FORM
  );

  const addSingleDayMumukshuForm = () => {
    setSingleDayMumukshuForm((prev) => ({
      ...prev,
      mumukshus: [
        ...prev.mumukshus,
        {
          cardno: '',
          mobno: '',
        },
      ],
    }));
  };

  const removeSingleDayMumukshuForm = (indexToRemove: any) => {
    setSingleDayMumukshuForm((prev) => ({
      ...prev,
      mumukshus: prev.mumukshus.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleSingleDayMumukshuFormChange = (index: any, key: any, value: any) => {
    setSingleDayMumukshuForm((prev) => ({
      ...prev,
      mumukshus: prev.mumukshus.map((mumukshu, i) =>
        i === index ? { ...mumukshu, [key]: value } : mumukshu
      ),
    }));
  };

  const isSingleDayMumukshuFormValid = () => {
    return (
      selectedDay &&
      singleDayMumukshuForm.mumukshus.every((mumukshu) => {
        return mumukshu.mobno && mumukshu.mobno?.length == 10 && mumukshu.cardno;
      })
    );
  };

  const [multiDayForm, setMultiDayForm] = useState({
    startDay: '',
    endDay: '',
    roomType: dropdowns.ROOM_TYPE_LIST[0].key,
    floorType: dropdowns.FLOOR_TYPE_LIST[0].key,
  });

  const isMultiDayFormValid = () => {
    return (
      multiDayForm.startDay &&
      multiDayForm.endDay &&
      multiDayForm.roomType &&
      multiDayForm.floorType
    );
  };

  const [guestForm, setGuestForm] = useState(INITIAL_GUEST_FORM);

  const addGuestForm = () => {
    setGuestForm((prev) => ({
      ...prev,
      guests: [
        ...prev.guests,
        {
          name: '',
          gender: '',
          mobno: '',
          type: '',
          roomType: dropdowns.ROOM_TYPE_LIST[0].key,
          floorType: dropdowns.FLOOR_TYPE_LIST[0].key,
        },
      ],
    }));
  };

  const handleGuestFormChange = (index: any, field: any, value: any) => {
    const updatedForms = guestForm.guests.map((guest, i) =>
      i === index ? { ...guest, [field]: value } : guest
    );
    setGuestForm((prev) => ({ ...prev, guests: updatedForms }));
  };

  const removeGuestForm = (indexToRemove: any) => {
    setGuestForm((prev) => ({
      ...prev,
      guests: prev.guests.filter((_, index) => index !== indexToRemove),
    }));
  };

  const isGuestFormValid = () => {
    return (
      guestForm.startDay &&
      guestForm.endDay &&
      guestForm.guests.every((guest: any) => {
        if (guest.cardno)
          return guest.mobno && guest.mobno?.length == 10 && guest.roomType && guest.floorType;
        else
          return (
            guest.name &&
            guest.gender &&
            guest.type &&
            guest.roomType &&
            guest.floorType &&
            guest.mobno &&
            guest.mobno?.length == 10
          );
      })
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
          roomType: dropdowns.ROOM_TYPE_LIST[0].key,
          floorType: dropdowns.FLOOR_TYPE_LIST[0].key,
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
      mumukshus: prev.mumukshus.map((mumukshu, i) =>
        i === index ? { ...mumukshu, [key]: value } : mumukshu
      ),
    }));
  };

  const isMumukshuFormValid = () => {
    return (
      mumukshuForm.startDay &&
      mumukshuForm.endDay &&
      mumukshuForm.mumukshus.every((mumukshu) => {
        return (
          mumukshu.cardno &&
          mumukshu.mobno &&
          mumukshu.mobno?.length == 10 &&
          mumukshu.roomType &&
          mumukshu.floorType
        );
      })
    );
  };

  return (
    <View className="mt-3 w-full flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: tabBarPadding,
        }}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}>
        <View key={key}>
          <SegmentedControl
            segments={SWITCH_OPTIONS}
            selectedIndex={SWITCH_OPTIONS.indexOf(value)}
            onSegmentChange={(segment: any) => {
              setValue(segment);
            }}
          />
          {value === SWITCH_OPTIONS[0] && (
            <View>
              <CustomCalender
                type={'period'}
                startDay={multiDayForm.startDay}
                setStartDay={(day: any) => {
                  setMultiDayForm((prev) => ({
                    ...prev,
                    startDay: day,
                    endDay: '',
                  }));
                  setGuestForm((prev) => ({ ...prev, startDay: day, endDay: '' }));
                  setMumukshuForm((prev) => ({
                    ...prev,
                    startDay: day,
                    endDay: '',
                  }));
                }}
                endDay={multiDayForm.endDay}
                setEndDay={(day: any) => {
                  setMultiDayForm((prev) => ({ ...prev, endDay: day }));
                  setGuestForm((prev) => ({ ...prev, endDay: day }));
                  setMumukshuForm((prev) => ({ ...prev, endDay: day }));
                }}
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
              {selectedChip === CHIPS[0] && (
                <View>
                  <CustomSelectBottomSheet
                    className="mt-7"
                    label="Room Type"
                    placeholder="Select Room Type"
                    options={dropdowns.ROOM_TYPE_LIST}
                    selectedValue={multiDayForm.roomType}
                    onValueChange={(val: any) =>
                      setMultiDayForm({ ...multiDayForm, roomType: val })
                    }
                  />

                  <CustomSelectBottomSheet
                    className="mt-7"
                    label="Select Floor Type"
                    placeholder="Select Floor Type"
                    options={dropdowns.FLOOR_TYPE_LIST}
                    selectedValue={multiDayForm.floorType}
                    onValueChange={(val: any) =>
                      setMultiDayForm({ ...multiDayForm, floorType: val })
                    }
                  />

                  <CustomButton
                    text="Book Now"
                    handlePress={async () => {
                      setIsSubmitting(true);
                      if (!isMultiDayFormValid()) {
                        setModalVisible(true);
                        setModalMessage('Please enter all details');
                        setIsSubmitting(false);
                        return;
                      }

                      const temp = transformMumukshuResponse({
                        startDay: multiDayForm.startDay,
                        endDay: multiDayForm.endDay,
                        mumukshus: [
                          {
                            cardno: user.cardno,
                            mobno: user.mobno,
                            issuedto: user.name,
                            gender: user.gender,
                            res_status: user.res_status,
                            roomType: multiDayForm.roomType,
                            floorType: multiDayForm.floorType,
                          },
                        ],
                      });

                      await updateMumukshuBooking('room', temp);
                      router.push(`/booking/${types.ROOM_DETAILS_TYPE}`);
                    }}
                    containerStyles="mt-7 min-h-[62px]"
                    isLoading={isSubmitting}
                    isDisabled={!isMultiDayFormValid()}
                  />
                </View>
              )}
              {selectedChip === CHIPS[1] && (
                <View>
                  <GuestForm
                    guestForm={guestForm}
                    setGuestForm={setGuestForm}
                    handleGuestFormChange={handleGuestFormChange}
                    addGuestForm={addGuestForm}
                    removeGuestForm={removeGuestForm}>
                    {(index: any) => (
                      <>
                        <CustomSelectBottomSheet
                          className="mt-7"
                          label="Room Type"
                          placeholder="Select Room Type"
                          options={dropdowns.ROOM_TYPE_LIST}
                          selectedValue={guestForm.guests[index].roomType}
                          onValueChange={(val: any) =>
                            handleGuestFormChange(index, 'roomType', val)
                          }
                        />

                        <CustomSelectBottomSheet
                          className="mt-7"
                          label="Floor Type"
                          placeholder="Select Floor Type"
                          options={dropdowns.FLOOR_TYPE_LIST}
                          selectedValue={guestForm.guests[index].floorType}
                          onValueChange={(val: any) =>
                            handleGuestFormChange(index, 'floorType', val)
                          }
                        />
                      </>
                    )}
                  </GuestForm>

                  <CustomButton
                    text="Book Now"
                    handlePress={async () => {
                      setIsSubmitting(true);
                      if (!isGuestFormValid()) {
                        setIsSubmitting(false);
                        setModalMessage('Please fill all fields');
                        setModalVisible(true);
                        return;
                      } else {
                        await handleAPICall(
                          'POST',
                          '/guest',
                          null,
                          {
                            cardno: user.cardno,
                            guests: guestForm.guests,
                          },
                          async (res: any) => {
                            const updatedGuests = guestForm.guests.map((formGuest) => {
                              const matchingApiGuest = res.guests.find(
                                (apiGuest: any) => apiGuest.issuedto === formGuest.name
                              );
                              return matchingApiGuest
                                ? { ...formGuest, cardno: matchingApiGuest.cardno }
                                : formGuest;
                            });

                            // Create the updated form object directly
                            const updatedGuestForm = {
                              ...guestForm,
                              guests: updatedGuests,
                            };

                            // Update the state
                            await new Promise((resolve) => {
                              setGuestForm((prev) => {
                                const newForm = updatedGuestForm;
                                resolve(newForm);
                                return newForm;
                              });
                            });

                            // Use the updated form object directly, not the state
                            const temp = transformGuestApiResponse(updatedGuestForm);

                            updateGuestBooking('room', temp);
                            setIsSubmitting(false);
                            setGuestForm(INITIAL_GUEST_FORM);
                            router.push(`/guestBooking/${types.ROOM_DETAILS_TYPE}`);
                          },
                          () => {
                            setIsSubmitting(false);
                          }
                        );
                      }
                    }}
                    containerStyles="mt-7 min-h-[62px]"
                    isLoading={isSubmitting}
                    isDisabled={!isGuestFormValid()}
                  />
                </View>
              )}

              {selectedChip === CHIPS[2] && (
                <View>
                  <OtherMumukshuForm
                    mumukshuForm={mumukshuForm}
                    setMumukshuForm={setMumukshuForm}
                    handleMumukshuFormChange={handleMumukshuFormChange}
                    addMumukshuForm={addMumukshuForm}
                    removeMumukshuForm={removeMumukshuForm}>
                    {(index: any) => (
                      <View>
                        <CustomSelectBottomSheet
                          className="mt-7"
                          label="Room Type"
                          placeholder="Select Room Type"
                          options={dropdowns.ROOM_TYPE_LIST}
                          selectedValue={mumukshuForm.mumukshus[index].roomType}
                          onValueChange={(val: any) =>
                            handleMumukshuFormChange(index, 'roomType', val)
                          }
                        />

                        <CustomSelectBottomSheet
                          className="mt-7"
                          label="Floor Type"
                          placeholder="Select Floor Type"
                          options={dropdowns.FLOOR_TYPE_LIST}
                          selectedValue={mumukshuForm.mumukshus[index].floorType}
                          onValueChange={(val: any) =>
                            handleMumukshuFormChange(index, 'floorType', val)
                          }
                        />
                      </View>
                    )}
                  </OtherMumukshuForm>

                  <CustomButton
                    text="Book Now"
                    handlePress={() => {
                      setIsSubmitting(true);
                      if (!isMumukshuFormValid()) {
                        setIsSubmitting(false);
                        setModalMessage('Please fill all fields');
                        setModalVisible(true);
                        return;
                      }
                      const temp = transformMumukshuResponse(mumukshuForm);

                      updateMumukshuBooking('room', temp);
                      router.push(`/mumukshuBooking/${types.ROOM_DETAILS_TYPE}`);
                    }}
                    containerStyles="mt-7 min-h-[62px]"
                    isDisabled={!isMumukshuFormValid()}
                  />
                </View>
              )}
            </View>
          )}

          {value === SWITCH_OPTIONS[1] && (
            <View>
              <CustomCalender
                selectedDay={selectedDay}
                setSelectedDay={(day: any) => setSelectedDay(day)}
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

              {selectedChip === CHIPS[1] && (
                <GuestForm
                  guestForm={singleDayGuestForm}
                  setGuestForm={setSingleDayGuestForm}
                  handleGuestFormChange={handleSingleDayGuestFormChange}
                  addGuestForm={addSingleDayGuestForm}
                  removeGuestForm={removeSingleDayGuestForm}
                />
              )}

              {selectedChip === CHIPS[2] && (
                <OtherMumukshuForm
                  mumukshuForm={singleDayMumukshuForm}
                  setMumukshuForm={setSingleDayMumukshuForm}
                  handleMumukshuFormChange={handleSingleDayMumukshuFormChange}
                  addMumukshuForm={addSingleDayMumukshuForm}
                  removeMumukshuForm={removeSingleDayMumukshuForm}
                />
              )}

              <CustomButton
                text="Book Now"
                handlePress={async () => {
                  if (!selectedDay) {
                    Alert.alert('Please fill all fields');
                    setIsSubmitting(false);
                    return;
                  }
                  setIsSubmitting(true);

                  if (selectedChip == CHIPS[0]) {
                    const onSuccess = (_data: any) => {
                      Alert.alert('Booking Successful');
                    };

                    const onFinally = () => {
                      setIsSubmitting(false);
                    };

                    await handleAPICall(
                      'POST',
                      '/mumukshu/booking',
                      null,
                      {
                        cardno: user.cardno,
                        primary_booking: {
                          booking_type: 'room',
                          details: {
                            checkin_date: selectedDay,
                            checkout_date: selectedDay,
                            mumukshuGroup: [
                              {
                                roomType: 'nac',
                                floorType: '',
                                mumukshus: [user.cardno],
                              },
                            ],
                          },
                        },
                      },
                      onSuccess,
                      onFinally,
                      () => {}
                    );
                  }

                  if (selectedChip == CHIPS[1]) {
                    if (!isSingleDayGuestFormValid()) {
                      Alert.alert('Please fill all fields');
                      setIsSubmitting(false);
                      return;
                    }

                    const guests = singleDayGuestForm.guests.map((guest: any) => ({
                      cardno: guest.cardno ? guest.cardno : null,
                      name: guest.name,
                      gender: guest.gender,
                      type: guest.type,
                      mobno: guest.mobno ? guest.mobno : null,
                    }));

                    await handleAPICall(
                      'POST',
                      '/guest',
                      null,
                      {
                        cardno: user.cardno,
                        guests: guests,
                      },
                      async (res: any) => {
                        const updatedGuests = res.guests.map((guest: any) => guest.cardno);

                        await handleAPICall(
                          'POST',
                          '/guest/booking',
                          null,
                          {
                            cardno: user.cardno,
                            primary_booking: {
                              booking_type: 'room',
                              details: {
                                checkin_date: selectedDay,
                                checkout_date: selectedDay,
                                guestGroup: [
                                  {
                                    roomType: 'nac',
                                    floorType: '',
                                    guests: updatedGuests,
                                  },
                                ],
                              },
                            },
                          },
                          (_data: any) => {
                            Alert.alert('Booking Successful');
                          },
                          () => {
                            setIsSubmitting(false);
                          }
                        );
                      },
                      () => {
                        setIsSubmitting(false);
                      }
                    );
                  }

                  if (selectedChip == CHIPS[2]) {
                    const onSuccess = (_data: any) => {
                      Alert.alert('Booking Successful');
                    };

                    const onFinally = () => {
                      setIsSubmitting(false);
                    };

                    await handleAPICall(
                      'POST',
                      '/mumukshu/booking',
                      null,
                      {
                        cardno: user.cardno,
                        primary_booking: {
                          booking_type: 'room',
                          details: {
                            checkin_date: selectedDay,
                            checkout_date: selectedDay,
                            mumukshuGroup: [
                              {
                                roomType: 'nac',
                                floorType: '',
                                mumukshus: singleDayMumukshuForm.mumukshus.map(
                                  (mumukshu) => mumukshu.cardno
                                ),
                              },
                            ],
                          },
                        },
                      },
                      onSuccess,
                      onFinally
                    );
                  }
                }}
                containerStyles="mt-10 min-h-[62px]"
                isLoading={isSubmitting}
                isDisabled={
                  selectedChip === CHIPS[1]
                    ? !isSingleDayGuestFormValid()
                    : selectedChip === CHIPS[2]
                      ? !isSingleDayMumukshuFormValid()
                      : false
                }
              />
            </View>
          )}
        </View>
      </ScrollView>

      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        message={modalMessage}
        btnText={'Okay'}
      />
    </View>
  );
};

function transformGuestApiResponse(apiResponse: any) {
  const { startDay, endDay, guests } = apiResponse;

  const groupedGuests = guests.reduce((acc: any, guest: any) => {
    const groupKey = `${guest.roomType}_${guest.floorType}`;
    if (!acc[groupKey]) {
      acc[groupKey] = {
        roomType: guest.roomType,
        floorType: guest.floorType,
        guests: [],
      };
    }

    acc[groupKey].guests.push({
      issuedto: guest.issuedto || guest.name,
      cardno: guest.cardno,
    });

    return acc;
  }, {});

  const guestGroup = Object.values(groupedGuests);

  return {
    startDay,
    endDay,
    guestGroup,
  };
}

function transformMumukshuResponse(data: any) {
  const groupMap: any = {};

  data.mumukshus.forEach((mumukshu: any) => {
    const key = `${mumukshu.roomType}-${mumukshu.floorType}`;
    if (!groupMap[key]) {
      groupMap[key] = {
        roomType: mumukshu.roomType,
        floorType: mumukshu.floorType,
        mumukshus: [],
      };
    }
    groupMap[key].mumukshus.push(mumukshu);
  });

  const mumukshuGroup = Object.values(groupMap);

  return {
    startDay: data.startDay,
    endDay: data.endDay,
    mumukshuGroup: mumukshuGroup,
  };
}

export default RoomBooking;
