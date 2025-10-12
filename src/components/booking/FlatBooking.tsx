import { View, Text, Alert } from 'react-native';
import React, { useState } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { useAuthStore, useBookingStore } from '@/src/stores';
import { types } from '@/src/constants';
import { useTabBarPadding } from '@/src/hooks/useTabBarPadding';
import CustomCalender from '../CustomCalender';
import CustomChipGroup from '../CustomChipGroup';
import OtherMumukshuForm from '../OtherMumukshuForm';
import CustomButton from '../CustomButton';
import GuestForm from '../GuestForm';
import handleAPICall from '@/src/utils/HandleApiCall';
import moment from 'moment';

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
  const updateMumukshuBooking = useBookingStore((state) => state.updateMumukshuBooking);
  const updateGuestBooking = useBookingStore((state) => state.updateGuestBooking);
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

  function transformMumukshuData(inputData: any) {
    const { startDay, endDay, mumukshus } = inputData;

    return {
      startDay,
      endDay,
      mumukshuGroup: mumukshus.map((mumukshu: any) => mumukshu),
    };
  }

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

              // Transform and save flat booking data
              const flatData = transformMumukshuData(mumukshuForm);
              await updateMumukshuBooking('flat', flatData);
              router.push(`/mumukshuBooking/${types.FLAT_DETAILS_TYPE}`);
              setIsSubmitting(false);
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
                    return matchingApiGuest ? matchingApiGuest.cardno : (formGuest as any).cardno;
                  });

                  // Create the updated form object directly
                  const updatedGuestForm = {
                    ...guestForm,
                    guests: updatedGuests,
                  };

                  // Update the state
                  await new Promise((resolve) => {
                    setGuestForm(() => {
                      const newForm = updatedGuestForm;
                      resolve(newForm);
                      return newForm;
                    });
                  });

                  // Transform and save guest flat booking data
                  const transformedData = {
                    startDay: updatedGuestForm.startDay,
                    endDay: updatedGuestForm.endDay,
                    guestGroup: updatedGuestForm.guests,
                  };

                  await updateGuestBooking('flat', transformedData);
                  setGuestForm(INITIAL_GUEST_FORM);
                  router.push(`/guestBooking/${types.FLAT_DETAILS_TYPE}`);
                  setIsSubmitting(false);
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
      </KeyboardAwareScrollView>
    </View>
  );
};

export default FlatBooking;
