import { View, Alert, Text } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { types, dropdowns } from '../../constants';
import { useRouter } from 'expo-router';
import { useGlobalContext } from '../../context/GlobalProvider';
import SegmentedControl from '../../components/SegmentedControl';
import CustomDropdown from '../../components/CustomDropdown';
import CustomButton from '../../components/CustomButton';
import CustomCalender from '../../components/CustomCalender';
import handleAPICall from '../../utils/HandleApiCall';
import CustomModal from '../CustomModal';
import CustomChipGroup from '../../components/CustomChipGroup';
import GuestForm from '../GuestForm';
import OtherMumukshuForm from '../OtherMumukshuForm';

const SWITCH_OPTIONS = ['Select Dates', 'One Day Visit'];
const CHIPS = ['Self', 'Guest', 'Mumukshus'];

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

const INITIAL_GUEST_FORM = {
  startDay: '',
  endDay: '',
  guests: [
    {
      name: '',
      gender: '',
      mobno: '',
      type: '',
      roomType: '',
      floorType: '',
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
      roomType: '',
      floorType: '',
    },
  ],
};

const RoomBooking = () => {
  const router = useRouter();
  const { user, updateBooking, updateGuestBooking, updateMumukshuBooking } = useGlobalContext();

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
    roomType: '',
    floorType: '',
  });

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
          roomType: '',
          floorType: '',
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
          roomType: '',
          floorType: '',
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
    <View className="mt-10 flex-1 justify-center" key={key}>
      <SegmentedControl
        segments={SWITCH_OPTIONS}
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
              <CustomDropdown
                otherStyles="mt-7"
                text={'Room Type'}
                placeholder={'Select Room Type'}
                data={dropdowns.ROOM_TYPE_LIST}
                setSelected={(val: any) => setMultiDayForm({ ...multiDayForm, roomType: val })}
              />

              <CustomDropdown
                otherStyles="mt-7"
                text={'Book Only if Ground Floor is Available'}
                placeholder={'Select Floor Type'}
                data={dropdowns.FLOOR_TYPE_LIST}
                setSelected={(val: any) => setMultiDayForm({ ...multiDayForm, floorType: val })}
              />

              <CustomButton
                text="Book Now"
                handlePress={async () => {
                  setIsSubmitting(true);
                  if (
                    !multiDayForm.startDay ||
                    !multiDayForm.endDay ||
                    !multiDayForm.roomType ||
                    !multiDayForm.floorType
                  ) {
                    setModalVisible(true);
                    setModalMessage('Please enter all details');
                    setIsSubmitting(false);
                    return;
                  }

                  await updateBooking('room', multiDayForm);
                  router.push(`/booking/${types.ROOM_DETAILS_TYPE}`);
                }}
                containerStyles="mt-7 min-h-[62px]"
                isLoading={isSubmitting}
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
                    <CustomDropdown
                      otherStyles="mt-7"
                      text={'Room Type'}
                      placeholder={'Select Room Type'}
                      data={dropdowns.ROOM_TYPE_LIST}
                      value={guestForm.guests[index].roomType}
                      setSelected={(val: any) => handleGuestFormChange(index, 'roomType', val)}
                    />

                    <CustomDropdown
                      otherStyles="mt-7"
                      text={'Book Only if Ground Floor is Available'}
                      placeholder={'Select Floor Type'}
                      data={dropdowns.FLOOR_TYPE_LIST}
                      value={guestForm.guests[index].floorType}
                      setSelected={(val: any) => handleGuestFormChange(index, 'floorType', val)}
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
                            (apiGuest: any) => apiGuest.name === formGuest.name
                          );
                          return matchingApiGuest
                            ? { ...formGuest, cardno: matchingApiGuest.cardno }
                            : formGuest;
                        });

                        await new Promise((resolve) => {
                          setGuestForm((prev) => {
                            const newForm = {
                              ...prev,
                              guests: updatedGuests,
                            };
                            resolve(newForm);
                            return newForm;
                          });
                        });

                        const temp = transformGuestApiResponse(guestForm);

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
                    <CustomDropdown
                      otherStyles="mt-7"
                      text={'Room Type'}
                      placeholder={'Select Room Type'}
                      data={dropdowns.ROOM_TYPE_LIST}
                      setSelected={(val: any) => handleMumukshuFormChange(index, 'roomType', val)}
                    />

                    <CustomDropdown
                      otherStyles="mt-7"
                      text={'Book Only if Ground Floor is Available'}
                      placeholder={'Select Floor Type'}
                      data={dropdowns.FLOOR_TYPE_LIST}
                      setSelected={(val: any) => handleMumukshuFormChange(index, 'floorType', val)}
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
                  '/unified/booking',
                  null,
                  {
                    cardno: user.cardno,
                    primary_booking: {
                      booking_type: 'room',
                      details: {
                        checkin_date: selectedDay,
                        checkout_date: selectedDay,
                      },
                    },
                    addons: [],
                  },
                  onSuccess,
                  onFinally
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
                    const updatedGuests = res.guests.map((guest: any) => ({
                      cardno: guest.cardno,
                    }));

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
                            guestGroup: {
                              guests: updatedGuests,
                            },
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
                        mumukshuGroup: {
                          mumukshus: singleDayMumukshuForm.mumukshus.map((mumukshu) => ({
                            mobno: mumukshu.mobno,
                          })),
                        },
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

  // Group guests by roomType and floorType
  const groupedGuests = guests.reduce((acc: any, guest: any, index: any) => {
    const { roomType, floorType, cardno, name } = guest;

    // Find existing group with the same roomType and floorType
    const groupKey = `${roomType}_${floorType}`;
    if (!acc[groupKey]) {
      acc[groupKey] = {
        roomType,
        floorType,
        guests: [],
      };
    }

    // Add the guest to the appropriate group
    acc[groupKey].guests.push({ cardno, name });

    return acc;
  }, {});

  // Convert groupedGuests object into an array
  const guestGroup = Object.values(groupedGuests);

  // Return the final transformed object
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
