import { FontAwesome } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import Callout from '@/src/components/Callout';
import CustomAlert from '@/src/components/CustomAlert';
import CustomButton from '@/src/components/CustomButton';
import PageHeader from '@/src/components/PageHeader';
import SectionHeader from '@/src/components/booking/shared/SectionHeader';
import { ShadowBox } from '@/src/components/ShadowBox';
import { dropdowns, types } from '@/src/constants';
import { useAuthStore, useBookingStore } from '@/src/stores';

import handleAPICall from '@/src/utils/HandleApiCall';
import { prepareGuestRequestBody } from '@/src/utils/preparingRequestBody';
import StayOutcomeBlock from '@/src/components/stay/StayOutcomeBlock';
import { useStayOutcome } from '@/src/components/stay/useStayOutcome';
import BookingSummary from '@/src/components/booking/shared/BookingSummary';
import GuestRoomAddon from '@/src/components/booking addons/GuestRoomAddon';
import GuestFoodAddon from '@/src/components/booking addons/GuestFoodAddon';
import GuestAdhyayanAddon from '@/src/components/booking addons/GuestAdhyayanAddon';
import CustomModal from '@/src/components/CustomModal';

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

  const user = useAuthStore((state) => state.user);
  const guestData = useBookingStore((state) => state.guestData);
  const setGuestData = useBookingStore((state) => state.setGuestData);

  const router = useRouter();

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
  }, [guestData.room, guestData.adhyayan, guestData.utsav]);

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
      guestData.utsav?.utsav?.utsav_start ||
      '';

    const endDate =
      guestData.room?.endDay ||
      guestData.food?.endDay ||
      guestData.adhyayan?.adhyayan?.end_date ||
      guestData.utsav?.utsav?.utsav_end ||
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
      guestData.utsav?.utsav?.start_date ||
      '';

    const endDate =
      guestData.room?.endDay ||
      guestData.food?.endDay ||
      guestData.adhyayan?.adhyayan?.end_date ||
      guestData.utsav?.utsav?.end_date ||
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
          if (booking !== types.FLAT_DETAILS_TYPE) {
            delete cleanedData.flat;
          }

          // Food is bookable on its own, so on its own screen it is the booking.
          if (booking !== types.FOOD_DETAILS_TYPE) {
            delete cleanedData.food;
          }

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

  // The verdict for these dates, per person and per segment, shown above the
  // add-ons so nobody fills these in only to learn later that they are on a
  // waitlist. /validate is already called on this screen.
  const stayOutcome = useStayOutcome('guest');
  const [stayReason, setStayReason] = useState(
    () =>
      (guestData as any)?.room?.extra_stay_reason ||
      (guestData as any)?.flat?.extra_stay_reason ||
      ''
  );
  const [showReasonError, setShowReasonError] = useState(false);

  const reasonMissing = Boolean(stayOutcome?.requiresExtraStayReason && !stayReason.trim());
  const cannotBookHere = Boolean(
    stayOutcome?.segments.some((seg) => seg.groups.some((g) => g.verdict === 'unavailable'))
  );

  // Carry the reason onto the booking so the review screen shows the same text
  // and the waitlisted booking is submitted with it.
  const persistStayReason = () => {
    const reasonText = stayReason.trim();
    if (!reasonText) return;
    setGuestData((prev: any) => ({
      ...prev,
      ...(prev.room ? { room: { ...prev.room, extra_stay_reason: reasonText } } : {}),
      ...(prev.flat ? { flat: { ...prev.flat, extra_stay_reason: reasonText } } : {}),
    }));
  };

  // Handle form submission
  const handleSubmit = useCallback(() => {
    setIsSubmitting(true);
    // try/finally, because every validation failure returns early. Without it
    // isSubmitting stayed true, CustomButton stayed disabled, and the member
    // could not retry without leaving the screen.
    try {
      // Validate and set Room Form data
      if (booking !== types.ROOM_DETAILS_TYPE && addonOpen.room) {
        if (!validateRoomForm()) {
          CustomAlert.alert('Please fill all the room booking fields');
          return;
        }
        setGuestData((prev: any) => ({ ...prev, room: roomForm }));
      }

      // Validate and set Food Form data
      if (addonOpen.food) {
        if (!validateFoodForm()) {
          CustomAlert.alert('Please fill all the food booking fields');
          return;
        }
        setGuestData((prev: any) => ({ ...prev, food: foodForm }));
      }

      // Validate and set Adhyayan Form data
      if (booking !== types.ADHYAYAN_DETAILS_TYPE && isAdhyayanFormEmpty()) {
        if (!validateAdhyayanForm()) {
          CustomAlert.alert('Please fill all the adhyayan booking fields');
          return;
        }
        setGuestData((prev: any) => ({ ...prev, adhyayan: adhyayanForm }));
      }

      router.push('/guestBooking/bookingReview');
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

  // Handle validation error modal close
  const handleCloseValidationModal = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView className="h-full bg-gray-50" edges={['right', 'top', 'left']}>
      <KeyboardAwareScrollView
        bottomOffset={62}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled">
        <PageHeader title="Guest Booking Details" />

        {/* One gap between every section. Each block used to carry its own
            margin, and an empty view stood in for one of them. */}
        <View className="gap-y-6">
          {/* Same card component the review screen uses. There is one way to show
              a booking, so the two screens cannot drift apart. */}
          <BookingSummary
            data={guestData}
            audience="guest"
            validationData={guestData?.validationData}
            className="px-4"
          />

          {booking === types.EVENT_DETAILS_TYPE ? (
            <Callout
              variant="warning"
              message="For Early Arrival or Late Departure during events please book your stay, food and travel through add-ons below."
              overrideStyle="mx-4"
            />
          ) : null}

          {stayOutcome && (
            <View className="w-full px-4">
              <StayOutcomeBlock
                outcome={stayOutcome}
                variant="full"
                onChangeDates={() => router.back()}
                reason={stayReason}
                onChangeReason={(text) => {
                  setStayReason(text);
                  if (text.trim()) setShowReasonError(false);
                }}
                showReasonError={showReasonError}
              />
            </View>
          )}

          <View className="w-full px-4">
            <SectionHeader
              title="Add-ons"
              subtitle="Optional. Anything you add here is booked together with the stay above."
              className="mb-3"
            />

            {/* GUEST ROOM BOOKING COMPONENT */}
            {![types.ROOM_DETAILS_TYPE, types.FLAT_DETAILS_TYPE].includes(booking) && (
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
        </View>
      </KeyboardAwareScrollView>

      <ShadowBox className="w-full border-t border-gray-200 bg-white px-4 py-4">
        {/* A disabled button with no stated cause makes a member tap a dead
            control. Name the blocker next to it. */}
        {cannotBookHere && (
          <Text className="mb-2.5 font-pregular text-xs leading-5 text-gray-600">
            These dates cannot be booked. Go back and pick different dates.
          </Text>
        )}
        {!cannotBookHere && reasonMissing && (
          <Text className="mb-2.5 font-pregular text-xs leading-5 text-gray-600">
            Add a reason for the extra nights above to continue.
          </Text>
        )}
        <CustomButton
          text="Continue"
          handlePress={() => {
            if (cannotBookHere) return;
            if (reasonMissing) {
              setShowReasonError(true);
              return;
            }
            persistStayReason();
            handleSubmit();
          }}
          containerStyles="min-h-[52px] mb-8"
          isLoading={isSubmitting}
          isDisabled={cannotBookHere || reasonMissing}
        />
      </ShadowBox>

      {validationDataError && (
        <CustomModal
          visible
          onClose={handleCloseValidationModal}
          message={validationDataError.message}
          btnText="Okay"
        />
      )}
    </SafeAreaView>
  );
};

export default GuestAddons;
