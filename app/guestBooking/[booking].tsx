import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { useGlobalContext } from '../../context/GlobalProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { icons, types } from '../../constants';
import { useRouter } from 'expo-router';
import CustomButton from '../../components/CustomButton';
import PageHeader from '../../components/PageHeader';
import GuestRoomBookingDetails from '../../components/booking details cards/GuestRoomBookingDetails';
import GuestAdhyayanBookingDetails from '../../components/booking details cards/GuestAdhyayanBookingDetails';
import GuestRoomAddon from '../../components/booking addons/GuestRoomAddon';
import GuestFoodAddon from '../../components/booking addons/GuestFoodAddon';
import GuestAdhyayanAddon from '../../components/booking addons/GuestAdhyayanAddon';
import Toast from 'react-native-toast-message';

const INITIAL_ROOM_FORM = {
  startDay: '',
  endDay: '',
  guestGroup: [{ roomType: '', floorType: '', guests: [], guestIndices: [] }],
};

const INITIAL_FOOD_FORM = {
  startDay: '',
  endDay: '',
  guestGroup: [{ meals: [], spicy: '', hightea: 'NONE', guests: [], guestIndices: [] }],
};

const INITIAL_ADHYAYAN_FORM = {
  adhyayan: {},
  guests: [],
  guestIndices: [],
};

const guestAddons = () => {
  const { booking } = useLocalSearchParams();
  const { guestData, setGuestData } = useGlobalContext();

  const guests =
    guestData.room?.guestGroup?.flatMap((group: any) => group.guests) ||
    guestData.adhyayan?.guestGroup;
  const guest_dropdown = guests.map((guest: any, index: any) => ({
    value: index,
    label: guest.name,
  }));

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [roomForm, setRoomForm] = useState(INITIAL_ROOM_FORM);
  const addRoomForm = () => {
    setRoomForm((prevRoomForm) => ({
      ...prevRoomForm,
      guestGroup: [
        ...prevRoomForm.guestGroup,
        { roomType: '', floorType: '', guests: [], guestIndices: [] },
      ],
    }));
  };

  const reomveRoomForm = (indexToRemove: any) => {
    return () => {
      setRoomForm((prevRoomForm) => {
        const updatedGuestGroup = [...prevRoomForm.guestGroup];
        updatedGuestGroup.splice(indexToRemove, 1);
        return {
          ...prevRoomForm,
          guestGroup: updatedGuestGroup,
        };
      });
    };
  };

  const updateRoomForm = (groupIndex: any, key: any, value: any) => {
    setRoomForm((prevRoomForm) => {
      const updatedGuestGroup: any = [...prevRoomForm.guestGroup];

      if (key === 'guests') {
        updatedGuestGroup[groupIndex].guestIndices = value;
        updatedGuestGroup[groupIndex].guests = guests.filter((_: any, i: any) => value.includes(i));
      } else {
        updatedGuestGroup[groupIndex][key] = value;
      }

      return {
        ...prevRoomForm,
        guestGroup: updatedGuestGroup,
      };
    });
  };

  const [foodForm, setFoodForm] = useState(INITIAL_FOOD_FORM);
  const resetFoodForm = () => {
    setFoodForm(INITIAL_FOOD_FORM);
    setGuestData((prev: any) => {
      const { food, ...rest } = prev;
      return rest;
    });
  };

  const addFoodForm = () => {
    setFoodForm((prevFoodForm) => ({
      ...prevFoodForm,
      guestGroup: [
        ...prevFoodForm.guestGroup,
        { meals: [], spicy: '', hightea: 'NONE', guests: [], guestIndices: [] },
      ],
    }));
  };

  const reomveFoodForm = (indexToRemove: any) => {
    return () => {
      setFoodForm((prevFoodForm) => {
        const updatedGuestGroup = [...prevFoodForm.guestGroup];
        updatedGuestGroup.splice(indexToRemove, 1);
        return {
          ...prevFoodForm,
          guestGroup: updatedGuestGroup,
        };
      });
    };
  };

  const updateFoodForm = (groupIndex: any, key: any, value: any) => {
    setFoodForm((prevFoodForm) => {
      const updatedGuestGroup: any = [...prevFoodForm.guestGroup];

      if (key === 'guests') {
        updatedGuestGroup[groupIndex].guestIndices = value;
        updatedGuestGroup[groupIndex].guests = guests.filter((_: any, i: any) => value.includes(i));
      } else {
        updatedGuestGroup[groupIndex][key] = value;
      }

      return {
        ...prevFoodForm,
        guestGroup: updatedGuestGroup,
      };
    });
  };

  const [adhyayanForm, setAdhyayanForm] = useState(INITIAL_ADHYAYAN_FORM);
  const updateAdhyayanForm = (field: any, value: any) => {
    setAdhyayanForm((prevAdhyayanForm) => ({
      ...prevAdhyayanForm,
      [field]: value,
      ...(field === 'guestIndices' && {
        guests: guests.filter((_: any, i: any) => value.includes(i)),
      }),
    }));
  };

  const [isDatePickerVisible, setDatePickerVisibility] = useState({
    checkin: false,
    checkout: false,
    foodStart: false,
    foodEnd: false,
    travel: false,
  });

  return (
    <SafeAreaView className="h-full bg-white" edges={['right', 'top', 'left']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}>
          <PageHeader title="Guest Booking Details" icon={icons.backArrow} />

          {booking === types.ROOM_DETAILS_TYPE && (
            <GuestRoomBookingDetails containerStyles={'mt-6'} />
          )}
          {booking === types.ADHYAYAN_DETAILS_TYPE && (
            <GuestAdhyayanBookingDetails containerStyles={'mt-6'} />
          )}

          <View className="w-full px-4">
            <Text className="mb-2 mt-4 font-psemibold text-xl text-secondary">Add Ons</Text>

            {/* GUEST ROOM BOOKING COMPONENT */}
            {booking !== types.ROOM_DETAILS_TYPE && (
              <GuestRoomAddon
                roomForm={roomForm}
                setRoomForm={setRoomForm}
                addRoomForm={addRoomForm}
                reomveRoomForm={reomveRoomForm}
                updateRoomForm={updateRoomForm}
                INITIAL_ROOM_FORM={INITIAL_ROOM_FORM}
                guest_dropdown={guest_dropdown}
                isDatePickerVisible={isDatePickerVisible}
                setDatePickerVisibility={setDatePickerVisibility}
              />
            )}

            {/* GUEST FOOD BOOKING COMPONENT */}
            <GuestFoodAddon
              foodForm={foodForm}
              setFoodForm={setFoodForm}
              addFoodForm={addFoodForm}
              resetFoodForm={resetFoodForm}
              reomveFoodForm={reomveFoodForm}
              updateFoodForm={updateFoodForm}
              guest_dropdown={guest_dropdown}
              isDatePickerVisible={isDatePickerVisible}
              setDatePickerVisibility={setDatePickerVisibility}
            />

            {/* GUEST ADHYAYAN BOOKING COMPONENT */}
            {booking !== types.ADHYAYAN_DETAILS_TYPE && (
              <GuestAdhyayanAddon
                adhyayanForm={adhyayanForm}
                setAdhyayanForm={setAdhyayanForm}
                updateAdhyayanForm={updateAdhyayanForm}
                INITIAL_ADHYAYAN_FORM={INITIAL_ADHYAYAN_FORM}
                guest_dropdown={guest_dropdown}
              />
            )}

            <CustomButton
              text="Confirm"
              handlePress={() => {
                setIsSubmitting(true);

                const isRoomFormEmpty = () => {
                  return roomForm.guestGroup.some(
                    (group) =>
                      group.roomType !== '' || group.floorType !== '' || group.guests.length > 0
                  );
                };

                const isFoodFormEmpty = () => {
                  return foodForm.guestGroup.some(
                    (group) =>
                      group.meals.length > 0 || group.spicy !== '' || group.guests.length > 0
                  );
                };

                const isAdhyayanFormEmpty = () => {
                  return (
                    Object.keys(adhyayanForm.adhyayan).length > 0 || adhyayanForm.guests.length > 0
                  );
                };

                // Validate and set Room Form data
                if (booking !== types.ROOM_DETAILS_TYPE && isRoomFormEmpty()) {
                  const hasEmptyFields = roomForm.guestGroup.some(
                    (group) => !group.roomType || !group.floorType || group.guests.length === 0
                  );

                  if (hasEmptyFields || !roomForm.startDay || !roomForm.endDay) {
                    Toast.show({
                      type: 'error',
                      text1: 'Please fill all the room booking fields',
                      text2: '',
                    });
                    setIsSubmitting(false);
                    return;
                  }
                  setGuestData((prev: any) => ({ ...prev, room: roomForm }));
                }

                // Validate and set Food Form data
                if (isFoodFormEmpty()) {
                  const hasEmptyFields = foodForm.guestGroup.some((group) => {
                    return (
                      group.meals.length === 0 || group.guests.length === 0 || group.spicy === ''
                    );
                  });

                  if (hasEmptyFields || !foodForm.startDay || !foodForm.endDay) {
                    Toast.show({
                      type: 'error',
                      text1: 'Please fill all the food booking fields',
                      text2: '',
                    });
                    setIsSubmitting(false);
                    return;
                  }
                  setGuestData((prev: any) => ({ ...prev, food: foodForm }));
                }

                // Validate and set Adhyayan Form data
                if (booking !== types.ADHYAYAN_DETAILS_TYPE && isAdhyayanFormEmpty()) {
                  if (
                    Object.keys(adhyayanForm.adhyayan).length === 0 ||
                    adhyayanForm.guests.length === 0
                  ) {
                    Toast.show({
                      type: 'error',
                      text1: 'Please fill all the adhyayan booking fields',
                      text2: '',
                    });
                    setIsSubmitting(false);
                    return;
                  }
                  setGuestData((prev: any) => ({ ...prev, adhyayan: adhyayanForm }));
                }

                setIsSubmitting(false);
                router.push('/guestBooking/guestBookingConfirmation');
              }}
              containerStyles="mb-8 min-h-[62px]"
              isLoading={isSubmitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default guestAddons;
