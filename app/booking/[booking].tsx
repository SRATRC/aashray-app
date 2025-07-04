import { useState, useMemo, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore, useBookingStore } from '@/stores';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dropdowns, types } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import { prepareSelfRequestBody } from '@/utils/preparingRequestBody';
import CustomButton from '@/components/CustomButton';
import PageHeader from '@/components/PageHeader';
import RoomBookingDetails from '@/components/booking details cards/RoomBookingDetails';
import TravelBookingDetails from '@/components/booking details cards/TravelBookingDetails';
import AdhyayanBookingDetails from '@/components/booking details cards/AdhyayanBookingDetails';
import RoomAddon from '@/components/booking addons/RoomAddon';
import FoodAddon from '@/components/booking addons/FoodAddon';
import AdhyayanAddon from '@/components/booking addons/AdhyayanAddon';
import TravelAddon from '@/components/booking addons/TravelAddon';
import handleAPICall from '@/utils/HandleApiCall';
import CustomModal from '@/components/CustomModal';
import EventBookingDetails from '@/components/booking details cards/EventBookingDetails';

const BookingDetails = () => {
  const { booking } = useLocalSearchParams();

  const user = useAuthStore((state) => state.user);
  const data = useBookingStore((state) => state.data);
  const setData = useBookingStore((state) => state.setData);

  const router = useRouter();

  // Consolidated state for addons visibility
  const [addonOpen, setAddonOpen] = useState({
    room: false,
    food: false,
    travel: false,
  });

  // Extract initial dates from context data
  const initialDates = useMemo(() => {
    const startDate =
      data.room?.startDay ||
      data.travel?.date ||
      (data.adhyayan && data.adhyayan[0]?.start_date) ||
      '';

    const endDate = data.room?.endDay || (data.adhyayan && data.adhyayan[0]?.end_date) || '';

    return { startDate, endDate };
  }, [data.room, data.travel, data.adhyayan]);

  // Consolidated form state
  const [forms, setForms]: any = useState({
    room: {
      startDay: initialDates.startDate,
      endDay: initialDates.endDate,
      roomType: dropdowns.ROOM_TYPE_LIST[0].key,
      floorType: dropdowns.FLOOR_TYPE_LIST[0].key,
    },
    food: {
      startDay: initialDates.startDate,
      endDay: initialDates.endDate,
      meals: ['breakfast', 'lunch', 'dinner'],
      spicy: dropdowns.SPICE_LIST[0].key,
      hightea: dropdowns.HIGHTEA_LIST[0].key,
    },
    travel: {
      date: initialDates.startDate,
      pickup: '',
      drop: '',
      adhyayan: dropdowns.TRAVEL_ADHYAYAN_ASK_LIST[1].value,
      type: dropdowns.BOOKING_TYPE_LIST[0].value,
      arrival_time: '',
      total_people: null,
      luggage: [],
      special_request: '',
    },
    adhyayan: [],
  });

  // Consolidated date picker visibility state
  const [isDatePickerVisible, setDatePickerVisibility] = useState({
    checkin: false,
    checkout: false,
    foodStart: false,
    foodEnd: false,
    travel: false,
    travel_time: false,
  });

  // Update entire form handler
  const setFormValues = useCallback((formType: any, values: any) => {
    setForms((prev: any) => ({
      ...prev,
      [formType]: values,
    }));
  }, []);

  // Toggle addon visibility handler
  const toggleAddon = useCallback((addonType: any, isOpen: any) => {
    setAddonOpen((prev) => ({ ...prev, [addonType]: isOpen }));
  }, []);

  // Handle date picker visibility
  const toggleDatePicker = useCallback((pickerType: any, isVisible: any) => {
    setDatePickerVisibility((prev) => ({ ...prev, [pickerType]: isVisible }));
  }, []);

  // Set adhyayan booking list
  const setAdhyayanBookingList = useCallback(
    (list: any) => {
      setFormValues('adhyayan', list);
    },
    [setFormValues]
  );

  // Validation API call
  const fetchValidation = useCallback(async () => {
    const payload = prepareSelfRequestBody(user, data);

    return new Promise((resolve, reject) => {
      handleAPICall(
        'POST',
        '/unified/validate',
        null,
        payload,
        (res: any) => {
          setData((prev: any) => ({ ...prev, validationData: res.data }));
          resolve(res.data);
        },
        () => {},
        (errorDetails) => reject(new Error(errorDetails.message))
      );
    });
  }, [user, data, setData]);

  const { error: validationDataError, refetch: refetchValidation } = useQuery({
    queryKey: ['validations', user.cardno, JSON.stringify(data)],
    queryFn: fetchValidation,
    retry: false,
    enabled: !!user.cardno, // Only run when user.cardno is available
  });

  // Force refetch validation when screen comes into focus and clean up addons
  useFocusEffect(
    useCallback(() => {
      if (user.cardno) {
        // Clean up addon data when coming back from booking confirmation
        // Only keep the main booking data based on the booking type
        setData((prev: any) => {
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

        refetchValidation();
      }
    }, [user.cardno, refetchValidation, booking, setData])
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions
  const validateRoomForm = useCallback(() => {
    return Object.values(forms.room).every((value) => value !== '');
  }, [forms.room]);

  const validateFoodForm = useCallback(() => {
    const requiredFields = ['startDay', 'endDay', 'meals'];
    return requiredFields.every(
      (field: any) =>
        forms.food[field] &&
        (Array.isArray(forms.food[field]) ? forms.food[field].length > 0 : forms.food[field] !== '')
    );
  }, [forms.food]);

  const validateTravelForm = useCallback(() => {
    const { date, pickup, drop, luggage, special_request } = forms.travel;
    if (!date || !pickup || !drop || luggage.length === 0) return false;
    if (
      (pickup === 'Other' && special_request.trim() === '') ||
      (drop === 'Other' && special_request.trim() === '')
    )
      return false;
    if (pickup === 'Research Centre' && drop === 'Research Centre') return false;
    if (pickup !== 'Research Centre' && drop !== 'Research Centre') return false;
    if (forms.travel.type == dropdowns.BOOKING_TYPE_LIST[1].value && !forms.travel.total_people)
      return false;
    return true;
  }, [forms.travel]);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    setIsSubmitting(true);
    let hasValidationError = false;

    try {
      // Validate room form if addon is open and not on room details page
      if (booking !== types.ROOM_DETAILS_TYPE && addonOpen.room) {
        if (!validateRoomForm()) {
          Alert.alert('Please fill all the room fields');
          hasValidationError = true;
          return;
        }
        setData((prev: any) => ({ ...prev, room: forms.room }));
      }

      // Validate food form if addon is open
      if (addonOpen.food) {
        if (!validateFoodForm()) {
          Alert.alert('Please fill all the required food fields');
          hasValidationError = true;
          return;
        }
        setData((prev: any) => ({ ...prev, food: forms.food }));
      }

      // Validate travel form if addon is open and not on travel details page
      if (booking !== types.TRAVEL_DETAILS_TYPE && addonOpen.travel) {
        if (!validateTravelForm()) {
          Alert.alert('Please fill all the travel fields');
          hasValidationError = true;
          return;
        }
        setData((prev: any) => ({ ...prev, travel: forms.travel }));
      }

      // Add adhyayan data if available and not on adhyayan details page
      if (booking !== types.ADHYAYAN_DETAILS_TYPE && forms.adhyayan.length > 0) {
        setData((prev: any) => ({ ...prev, adhyayan: forms.adhyayan }));
      }

      // If no validation errors, navigate to confirmation page
      if (!hasValidationError) {
        router.push('/booking/bookingConfirmation');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    booking,
    addonOpen,
    forms,
    validateRoomForm,
    validateFoodForm,
    validateTravelForm,
    setData,
    router,
  ]);

  // Close validation error modal
  const handleCloseValidationModal = useCallback(() => {
    router.back();
  }, [router]);

  // Render booking details card based on booking type
  const renderBookingDetails = () => {
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
  };

  return (
    <SafeAreaView className="h-full bg-white" edges={['right', 'top', 'left']}>
      <KeyboardAwareScrollView
        bottomOffset={62}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled">
        <PageHeader title="Booking Details" />

        {renderBookingDetails()}

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
            {booking !== types.TRAVEL_DETAILS_TYPE && (
              <TravelAddon
                travelForm={forms.travel}
                setTravelForm={(formData: any) => setFormValues('travel', formData)}
                isDatePickerVisible={isDatePickerVisible}
                setDatePickerVisibility={toggleDatePicker}
                onToggle={(isOpen) => toggleAddon('travel', isOpen)}
              />
            )}
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
