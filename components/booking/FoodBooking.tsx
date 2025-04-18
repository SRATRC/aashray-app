import { View, Alert, Text } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useGlobalContext } from '../../context/GlobalProvider';
import { colors, dropdowns, status } from '../../constants';
import CustomDropdown from '../CustomDropdown';
import CustomButton from '../CustomButton';
import CustomCalender from '../CustomCalender';
import handleAPICall from '../../utils/HandleApiCall';
import CustomMultiSelectDropdown from '../CustomMultiSelectDropdown';
import CustomChipGroup from '../CustomChipGroup';
import CustomModal from '../CustomModal';
import GuestForm from '../GuestForm';
import OtherMumukshuForm from '../OtherMumukshuForm';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import moment from 'moment';

let CHIPS = ['Self', 'Guest', 'Mumukshus'];

const FoodBooking = () => {
  const { user } = useGlobalContext();
  const router: any = useRouter();

  if (user.res_status == status.STATUS_GUEST) {
    CHIPS = ['Self'];
  }

  const [foodForm, setFoodForm] = useState({
    startDay: '',
    endDay: '',
    spicy: 1,
    hightea: 'NONE',
  });

  const [guestForm, setGuestForm] = useState({
    startDay: '',
    endDay: '',
    guests: [
      {
        name: '',
        gender: '',
        mobno: '',
        type: '',
        meals: [],
        spicy: 1,
        hightea: 'NONE',
      },
    ],
  });

  const [type, setType] = useState<any>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const [selectedChip, setSelectedChip] = useState('Self');
  const handleChipClick = (chip: any) => {
    setSelectedChip(chip);
  };

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
          meals: [],
          spicy: 1,
          hightea: 'NONE',
        },
      ],
    }));
  };

  const handleGuestFormChange = (index: any, field: any, value: any) => {
    const updatedForms = guestForm.guests.map((guest, i) =>
      i === index
        ? {
            ...guest,
            [field]: value,
            ...(field === 'name' && { cardno: undefined }),
          }
        : guest
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
    if (!guestForm.endDay) guestForm.endDay = guestForm.startDay;

    return (
      guestForm.startDay &&
      guestForm.guests.every((guest: any) => {
        const baseValidation = guest.meals.length > 0 && guest.spicy !== null && guest.hightea;

        const identityValidation = guest.cardno
          ? guest.mobno && guest.mobno?.length == 10
          : guest.mobno && guest.mobno?.length == 10 && guest.name && guest.gender && guest.type;

        return baseValidation && identityValidation;
      })
    );
  };

  const [mumukshuForm, setMumukshuForm] = useState({
    startDay: '',
    endDay: '',
    mumukshus: [
      {
        cardno: '',
        mobno: '',
        meals: [],
        spicy: 1,
        hightea: 'NONE',
      },
    ],
  });

  const addMumukshuForm = () => {
    setMumukshuForm((prev) => ({
      ...prev,
      mumukshus: [
        ...prev.mumukshus,
        {
          cardno: '',
          mobno: '',
          meals: [],
          spicy: 1,
          hightea: 'NONE',
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
    if (!mumukshuForm.startDay) {
      return false;
    }

    return mumukshuForm.mumukshus.every((mumukshu) => {
      return (
        mumukshu.mobno &&
        mumukshu.mobno?.length == 10 &&
        mumukshu.cardno &&
        mumukshu.meals &&
        mumukshu.spicy !== null &&
        mumukshu.hightea
      );
    });
  };

  return (
    <View className="flex-1 items-center justify-center">
      <CustomCalender
        type={'period'}
        startDay={foodForm.startDay}
        setStartDay={(day: any) => {
          setFoodForm((prev) => ({ ...prev, startDay: day, endDay: '' }));
          setGuestForm((prev) => ({ ...prev, startDay: day, endDay: '' }));
          setMumukshuForm((prev) => ({ ...prev, startDay: day, endDay: '' }));
        }}
        endDay={foodForm.endDay}
        setEndDay={(day: any) => {
          setFoodForm((prev) => ({ ...prev, endDay: day }));
          setGuestForm((prev) => ({ ...prev, endDay: day }));
          setMumukshuForm((prev) => ({ ...prev, endDay: day }));
        }}
        minDate={
          moment().hour() < 11
            ? moment(new Date()).add(1, 'days').format('YYYY-MM-DD')
            : moment(new Date()).add(2, 'days').format('YYYY-MM-DD')
        }
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
        <View className="flex w-full flex-col">
          <CustomMultiSelectDropdown
            otherStyles="mt-5 w-full px-1"
            text={'Food Type'}
            placeholder={'Select Food Type'}
            data={dropdowns.FOOD_TYPE_LIST}
            setSelected={(val: any) => setType(val)}
          />

          <CustomDropdown
            otherStyles="mt-5 w-full px-1"
            text={'Spice Level'}
            placeholder={'How much spice do you want?'}
            data={dropdowns.SPICE_LIST}
            setSelected={(val: any) => setFoodForm({ ...foodForm, spicy: val })}
          />

          <CustomDropdown
            otherStyles="mt-5 w-full px-1"
            text={'Hightea'}
            placeholder={'Hightea'}
            data={dropdowns.HIGHTEA_LIST}
            defaultOption={{ key: 'NONE', value: 'None' }}
            setSelected={(val: any) => setFoodForm({ ...foodForm, hightea: val })}
          />

          <CustomButton
            text="Book Now"
            handlePress={async () => {
              if (
                !foodForm.startDay ||
                type.length == 0 ||
                foodForm.spicy == null ||
                !foodForm.hightea
              ) {
                Alert.alert('Please fill all fields');
                return;
              }
              setIsSubmitting(true);

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
                    booking_type: 'food',
                    details: {
                      start_date: foodForm.startDay,
                      end_date: foodForm.endDay ? foodForm.endDay : foodForm.startDay,
                      breakfast: type.includes('breakfast') ? 1 : 0,
                      lunch: type.includes('lunch') ? 1 : 0,
                      dinner: type.includes('dinner') ? 1 : 0,
                      spicy: foodForm.spicy,
                      high_tea: foodForm.hightea,
                    },
                  },
                },
                onSuccess,
                onFinally
              );
            }}
            containerStyles="mt-7 w-full px-1 min-h-[62px]"
            isLoading={isSubmitting}
          />
        </View>
      )}

      {selectedChip == CHIPS[1] && (
        <View className="flex w-full flex-col">
          <GuestForm
            guestForm={guestForm}
            setGuestForm={setGuestForm}
            handleGuestFormChange={handleGuestFormChange}
            addGuestForm={addGuestForm}
            removeGuestForm={removeGuestForm}>
            {(index: any) => (
              <>
                <CustomMultiSelectDropdown
                  otherStyles="mt-5"
                  text={`Select Meals`}
                  placeholder="Select Meals"
                  data={dropdowns.GUEST_FOOD_TYPE_LIST}
                  value={guestForm.guests[index].meals}
                  setSelected={(val: any) => handleGuestFormChange(index, 'meals', val)}
                  guest={true}
                />

                <CustomDropdown
                  otherStyles="mt-5 w-full px-1"
                  text={'Spice Level'}
                  placeholder={'How much spice do you want?'}
                  data={dropdowns.SPICE_LIST}
                  setSelected={(val: any) => handleGuestFormChange(index, 'spicy', val)}
                  value={guestForm.guests[index].spicy}
                  defaultOption={dropdowns.SPICE_LIST[0]}
                />

                <CustomDropdown
                  otherStyles="mt-5 w-full px-1"
                  text={'Hightea'}
                  placeholder={'Hightea'}
                  data={dropdowns.HIGHTEA_LIST}
                  defaultOption={{ key: 'NONE', value: 'None' }}
                  setSelected={(val: any) => handleGuestFormChange(index, 'hightea', val)}
                  value={guestForm.guests[index].hightea}
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
              }

              const guests = guestForm.guests.map((guest: any) => ({
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
                  const updatedGuests = guestForm.guests.map((formGuest) => {
                    const matchingApiGuest = res.guests.find(
                      (apiGuest: any) => apiGuest.name === formGuest.name
                    );
                    return matchingApiGuest
                      ? { ...formGuest, cardno: matchingApiGuest.cardno }
                      : formGuest;
                  });

                  const transformedData = transformGuestData({
                    ...guestForm,
                    guests: updatedGuests,
                  });

                  await handleAPICall(
                    'POST',
                    '/guest/booking',
                    null,
                    {
                      cardno: user.cardno,
                      primary_booking: {
                        booking_type: 'food',
                        details: transformedData,
                      },
                    },
                    (data: any) => {
                      if (data.data.amount == 0 || user.country != 'India') {
                        Toast.show({
                          type: 'success',
                          text1: 'Food Booking Successful 🎉',
                        });
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      } else {
                        router.replace('/bookingConfirmation');
                        // var options = {
                        //   key: `${process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID}`,
                        //   name: 'Vitraag Vigyaan',
                        //   image: 'https://vitraagvigyaan.org/img/logo.png',
                        //   description: 'Payment for Vitraag Vigyaan',
                        //   amount: `${data.data.amount}`,
                        //   currency: 'INR',
                        //   order_id: `${data.data.id}`,
                        //   prefill: {
                        //     email: `${user.email}`,
                        //     contact: `${user.mobno}`,
                        //     name: `${user.issuedto}`,
                        //   },
                        //   theme: { color: colors.orange },
                        // };
                        // RazorpayCheckout.open(options)
                        //   .then((rzrpayData: any) => {
                        //     // handle success
                        //     setIsSubmitting(false);
                        //     console.log(JSON.stringify(rzrpayData));
                        //     router.replace('/paymentConfirmation');
                        //   })
                        //   .catch((error: any) => {
                        //     // handle failure
                        //     setIsSubmitting(false);
                        //     Toast.show({
                        //       type: 'error',
                        //       text1: 'An error occurred!',
                        //       text2: error.reason,
                        //       swipeable: false,
                        //     });
                        //     console.log(JSON.stringify(error));
                        //   });
                      }
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
            }}
            containerStyles="mt-7 w-full px-1 min-h-[62px]"
            isLoading={isSubmitting}
            isDisabled={!isGuestFormValid()}
          />
        </View>
      )}

      {selectedChip == CHIPS[2] && (
        <View className="flex w-full flex-col">
          <OtherMumukshuForm
            mumukshuForm={mumukshuForm}
            setMumukshuForm={setMumukshuForm}
            handleMumukshuFormChange={handleMumukshuFormChange}
            addMumukshuForm={addMumukshuForm}
            removeMumukshuForm={removeMumukshuForm}>
            {(index: any) => (
              <>
                <CustomMultiSelectDropdown
                  otherStyles="mt-5"
                  text={`Select Meals`}
                  placeholder="Select Meals"
                  data={dropdowns.GUEST_FOOD_TYPE_LIST}
                  value={mumukshuForm.mumukshus[index].meals}
                  setSelected={(val: any) => handleMumukshuFormChange(index, 'meals', val)}
                  guest={true}
                />

                <CustomDropdown
                  otherStyles="mt-5 w-full px-1"
                  text={'Spice Level'}
                  placeholder={'How much spice do you want?'}
                  data={dropdowns.SPICE_LIST}
                  setSelected={(val: any) => handleMumukshuFormChange(index, 'spicy', val)}
                  value={mumukshuForm.mumukshus[index].spicy}
                />

                <CustomDropdown
                  otherStyles="mt-5 w-full px-1"
                  text={'Hightea'}
                  placeholder={'Hightea'}
                  data={dropdowns.HIGHTEA_LIST}
                  defaultOption={{ key: 'NONE', value: 'None' }}
                  setSelected={(val: any) => handleMumukshuFormChange(index, 'hightea', val)}
                  value={mumukshuForm.mumukshus[index].hightea}
                />
              </>
            )}
          </OtherMumukshuForm>
          <CustomButton
            text="Book Now"
            handlePress={async () => {
              setIsSubmitting(true);
              if (!isMumukshuFormValid()) {
                setIsSubmitting(false);
                setModalMessage('Please fill all fields');
                setModalVisible(true);
                return;
              }

              const transformedData = transformMumukshuData(
                JSON.parse(JSON.stringify(mumukshuForm))
              );

              await handleAPICall(
                'POST',
                '/mumukshu/booking',
                null,
                {
                  cardno: user.cardno,
                  primary_booking: {
                    booking_type: 'food',
                    details: transformedData,
                  },
                },
                (_data: any) => {
                  Alert.alert('Booking Successful');
                },
                () => {
                  setIsSubmitting(false);
                }
              );
            }}
            containerStyles="mt-7 w-full px-1 min-h-[62px]"
            isLoading={isSubmitting}
            isDisabled={!isMumukshuFormValid()}
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

function transformGuestData(inputData: any) {
  const { startDay, endDay, guests } = inputData;

  // Group guests by shared attributes
  const groupedGuests = guests.reduce((acc: any, guest: any) => {
    const key = JSON.stringify({
      meals: guest.meals,
      spicy: guest.spicy,
      hightea: guest.hightea,
    });

    if (!acc[key]) {
      acc[key] = {
        guests: [],
        meals: guest.meals,
        spicy: guest.spicy,
        high_tea: guest.hightea,
      };
    }

    acc[key].guests.push(guest.cardno);

    return acc;
  }, {});

  // Transform grouped data into an array
  const guestGroup = Object.values(groupedGuests);

  return {
    start_date: startDay,
    end_date: endDay,
    guestGroup,
  };
}

function transformMumukshuData(inputData: any) {
  const { startDay, endDay, mumukshus } = inputData;

  // Group mumukshus by shared attributes
  const groupedMumukshus = mumukshus.reduce((acc: any, mumukshu: any) => {
    const key = JSON.stringify({
      meals: mumukshu.meals,
      spicy: mumukshu.spicy,
      hightea: mumukshu.hightea,
    });

    if (!acc[key]) {
      acc[key] = {
        mumukshus: [],
        meals: mumukshu.meals,
        spicy: mumukshu.spicy,
        high_tea: mumukshu.hightea,
      };
    }

    acc[key].mumukshus.push(mumukshu.cardno);

    return acc;
  }, {});

  // Transform grouped data into an array
  const mumukshuGroup = Object.values(groupedMumukshus);

  return {
    start_date: startDay,
    end_date: endDay,
    mumukshuGroup,
  };
}

export default FoodBooking;
