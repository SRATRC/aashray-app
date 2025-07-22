import { View, Text, Alert, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores';
import { colors } from '@/constants';
import CustomCalender from '../CustomCalender';
import CustomChipGroup from '../CustomChipGroup';
import OtherMumukshuForm from '../OtherMumukshuForm';
import CustomButton from '../CustomButton';
import GuestForm from '../GuestForm';
import handleAPICall from '@/utils/HandleApiCall';
import * as Haptics from 'expo-haptics';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-toast-message';
import moment from 'moment';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';

const CHIPS = ['Mumukshus', 'Guest'];
const INITIAL_MUMUKSHU_FORM = {
  startDay: '',
  endDay: '',
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
    },
  ],
};

const FlatBooking = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const tabBarPadding = useTabBarPadding();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedChip, setSelectedChip] = useState(CHIPS[0]);
  const handleChipClick = (chip: any) => {
    setSelectedChip(chip);
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
      return mumukshu.mobno && mumukshu.mobno?.length == 10 && mumukshu.cardno;
    });
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
    if (!guestForm.startDay) {
      return false;
    }

    return guestForm.guests.every((guest: any) => {
      if (guest.cardno) return guest.mobno && guest.mobno?.length == 10;
      else
        return guest.name && guest.gender && guest.type && guest.mobno && guest.mobno?.length == 10;
    });
  };

  const handleRazorpayPayment = (paymentData: any) => {
    if (paymentData.amount == 0) {
      Alert.alert('Success', 'Booking Successful');
      if (selectedChip === CHIPS[0]) {
        setMumukshuForm(INITIAL_MUMUKSHU_FORM);
      } else {
        setGuestForm(INITIAL_GUEST_FORM);
      }
      setIsSubmitting(false);
    } else {
      const options = {
        key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID,
        name: 'Vitraag Vigyaan Aashray',
        image: 'https://vitraagvigyaan.org/img/logo.png',
        description: 'Payment for Flat Booking',
        amount: paymentData.amount.toString(),
        currency: 'INR',
        order_id: paymentData.id.toString(),
        prefill: {
          email: user.email.toString(),
          contact: user.mobno.toString(),
          name: user.issuedto.toString(),
        },
        theme: { color: colors.orange },
      };

      RazorpayCheckout.open(options)
        .then((_rzrpayData: any) => {
          if (selectedChip === CHIPS[0]) {
            setMumukshuForm(INITIAL_MUMUKSHU_FORM);
          } else {
            setGuestForm(INITIAL_GUEST_FORM);
          }
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
        <CustomCalender
          type={'period'}
          startDay={mumukshuForm.startDay}
          setStartDay={(day: any) => {
            setGuestForm((prev) => ({ ...prev, startDay: day, endDay: '' }));
            setMumukshuForm((prev) => ({
              ...prev,
              startDay: day,
              endDay: '',
            }));
          }}
          endDay={mumukshuForm.endDay}
          setEndDay={(day: any) => {
            setGuestForm((prev) => ({ ...prev, endDay: day }));
            setMumukshuForm((prev) => ({ ...prev, endDay: day }));
          }}
          minDate={moment().format('YYYY-MM-DD')}
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
          <OtherMumukshuForm
            mumukshuForm={mumukshuForm}
            setMumukshuForm={setMumukshuForm}
            handleMumukshuFormChange={handleMumukshuFormChange}
            addMumukshuForm={addMumukshuForm}
            removeMumukshuForm={removeMumukshuForm}
          />
        )}

        {selectedChip === CHIPS[1] && (
          <GuestForm
            guestForm={guestForm}
            setGuestForm={setGuestForm}
            handleGuestFormChange={handleGuestFormChange}
            addGuestForm={addGuestForm}
            removeGuestForm={removeGuestForm}
          />
        )}

        <CustomButton
          text="Book Now"
          handlePress={async () => {
            setIsSubmitting(true);
            if (selectedChip == CHIPS[0]) {
              if (!isMumukshuFormValid()) {
                Alert.alert('Validation Error', 'Please fill all required fields');
                setIsSubmitting(false);
                return;
              }
              await handleAPICall(
                'POST',
                '/stay/flat',
                { cardno: user.cardno },
                mumukshuForm,
                async (res: any) => {
                  // Check if response contains payment data
                  if (res.data && (res.data.amount !== undefined || res.data.id !== undefined)) {
                    handleRazorpayPayment(res.data);
                  } else {
                    // No payment data - just show success
                    Alert.alert('Success', 'Booking Successful');
                    setMumukshuForm(INITIAL_MUMUKSHU_FORM);
                    setIsSubmitting(false);
                  }
                },
                () => {
                  setIsSubmitting(false);
                }
              );
            }

            if (selectedChip == CHIPS[1]) {
              if (!isGuestFormValid()) {
                Alert.alert('Validation Error', 'Please fill all required fields');
                setIsSubmitting(false);
                return;
              }

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
                    return matchingApiGuest ? matchingApiGuest.cardno : formGuest.cardno;
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
                  await handleAPICall(
                    'POST',
                    '/guest/flat',
                    { cardno: user.cardno },
                    updatedGuestForm,
                    async (res: any) => {
                      // Check if response contains payment data
                      if (
                        res.data &&
                        (res.data.amount !== undefined || res.data.id !== undefined)
                      ) {
                        handleRazorpayPayment(res.data);
                      } else {
                        // No payment data - just show success
                        Alert.alert('Success', 'Booking Successful');
                        setGuestForm(INITIAL_GUEST_FORM);
                        setIsSubmitting(false);
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
            }
          }}
          containerStyles="mt-7 min-h-[62px]"
          isLoading={isSubmitting}
          isDisabled={
            selectedChip === CHIPS[0]
              ? !isMumukshuFormValid()
              : selectedChip === CHIPS[1]
                ? !isGuestFormValid()
                : false
          }
        />
      </ScrollView>
    </View>
  );
};

export default FlatBooking;
