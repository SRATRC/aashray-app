import React, { useState } from 'react';
import { View, Alert, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useAuthStore } from '@/src/stores';
import { colors, dropdowns, status } from '@/src/constants';
import { FontAwesome } from '@expo/vector-icons';
import { prepareMumukshuRequestBody } from '@/src/utils/preparingRequestBody';
import { useTabBarPadding } from '@/src/hooks/useTabBarPadding';
import handleAPICall from '@/src/utils/HandleApiCall';
import CustomButton from '../CustomButton';
import CustomCalender from '../CustomCalender';
import CustomChipGroup from '../CustomChipGroup';
import CustomModal from '../CustomModal';
import GuestForm from '../GuestForm';
import OtherMumukshuForm from '../OtherMumukshuForm';
import CustomSelectBottomSheet from '../CustomSelectBottomSheet';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-toast-message';
import moment from 'moment';
import * as Haptics from 'expo-haptics';
import CustomAlert from '../CustomAlert';
import Callout from '../Callout';

let CHIPS = ['Self', 'Guest', 'Mumukshus'];

const FoodBooking = () => {
  const { user } = useAuthStore();
  const router: any = useRouter();
  const tabBarPadding = useTabBarPadding();

  if (user.res_status == status.STATUS_GUEST) {
    CHIPS = ['Self'];
  }

  const [foodForm, setFoodForm] = useState({
    startDay: '',
    endDay: '',
    meals: ['breakfast', 'lunch', 'dinner'],
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
        meals: ['breakfast', 'lunch', 'dinner'],
        spicy: 1,
        hightea: 'NONE',
      },
    ],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const BookingNote = () => (
    // <View className="mb-2 flex-row items-start gap-x-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
    //   <FontAwesome name="info-circle" size={16} color="#b45309" style={{ alignSelf: 'center' }} />
    //   <Text className="flex-1 font-pregular text-sm text-amber-800">

    //   </Text>
    // </View>

    <Callout
      variant="warning"
      message="Bookings must be made before 11 AM of the previous day for upcoming meals."
    />
  );

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
          meals: ['breakfast', 'lunch', 'dinner'],
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
        meals: ['breakfast', 'lunch', 'dinner'],
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
          meals: ['breakfast', 'lunch', 'dinner'],
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
        <BookingNote />
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
            <CustomSelectBottomSheet
              className="mt-5 w-full px-1"
              label="Food Type"
              placeholder="Select Meals"
              options={dropdowns.FOOD_TYPE_LIST}
              selectedValues={foodForm.meals}
              onValuesChange={(val) => setFoodForm({ ...foodForm, meals: val as string[] })}
              multiSelect={true}
              confirmButtonText="Select"
              maxSelectedDisplay={3}
            />

            <CustomSelectBottomSheet
              className="mt-5 w-full px-1"
              label="Spice Level"
              placeholder="How much spice do you want?"
              options={dropdowns.SPICE_LIST}
              selectedValue={foodForm.spicy}
              onValueChange={(val: any) => setFoodForm({ ...foodForm, spicy: val })}
            />

            <CustomSelectBottomSheet
              className="mt-5 w-full px-1"
              label="Hightea"
              placeholder="Hightea"
              options={dropdowns.HIGHTEA_LIST}
              selectedValue={foodForm.hightea}
              onValueChange={(val: any) => setFoodForm({ ...foodForm, hightea: val })}
            />

            <CustomButton
              text="Book Now"
              handlePress={async () => {
                setIsSubmitting(true);
                if (
                  !foodForm.startDay ||
                  foodForm.meals.length == 0 ||
                  foodForm.spicy == null ||
                  !foodForm.hightea
                ) {
                  setIsSubmitting(false);
                  setModalMessage('Please fill all fields');
                  setModalVisible(true);
                }

                const onSuccess = (_data: any) => {
                  CustomAlert.alert('Booking Successful');
                };

                const onError = (errorDetails: any) => {
                  setIsSubmitting(false);
                  setModalMessage(errorDetails.message);
                  setModalVisible(true);
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
                      booking_type: 'food',
                      details: {
                        start_date: foodForm.startDay,
                        end_date: foodForm.endDay ? foodForm.endDay : foodForm.startDay,
                        mumukshuGroup: [
                          {
                            mumukshus: [user.cardno],
                            meals: foodForm.meals,
                            spicy: foodForm.spicy,
                            high_tea: foodForm.hightea,
                          },
                        ],
                      },
                    },
                  },
                  onSuccess,
                  onFinally,
                  onError
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
                  <CustomSelectBottomSheet
                    className="mt-5 w-full px-1"
                    label="Food Type"
                    placeholder="Select Meals"
                    options={dropdowns.FOOD_TYPE_LIST}
                    selectedValues={guestForm.guests[index].meals}
                    onValuesChange={(val) => handleGuestFormChange(index, 'meals', val)}
                    multiSelect={true}
                    confirmButtonText="Select"
                    maxSelectedDisplay={3}
                  />

                  <CustomSelectBottomSheet
                    className="mt-5 w-full px-1"
                    label="Spice Level"
                    placeholder="How much spice do you want?"
                    options={dropdowns.SPICE_LIST}
                    selectedValue={guestForm.guests[index].spicy}
                    onValueChange={(val: any) => handleGuestFormChange(index, 'spicy', val)}
                  />

                  <CustomSelectBottomSheet
                    className="mt-5 w-full px-1"
                    label="Hightea"
                    placeholder="Hightea"
                    options={dropdowns.HIGHTEA_LIST}
                    selectedValue={guestForm.guests[index].hightea}
                    onValueChange={(val: any) => handleGuestFormChange(index, 'hightea', val)}
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
                        if (data.data.amount == 0) {
                          router.replace('/bookingConfirmation');
                        } else {
                          var options = {
                            key: `${process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID}`,
                            name: 'Vitraag Vigyaan',
                            image: 'https://vitraagvigyaan.org/img/logo.png',
                            description: 'Payment for Vitraag Vigyaan',
                            amount: `${data.data.amount}`,
                            currency: 'INR',
                            order_id: `${data.data.id}`,
                            prefill: {
                              email: `${user.email}`,
                              contact: `${user.mobno}`,
                              name: `${user.issuedto}`,
                            },
                            theme: { color: colors.orange },
                          };
                          RazorpayCheckout.open(options)
                            .then((_rzrpayData: any) => {
                              setIsSubmitting(false);
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                              Toast.show({
                                type: 'success',
                                text1: 'Payment successful',
                                swipeable: false,
                              });
                              router.replace('/paymentConfirmation');
                            })
                            .catch((_error: any) => {
                              setIsSubmitting(false);
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                              router.replace('/paymentFailed');
                            });
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
                  <CustomSelectBottomSheet
                    className="mt-5 w-full px-1"
                    label="Food Type"
                    placeholder="Select Meals"
                    options={dropdowns.FOOD_TYPE_LIST}
                    selectedValues={mumukshuForm.mumukshus[index].meals}
                    onValuesChange={(val) => handleMumukshuFormChange(index, 'meals', val)}
                    multiSelect={true}
                    confirmButtonText="Select"
                    maxSelectedDisplay={3}
                  />

                  <CustomSelectBottomSheet
                    className="mt-5 w-full px-1"
                    label="Spice Level"
                    placeholder="How much spice do you want?"
                    options={dropdowns.SPICE_LIST}
                    selectedValue={mumukshuForm.mumukshus[index].spicy}
                    onValueChange={(val: any) => handleMumukshuFormChange(index, 'spicy', val)}
                  />

                  <CustomSelectBottomSheet
                    className="mt-5 w-full px-1"
                    label="Hightea"
                    placeholder="Hightea"
                    options={dropdowns.HIGHTEA_LIST}
                    selectedValue={mumukshuForm.mumukshus[index].hightea}
                    onValueChange={(val: any) => handleMumukshuFormChange(index, 'hightea', val)}
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

                const transformedMumukshuData = {
                  primary: 'food',
                  food: {
                    startDay: mumukshuForm.startDay,
                    endDay: mumukshuForm.endDay || mumukshuForm.startDay,
                    mumukshuGroup: transformMumukshuFormToGroups(mumukshuForm.mumukshus),
                  },
                };

                const requestBody = prepareMumukshuRequestBody(user, transformedMumukshuData);

                await handleAPICall(
                  'POST',
                  '/mumukshu/booking',
                  null,
                  requestBody,
                  (_data: any) => {
                    CustomAlert.alert('Booking Successful');
                  },
                  () => {
                    setIsSubmitting(false);
                  },
                  (errorDetails: any) => {
                    setIsSubmitting(false);
                    setModalMessage(errorDetails.message);
                    setModalVisible(true);
                  }
                );
              }}
              containerStyles="mt-7 w-full px-1 min-h-[62px]"
              isLoading={isSubmitting}
              isDisabled={!isMumukshuFormValid()}
            />
          </View>
        )}
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

const transformMumukshuFormToGroups = (mumukshus: any[]) => {
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
        hightea: mumukshu.hightea,
      };
    }

    acc[key].mumukshus.push({ cardno: mumukshu.cardno });
    return acc;
  }, {});

  return Object.values(groupedMumukshus);
};

export default FoodBooking;
