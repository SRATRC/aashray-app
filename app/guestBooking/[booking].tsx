import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useGlobalContext } from '../../context/GlobalProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dropdowns, types } from '../../constants';
import { useQuery } from '@tanstack/react-query';
import { prepareGuestRequestBody } from '~/utils/preparingRequestBody';
import CustomButton from '../../components/CustomButton';
import PageHeader from '../../components/PageHeader';
import GuestRoomBookingDetails from '../../components/booking details cards/GuestRoomBookingDetails';
import GuestAdhyayanBookingDetails from '../../components/booking details cards/GuestAdhyayanBookingDetails';
import GuestRoomAddon from '../../components/booking addons/GuestRoomAddon';
import GuestFoodAddon from '../../components/booking addons/GuestFoodAddon';
import GuestAdhyayanAddon from '../../components/booking addons/GuestAdhyayanAddon';
import handleAPICall from '~/utils/HandleApiCall';
import CustomModal from '~/components/CustomModal';
import GuestEventBookingDetails from '~/components/booking details cards/GuestEventBookingDetails';

// Define initial form structures
const createInitialRoomForm = (existingData: any = null) => ({
  startDay: existingData?.startDay || '',
  endDay: existingData?.endDay || '',
  guestGroup: existingData?.guestGroup || [
    {
      roomType: dropdowns.ROOM_TYPE_LIST[0].key,
      floorType: dropdowns.FLOOR_TYPE_LIST[0].key,
      guests: [],
      guestIndices: [],
    },
  ],
});

const createInitialFoodForm = (existingData: any = null) => ({
  startDay: existingData?.startDay || '',
  endDay: existingData?.endDay || '',
  guestGroup: existingData?.guestGroup || [
    {
      meals: ['breakfast', 'lunch', 'dinner'],
      spicy: dropdowns.SPICE_LIST[0].key,
      hightea: dropdowns.HIGHTEA_LIST[0].key,
      guests: [],
      guestIndices: [],
    },
  ],
});

const createInitialAdhyayanForm = (existingData: any = null) => ({
  adhyayan: existingData?.adhyayan || {},
  guests: existingData?.guests || [],
  guestIndices: existingData?.guestIndices || [],
});

const GuestAddons = () => {
  const { booking } = useLocalSearchParams();
  const { user, guestData, setGuestData } = useGlobalContext();
  const router = useRouter();

  console.log(JSON.stringify(guestData));

  const [addonOpen, setAddonOpen] = useState({
    room: false,
    food: false,
  });

  // Get all guests from existing data
  const guests = useMemo(() => {
    return (
      guestData.room?.guestGroup?.flatMap((group: any) => group.guests) ||
      guestData.adhyayan?.guestGroup ||
      guestData.utsav?.guests ||
      []
    );
  }, [guestData.room, guestData.adhyayan]);

  // Create dropdown options for guests
  const guest_dropdown = useMemo(() => {
    return guests.map((guest: any, index: any) => ({
      key: index,
      value: guest.issuedto,
    }));
  }, [guests]);

  // Get initial dates based on existing data
  const getInitialDates = useMemo(() => {
    // Find the first available date from any existing booking
    const startDate =
      guestData.room?.startDay ||
      guestData.food?.startDay ||
      guestData.adhyayan?.adhyayan?.start_date ||
      '';

    const endDate =
      guestData.room?.endDay ||
      guestData.food?.endDay ||
      guestData.adhyayan?.adhyayan?.end_date ||
      '';

    return { startDate, endDate };
  }, [guestData]);

  // Create initial forms with dates prefilled from any available source
  const createInitialForms = useCallback(() => {
    // Create room form with dates from any existing booking
    const roomFormInitial = {
      ...createInitialRoomForm(guestData.room),
      startDay: guestData.room?.startDay || getInitialDates.startDate,
      endDay: guestData.room?.endDay || getInitialDates.endDate,
    };

    // Create food form with dates from any existing booking
    const foodFormInitial = {
      ...createInitialFoodForm(guestData.food),
      startDay: guestData.food?.startDay || getInitialDates.startDate,
      endDay: guestData.food?.endDay || getInitialDates.endDate,
    };

    // Create adhyayan form
    const adhyayanFormInitial = createInitialAdhyayanForm(guestData.adhyayan);

    return { roomFormInitial, foodFormInitial, adhyayanFormInitial };
  }, [guestData, getInitialDates]);

  // Initialize forms with existing data if available
  const initialForms = useMemo(() => createInitialForms(), [createInitialForms]);

  const [roomForm, setRoomForm] = useState(initialForms.roomFormInitial);
  const [foodForm, setFoodForm] = useState(initialForms.foodFormInitial);
  const [adhyayanForm, setAdhyayanForm] = useState(initialForms.adhyayanFormInitial);

  // Update forms when guestData changes (for prefilling)
  useEffect(() => {
    // Get latest dates from any booking type
    const startDate =
      guestData.room?.startDay ||
      guestData.food?.startDay ||
      guestData.adhyayan?.adhyayan?.start_date ||
      '';

    const endDate =
      guestData.room?.endDay ||
      guestData.food?.endDay ||
      guestData.adhyayan?.adhyayan?.end_date ||
      '';

    // Update room form with cross-referenced dates
    if (guestData.room) {
      setRoomForm((prev) => ({
        ...createInitialRoomForm(guestData.room),
        startDay: guestData.room.startDay || startDate,
        endDay: guestData.room.endDay || endDate,
      }));
    } else if (startDate || endDate) {
      // If room data doesn't exist but we have dates from other bookings
      setRoomForm((prev) => ({
        ...prev,
        startDay: prev.startDay || startDate,
        endDay: prev.endDay || endDate,
      }));
    }

    // Update food form with cross-referenced dates
    if (guestData.food) {
      setFoodForm((prev) => ({
        ...createInitialFoodForm(guestData.food),
        startDay: guestData.food.startDay || startDate,
        endDay: guestData.food.endDay || endDate,
      }));
    } else if (startDate || endDate) {
      // If food data doesn't exist but we have dates from other bookings
      setFoodForm((prev) => ({
        ...prev,
        startDay: prev.startDay || startDate,
        endDay: prev.endDay || endDate,
      }));
    }

    // Update adhyayan form
    if (guestData.adhyayan) {
      setAdhyayanForm(createInitialAdhyayanForm(guestData.adhyayan));
    }
  }, [guestData]);

  const toggleAddon = useCallback((addonType: any, isOpen: any) => {
    setAddonOpen((prev) => ({ ...prev, [addonType]: isOpen }));
  }, []);

  // Date picker state
  const [isDatePickerVisible, setDatePickerVisibility] = useState({
    checkin: false,
    checkout: false,
    foodStart: false,
    foodEnd: false,
    travel: false,
  });

  const toggleDatePicker = useCallback((pickerType: string, isVisible: boolean) => {
    setDatePickerVisibility((prev) => ({ ...prev, [pickerType]: isVisible }));
  }, []);

  // Prepare API payload
  const transformedData = useMemo(() => {
    return prepareGuestRequestBody(user, guestData);
  }, [user, guestData]);

  // Validation API call
  const fetchValidation = useCallback(async () => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'POST',
        '/guest/validate',
        null,
        transformedData,
        (res: any) => {
          setGuestData((prev: any) => ({ ...prev, validationData: res.data }));
          resolve(res.data);
        },
        () => {},
        (errorDetails) => reject(new Error(errorDetails.message))
      );
    });
  }, [transformedData, setGuestData]);

  const {
    isLoading: isValidationDataLoading,
    isError: isValidationDataError,
    error: validationDataError,
    data: validationData,
    refetch: refetchValidation,
  } = useQuery({
    queryKey: ['guestValidations', user.cardno, JSON.stringify(guestData)],
    queryFn: fetchValidation,
    retry: false,
    enabled: !!user.cardno && Object.keys(guestData).length > 0,
  });

  // Force refetch validation when screen comes into focus and clean up addons
  useFocusEffect(
    useCallback(() => {
      if (user.cardno) {
        // Clean up addon data when coming back from guest booking confirmation
        // Only keep the main booking data based on the booking type
        setGuestData((prev: any) => {
          // Only proceed if there's existing data
          if (Object.keys(prev).length === 0) return prev;

          const cleanedData = { ...prev };

          // Remove addon data based on what's NOT the main booking type
          if (booking !== types.ROOM_DETAILS_TYPE) {
            delete cleanedData.room;
          }
          if (booking !== types.ADHYAYAN_DETAILS_TYPE) {
            delete cleanedData.adhyayan;
          }
          if (booking !== types.EVENT_DETAILS_TYPE) {
            delete cleanedData.utsav;
          }

          // Always remove food addon as it's never a main booking type
          delete cleanedData.food;

          return cleanedData;
        });

        refetchValidation();
      }
    }, [user.cardno, refetchValidation, booking, setGuestData])
  );

  // Room form handling functions
  const addRoomForm = useCallback(() => {
    setRoomForm((prevRoomForm) => ({
      ...prevRoomForm,
      guestGroup: [
        ...prevRoomForm.guestGroup,
        {
          roomType: dropdowns.ROOM_TYPE_LIST[0].key,
          floorType: dropdowns.FLOOR_TYPE_LIST[0].key,
          guests: [],
          guestIndices: [],
        },
      ],
    }));
  }, []);

  const removeRoomForm = useCallback((indexToRemove: any) => {
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
  }, []);

  const updateRoomForm = useCallback(
    (groupIndex: any, key: any, value: any) => {
      setRoomForm((prevRoomForm) => {
        const updatedGuestGroup = [...prevRoomForm.guestGroup];

        if (key === 'guests') {
          updatedGuestGroup[groupIndex].guestIndices = value;
          updatedGuestGroup[groupIndex].guests = guests.filter((_: any, i: any) =>
            value.includes(i)
          );
        } else {
          updatedGuestGroup[groupIndex][key] = value;
        }

        return {
          ...prevRoomForm,
          guestGroup: updatedGuestGroup,
        };
      });
    },
    [guests]
  );

  // Food form handling functions
  const addFoodForm = useCallback(() => {
    setFoodForm((prevFoodForm) => ({
      ...prevFoodForm,
      guestGroup: [
        ...prevFoodForm.guestGroup,
        {
          meals: ['breakfast', 'lunch', 'dinner'],
          spicy: dropdowns.SPICE_LIST[0].key,
          hightea: dropdowns.HIGHTEA_LIST[0].key,
          guests: [],
          guestIndices: [],
        },
      ],
    }));
  }, []);

  const resetFoodForm = useCallback(() => {
    setFoodForm(createInitialFoodForm());
    setGuestData((prev: any) => {
      const { food, ...rest } = prev;
      return rest;
    });
  }, [setGuestData]);

  const removeFoodForm = useCallback((indexToRemove: any) => {
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
  }, []);

  const updateFoodForm = useCallback(
    (groupIndex: any, key: any, value: any) => {
      setFoodForm((prevFoodForm) => {
        const updatedGuestGroup = [...prevFoodForm.guestGroup];

        if (key === 'guests') {
          updatedGuestGroup[groupIndex].guestIndices = value;
          updatedGuestGroup[groupIndex].guests = guests.filter((_: any, i: any) =>
            value.includes(i)
          );
        } else {
          updatedGuestGroup[groupIndex][key] = value;
        }

        return {
          ...prevFoodForm,
          guestGroup: updatedGuestGroup,
        };
      });
    },
    [guests]
  );

  // Adhyayan form handling functions
  const updateAdhyayanForm = useCallback(
    (field: any, value: any) => {
      setAdhyayanForm((prevAdhyayanForm) => ({
        ...prevAdhyayanForm,
        [field]: value,
        ...(field === 'guestIndices' && {
          guests: guests.filter((_: any, i: any) => value.includes(i)),
        }),
      }));
    },
    [guests]
  );

  // Form validation functions
  const validateRoomForm = useCallback(() => {
    const hasEmptyFields = roomForm.guestGroup.some(
      (group: any) => !group.roomType || !group.floorType || group.guests.length === 0
    );
    return !hasEmptyFields && roomForm.startDay && roomForm.endDay;
  }, [roomForm]);

  const validateFoodForm = useCallback(() => {
    const hasEmptyFields = foodForm.guestGroup.some((group: any) => {
      return group.meals.length === 0 || group.guests.length === 0 || group.spicy === '';
    });
    return !hasEmptyFields && foodForm.startDay && foodForm.endDay;
  }, [foodForm]);

  const validateAdhyayanForm = useCallback(() => {
    return Object.keys(adhyayanForm.adhyayan).length !== 0 && adhyayanForm.guests.length !== 0;
  }, [adhyayanForm]);

  // Check if forms are not empty (have user input)
  const isRoomFormEmpty = useCallback(() => {
    return roomForm.guestGroup.some(
      (group: any) => group.roomType !== '' || group.floorType !== '' || group.guests.length > 0
    );
  }, [roomForm]);

  const isFoodFormEmpty = useCallback(() => {
    return foodForm.guestGroup.some(
      (group: any) => group.meals.length > 0 || group.spicy !== '' || group.guests.length > 0
    );
  }, [foodForm]);

  const isAdhyayanFormEmpty = useCallback(() => {
    return Object.keys(adhyayanForm.adhyayan).length > 0 || adhyayanForm.guests.length > 0;
  }, [adhyayanForm]);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    setIsSubmitting(true);
    let hasValidationError = false;

    try {
      // Validate and set Room Form data
      if (booking !== types.ROOM_DETAILS_TYPE && addonOpen.room) {
        if (!validateRoomForm()) {
          Alert.alert('Please fill all the room booking fields');
          hasValidationError = true;
          return;
        }
        setGuestData((prev: any) => ({ ...prev, room: roomForm }));
      }

      // Validate and set Food Form data
      if (addonOpen.food) {
        if (!validateFoodForm()) {
          Alert.alert('Please fill all the food booking fields');
          hasValidationError = true;
          return;
        }
        setGuestData((prev: any) => ({ ...prev, food: foodForm }));
      }

      // Validate and set Adhyayan Form data
      if (booking !== types.ADHYAYAN_DETAILS_TYPE && isAdhyayanFormEmpty()) {
        if (!validateAdhyayanForm()) {
          Alert.alert('Please fill all the adhyayan booking fields');
          hasValidationError = true;
          return;
        }
        setGuestData((prev: any) => ({ ...prev, adhyayan: adhyayanForm }));
      }

      // If no validation errors, navigate to confirmation page
      if (!hasValidationError) {
        router.push('/guestBooking/guestBookingConfirmation');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    booking,
    isRoomFormEmpty,
    isFoodFormEmpty,
    isAdhyayanFormEmpty,
    validateRoomForm,
    validateFoodForm,
    validateAdhyayanForm,
    roomForm,
    foodForm,
    adhyayanForm,
    setGuestData,
    router,
  ]);

  // Check if Adhyayan is in Research Centre
  const isAdhyayanInResearchCentre = useMemo(() => {
    return (
      booking === types.ADHYAYAN_DETAILS_TYPE &&
      guestData.adhyayan?.adhyayan?.location !== 'Research Centre'
    );
  }, [booking, guestData.adhyayan]);

  // Handle validation error modal close
  const handleCloseValidationModal = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView className="h-full bg-white" edges={['right', 'top', 'left']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}>
          <PageHeader title="Guest Booking Details" />

          {booking === types.ROOM_DETAILS_TYPE && (
            <GuestRoomBookingDetails containerStyles="mt-2" />
          )}
          {booking === types.ADHYAYAN_DETAILS_TYPE && (
            <GuestAdhyayanBookingDetails containerStyles="mt-2" />
          )}
          {booking === types.EVENT_DETAILS_TYPE && (
            <GuestEventBookingDetails containerStyles="mt-2" />
          )}

          <View className="w-full px-4">
            {!isAdhyayanInResearchCentre && (
              <View>
                <Text className="mb-2 mt-4 font-psemibold text-xl text-secondary">Add Ons</Text>

                {/* GUEST ROOM BOOKING COMPONENT */}
                {booking !== types.ROOM_DETAILS_TYPE && (
                  <GuestRoomAddon
                    roomForm={roomForm}
                    setRoomForm={setRoomForm}
                    addRoomForm={addRoomForm}
                    reomveRoomForm={removeRoomForm}
                    updateRoomForm={updateRoomForm}
                    INITIAL_ROOM_FORM={createInitialRoomForm()}
                    guest_dropdown={guest_dropdown}
                    isDatePickerVisible={isDatePickerVisible}
                    setDatePickerVisibility={toggleDatePicker}
                    onToggle={(isOpen) => toggleAddon('room', isOpen)}
                  />
                )}

                {/* GUEST FOOD BOOKING COMPONENT */}
                <GuestFoodAddon
                  foodForm={foodForm}
                  setFoodForm={setFoodForm}
                  addFoodForm={addFoodForm}
                  resetFoodForm={resetFoodForm}
                  reomveFoodForm={removeFoodForm}
                  updateFoodForm={updateFoodForm}
                  guest_dropdown={guest_dropdown}
                  isDatePickerVisible={isDatePickerVisible}
                  setDatePickerVisibility={toggleDatePicker}
                  onToggle={(isOpen) => toggleAddon('food', isOpen)}
                />

                {/* GUEST ADHYAYAN BOOKING COMPONENT */}
                {![types.ADHYAYAN_DETAILS_TYPE, types.EVENT_DETAILS_TYPE].includes(booking) && (
                  <GuestAdhyayanAddon
                    adhyayanForm={adhyayanForm}
                    setAdhyayanForm={setAdhyayanForm}
                    updateAdhyayanForm={updateAdhyayanForm}
                    INITIAL_ADHYAYAN_FORM={createInitialAdhyayanForm()}
                    guest_dropdown={guest_dropdown}
                  />
                )}
              </View>
            )}

            <CustomButton
              text="Confirm"
              handlePress={handleSubmit}
              containerStyles="mb-8 min-h-[62px] mt-6"
              isLoading={isSubmitting}
            />
          </View>

          {validationDataError && (
            <CustomModal
              visible={true}
              onClose={handleCloseValidationModal}
              message={validationDataError.message}
              btnText="Okay"
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default GuestAddons;
