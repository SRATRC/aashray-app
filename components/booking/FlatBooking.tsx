import { View, Text, Alert } from 'react-native';
import React, { useState } from 'react';
import CustomCalender from '../CustomCalender';
import CustomChipGroup from '../CustomChipGroup';
import OtherMumukshuForm from '../OtherMumukshuForm';
import CustomButton from '../CustomButton';
import GuestForm from '../GuestForm';
import handleAPICall from '../../utils/HandleApiCall';
import { useGlobalContext } from '../../context/GlobalProvider';

const CHIPS = ['Mumukshus', 'Guest'];
const INITIAL_MUMUKSHU_FORM = {
  startDay: '',
  endDay: '',
  mumukshus: [
    {
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
  const { user } = useGlobalContext();
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
      return mumukshu.mobno && mumukshu.mobno?.length == 10;
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
      if (guest.id) return guest.mobno && guest.mobno?.length == 10;
      else
        return guest.name && guest.gender && guest.type && guest.mobno && guest.mobno?.length == 10;
    });
  };

  return (
    <View className="w-full flex-1">
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
        isLoading={isSubmitting}
        handlePress={async () => {
          setIsSubmitting(true);
          if (selectedChip == CHIPS[0]) {
            if (!isMumukshuFormValid()) {
              Alert.alert('Validation Error', 'Please fill all required fields');
              return;
            }
            await handleAPICall(
              'POST',
              '/stay/flat',
              { cardno: user.cardno },
              mumukshuForm,
              async (_res: any) => {
                Alert.alert('Success', 'Booking Successful');
                setMumukshuForm(INITIAL_MUMUKSHU_FORM);
                setIsSubmitting(false);
              },
              () => {
                setIsSubmitting(false);
              }
            );
          }

          if (selectedChip == CHIPS[1]) {
            if (!isGuestFormValid()) {
              Alert.alert('Validation Error', 'Please fill all required fields');
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
                    (apiGuest: any) => apiGuest.name === formGuest.name
                  );
                  return matchingApiGuest ? { ...formGuest, id: matchingApiGuest.id } : formGuest;
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

                await handleAPICall(
                  'POST',
                  '/guest/flat',
                  { cardno: user.cardno },
                  guestForm,
                  async (_res: any) => {
                    Alert.alert('Success', 'Booking Successful');
                    setGuestForm(INITIAL_GUEST_FORM);
                    setIsSubmitting(false);
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
      />
    </View>
  );
};

export default FlatBooking;
