import { useState, useMemo, useCallback } from 'react';
import { View, Text, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore, useBookingStore } from '@/src/stores';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dropdowns, types } from '@/src/constants';
import { useQuery } from '@tanstack/react-query';
import { prepareMumukshuRequestBody } from '@/src/utils/preparingRequestBody';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import CustomButton from '@/src/components/CustomButton';
import PageHeader from '@/src/components/PageHeader';
import RoomBookingDetails from '@/src/components/booking details cards/RoomBookingDetails';
import TravelBookingDetails from '@/src/components/booking details cards/TravelBookingDetails';
import AdhyayanBookingDetails from '@/src/components/booking details cards/AdhyayanBookingDetails';
import EventBookingDetails from '@/src/components/booking details cards/EventBookingDetails';
import RoomAddon from '@/src/components/booking addons/RoomAddon';
import FoodAddon from '@/src/components/booking addons/FoodAddon';
import AdhyayanAddon from '@/src/components/booking addons/AdhyayanAddon';
import TravelAddon from '@/src/components/booking addons/TravelAddon';
import handleAPICall from '@/src/utils/HandleApiCall';
import CustomModal from '@/src/components/CustomModal';

// Transform simple form to mumukshu format for API compatibility
const transformToMumukshuFormat = (user: any, simpleForm: any, formType: string) => {
  const selfMumukshu = {
    cardno: user.cardno,
    issuedto: user.name || `${user.firstname} ${user.lastname}`.trim(),
  };

  switch (formType) {
    case 'room':
      return {
        startDay: simpleForm.startDay,
        endDay: simpleForm.endDay,
        mumukshuGroup: [
          {
            roomType: simpleForm.roomType,
            floorType: simpleForm.floorType,
            mumukshus: [selfMumukshu],
            mumukshuIndices: ['0'],
          },
        ],
      };

    case 'food':
      return {
        startDay: simpleForm.startDay,
        endDay: simpleForm.endDay,
        mumukshuGroup: [
          {
            meals: simpleForm.meals,
            spicy: simpleForm.spicy,
            hightea: simpleForm.hightea,
            mumukshus: [selfMumukshu],
            mumukshuIndices: ['0'],
          },
        ],
      };

    case 'travel':
      return {
        date: simpleForm.date,
        mumukshuGroup: [
          {
            pickup: simpleForm.pickup,
            drop: simpleForm.drop,
            luggage: simpleForm.luggage,
            type: simpleForm.type,
            adhyayan: simpleForm.adhyayan,
            arrival_time: simpleForm.arrival_time,
            total_people: simpleForm.total_people,
            special_request: simpleForm.special_request,
            mumukshus: [selfMumukshu],
            mumukshuIndices: ['0'],
          },
        ],
      };

    case 'adhyayan':
      return {
        adhyayan: simpleForm[0] || {}, // adhyayan is array in simple form but object in mumukshu
        mumukshus: [selfMumukshu],
        mumukshuIndices: ['0'],
      };

    default:
      return simpleForm;
  }
};

const BookingDetails = () => {
  const { booking } = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);
  const mumukshuData = useBookingStore((state) => state.mumukshuData);
  const setMumukshuData = useBookingStore((state) => state.setMumukshuData);
  const router = useRouter();

  // Consolidated state with proper initialization
  const [addonOpen, setAddonOpen] = useState({
    room: false,
    food: false,
    travel: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Extract initial dates from context data with memoization
  const initialDates = useMemo(() => {
    const startDate =
      mumukshuData.room?.startDay ||
      mumukshuData.travel?.date ||
      (mumukshuData.adhyayan && mumukshuData.adhyayan.adhyayan?.start_date) ||
      '';

    const endDate =
      mumukshuData.room?.endDay ||
      (mumukshuData.adhyayan && mumukshuData.adhyayan.adhyayan?.end_date) ||
      '';

    return { startDate, endDate };
  }, [mumukshuData.room, mumukshuData.travel, mumukshuData.adhyayan]);

  // Initialize form state with proper defaults (keeping simple structure for UI)
  const [forms, setForms] = useState(() => ({
    room: {
      startDay: initialDates.startDate,
      endDay: initialDates.endDate,
      roomType: dropdowns.ROOM_TYPE_LIST[0]?.key || '',
      floorType: dropdowns.FLOOR_TYPE_LIST[0]?.key || '',
    },
    food: {
      startDay: initialDates.startDate,
      endDay: initialDates.endDate,
      meals: ['breakfast', 'lunch', 'dinner'],
      spicy: dropdowns.SPICE_LIST[0]?.key || '',
      hightea: dropdowns.HIGHTEA_LIST[0]?.key || '',
    },
    travel: {
      date: initialDates.startDate,
      pickup: '',
      drop: '',
      adhyayan: dropdowns.TRAVEL_ADHYAYAN_ASK_LIST[1]?.value || '',
      type: dropdowns.BOOKING_TYPE_LIST[0]?.value || '',
      arrival_time: '',
      total_people: null,
      luggage: [],
      special_request: '',
    },
    adhyayan: [],
  }));

  // Consolidated date picker visibility state
  const [isDatePickerVisible, setDatePickerVisibility] = useState({
    checkin: false,
    checkout: false,
    foodStart: false,
    foodEnd: false,
    travel: false,
    travel_time: false,
  });

  // Memoized handlers to prevent unnecessary re-renders
  const setFormValues = useCallback((formType: string, values: any) => {
    setForms((prev) => ({
      ...prev,
      [formType]: values,
    }));
  }, []);

  const toggleAddon = useCallback((addonType: string, isOpen: boolean) => {
    setAddonOpen((prev) => ({ ...prev, [addonType]: isOpen }));
  }, []);

  const toggleDatePicker = useCallback((pickerType: string, isVisible: boolean) => {
    setDatePickerVisibility((prev) => ({ ...prev, [pickerType]: isVisible }));
  }, []);

  const setAdhyayanBookingList = useCallback(
    (list: any) => {
      setFormValues('adhyayan', list);
    },
    [setFormValues]
  );

  // Validation API call with proper error handling - now using mumukshu endpoint
  const fetchValidation = useCallback(async () => {
    if (!user?.cardno || isValidating) {
      throw new Error('User not authenticated or validation in progress');
    }

    // Prevent multiple simultaneous validations
    setIsValidating(true);

    try {
      const payload = prepareMumukshuRequestBody(user, mumukshuData);

      return new Promise((resolve, reject) => {
        handleAPICall(
          'POST',
          '/mumukshu/validate',
          null,
          payload,
          (res: any) => {
            setMumukshuData((prev: any) => ({ ...prev, validationData: res.data }));
            resolve(res.data);
          },
          () => {},
          (errorDetails) => reject(new Error(errorDetails.message))
        );
      });
    } finally {
      setIsValidating(false);
    }
  }, [user, mumukshuData, setMumukshuData, isValidating]);

  const { error: validationDataError, refetch: refetchValidation } = useQuery({
    queryKey: ['mumukshuValidations', user?.cardno, JSON.stringify(mumukshuData)],
    queryFn: fetchValidation,
    retry: false,
    enabled: !!(user?.cardno && Object.keys(mumukshuData).length > 0 && !isValidating),
    staleTime: 1000 * 10,
  });

  const [cleanupTimeoutId, setCleanupTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user?.cardno) {
        // Clear any existing timeout
        if (cleanupTimeoutId) {
          clearTimeout(cleanupTimeoutId);
        }

        // Debounce the cleanup operation
        const timeoutId = setTimeout(() => {
          setMumukshuData((prev: any) => {
            const cleanedData = { ...prev };

            // Remove addon data based on what's NOT the main booking type
            if (booking !== types.ROOM_DETAILS_TYPE) {
              delete cleanedData.room;
            }
            if (booking !== types.TRAVEL_DETAILS_TYPE) {
              delete cleanedData.travel;
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

          // Only refetch if not currently validating
          if (!isValidating) {
            refetchValidation();
          }
        }, 100); // 100ms debounce

        setCleanupTimeoutId(timeoutId);
      }

      // Cleanup function
      return () => {
        if (cleanupTimeoutId) {
          clearTimeout(cleanupTimeoutId);
        }
      };
    }, [user?.cardno, refetchValidation, booking, setMumukshuData, isValidating])
  );

  // Validation functions with proper error handling
  const validateRoomForm = useCallback(() => {
    return Object.values(forms.room).every((value) => value !== '' && value !== null);
  }, [forms.room]);

  const validateFoodForm = useCallback(() => {
    const requiredFields = ['startDay', 'endDay', 'meals'];
    return requiredFields.every(
      (field) =>
        forms.food[field] &&
        (Array.isArray(forms.food[field]) ? forms.food[field].length > 0 : forms.food[field] !== '')
    );
  }, [forms.food]);

  const validateTravelForm = useCallback(() => {
    const { date, pickup, drop, luggage, special_request, type, total_people } = forms.travel;

    if (!date || !pickup || !drop || luggage.length === 0) return false;
    const otherLocation = dropdowns.LOCATION_LIST.find((loc) => loc.key === 'other');
    if (
      (pickup === otherLocation?.value && special_request.trim() === '') ||
      (drop === otherLocation?.value && special_request.trim() === '')
    )
      return false;
    if (pickup === 'Research Centre' && drop === 'Research Centre') return false;
    if (pickup !== 'Research Centre' && drop !== 'Research Centre') return false;
    if (type === dropdowns.BOOKING_TYPE_LIST[1]?.value && !total_people) return false;

    return true;
  }, [forms.travel]);

  // Optimized form submission
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    let hasValidationError = false;

    try {
      // Validate forms in batch and transform to mumukshu format when saving
      const validations = [];

      if (booking !== types.ROOM_DETAILS_TYPE && addonOpen.room) {
        if (!validateRoomForm()) {
          Alert.alert('Please fill all the room fields');
          hasValidationError = true;
          return;
        }
        const mumukshuRoomData = transformToMumukshuFormat(user, forms.room, 'room');
        validations.push(['room', mumukshuRoomData]);
      }

      if (addonOpen.food) {
        if (!validateFoodForm()) {
          Alert.alert('Please fill all the required food fields');
          hasValidationError = true;
          return;
        }
        const mumukshuFoodData = transformToMumukshuFormat(user, forms.food, 'food');
        validations.push(['food', mumukshuFoodData]);
      }

      if (booking !== types.TRAVEL_DETAILS_TYPE && addonOpen.travel) {
        if (!validateTravelForm()) {
          Alert.alert('Please fill all the travel fields');
          hasValidationError = true;
          return;
        }
        const mumukshuTravelData = transformToMumukshuFormat(user, forms.travel, 'travel');
        validations.push(['travel', mumukshuTravelData]);
      }

      if (booking !== types.ADHYAYAN_DETAILS_TYPE && forms.adhyayan.length > 0) {
        const mumukshuAdhyayanData = transformToMumukshuFormat(user, forms.adhyayan, 'adhyayan');
        validations.push(['adhyayan', mumukshuAdhyayanData]);
      }

      // Update data in batch
      if (validations.length > 0) {
        setMumukshuData((prev: any) => {
          const newData = { ...prev };
          validations.forEach(([key, value]) => {
            newData[key] = value;
          });
          return newData;
        });
      }

      // Navigate if no validation errors
      if (!hasValidationError) {
        router.push('/booking/bookingConfirmation');
      }
    } catch (error) {
      console.error('Error during submission:', error);
      Alert.alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    booking,
    addonOpen,
    forms,
    validateRoomForm,
    validateFoodForm,
    validateTravelForm,
    setMumukshuData,
    router,
    user,
  ]);

  const handleCloseValidationModal = useCallback(() => {
    // Reset validation state when closing modal
    setIsValidating(false);
    router.back();
  }, [router]);

  // Memoized booking details component
  const BookingDetailsComponent = useMemo(() => {
    switch (booking) {
      case types.ROOM_DETAILS_TYPE:
        return <RoomBookingDetails containerStyles="mt-2" />;
      case types.ADHYAYAN_DETAILS_TYPE:
        return <AdhyayanBookingDetails containerStyles="mt-2" />;
      case types.TRAVEL_DETAILS_TYPE:
        return <TravelBookingDetails containerStyles="mt-2" />;
      case types.EVENT_DETAILS_TYPE:
        return <EventBookingDetails containerStyles="mt-2" />;
      default:
        return null;
    }
  }, [booking]);

  const renderAddons = () => {
    if (isValidating) {
      return (
        <View className="flex items-center justify-center py-8">
          <ActivityIndicator size="large" />
          <Text className="mt-2 text-gray-500">Processing...</Text>
        </View>
      );
    }

    return (
      <>
        {/* ROOM BOOKING COMPONENT */}
        {booking !== types.ROOM_DETAILS_TYPE && (
          <RoomAddon
            roomForm={forms.room}
            setRoomForm={(formData: any) => setFormValues('room', formData)}
            isDatePickerVisible={isDatePickerVisible}
            setDatePickerVisibility={toggleDatePicker}
            onToggle={(isOpen) => toggleAddon('room', isOpen)}
          />
        )}

        {/* FOOD BOOKING COMPONENT */}
        <FoodAddon
          foodForm={forms.food}
          setFoodForm={(formData: any) => setFormValues('food', formData)}
          isDatePickerVisible={isDatePickerVisible}
          setDatePickerVisibility={toggleDatePicker}
          onToggle={(isOpen) => toggleAddon('food', isOpen)}
        />

        {/* ADHYAYAN BOOKING COMPONENT */}
        {![types.ADHYAYAN_DETAILS_TYPE, types.EVENT_DETAILS_TYPE].includes(booking) && (
          <AdhyayanAddon
            adhyayanBookingList={forms.adhyayan}
            setAdhyayanBookingList={setAdhyayanBookingList}
            booking={booking}
          />
        )}

        {/* TRAVEL BOOKING COMPONENT */}
        {booking !== types.TRAVEL_DETAILS_TYPE && user?.res_status !== 'GUEST' && (
          <TravelAddon
            travelForm={forms.travel}
            setTravelForm={(formData: any) => setFormValues('travel', formData)}
            isDatePickerVisible={isDatePickerVisible}
            setDatePickerVisibility={toggleDatePicker}
            onToggle={(isOpen) => toggleAddon('travel', isOpen)}
          />
        )}
      </>
    );
  };

  return (
    <SafeAreaView className="h-full bg-white" edges={['right', 'top', 'left']}>
      <KeyboardAwareScrollView
        bottomOffset={62}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}>
        <PageHeader title="Booking Details" />

        {BookingDetailsComponent}

        {booking === types.EVENT_DETAILS_TYPE && (
          <View className="mx-4 mb-2 mt-4 rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
            <View className="flex-row items-start">
              <View className="mr-3 mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500">
                <Text className="font-pbold text-xs text-white">i</Text>
              </View>
              <View className="flex-1">
                <Text className="mb-2 font-psemibold text-base text-amber-800">
                  IMPORTANT NOTICE
                </Text>
                <Text className="font-pregular text-sm leading-5 text-amber-800">
                  For Early Arrival or Late Departure during events please book your stay, food and
                  travel through add-ons below.
                </Text>
              </View>
            </View>
          </View>
        )}

        <View className="w-full px-4">
          <View>
            <Text className="mb-2 mt-4 font-psemibold text-xl text-secondary">Add Ons</Text>
            {renderAddons()}
          </View>

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
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default BookingDetails;
