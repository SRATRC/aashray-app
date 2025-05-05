import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import { useGlobalContext } from '../../context/GlobalProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dropdowns, types } from '../../constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { prepareSelfRequestBody } from '~/utils/preparingRequestBody';
import CustomButton from '../../components/CustomButton';
import PageHeader from '../../components/PageHeader';
import RoomBookingDetails from '../../components/booking details cards/RoomBookingDetails';
import TravelBookingDetails from '../../components/booking details cards/TravelBookingDetails';
import AdhyayanBookingDetails from '../../components/booking details cards/AdhyayanBookingDetails';
import RoomAddon from '../../components/booking addons/RoomAddon';
import FoodAddon from '../../components/booking addons/FoodAddon';
import AdhyayanAddon from '../../components/booking addons/AdhyayanAddon';
import TravelAddon from '../../components/booking addons/TravelAddon';
import handleAPICall from '~/utils/HandleApiCall';
import CustomModal from '~/components/CustomModal';
import EventBookingDetails from '~/components/booking details cards/EventBookingDetails';

const BookingDetails = () => {
  const { booking } = useLocalSearchParams();
  const { user, data, setData } = useGlobalContext();
  const router = useRouter();
  const queryClient = useQueryClient();

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
      luggage: '',
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

  const {
    isLoading: isValidationDataLoading,
    isError: isValidationDataError,
    error: validationDataError,
    data: validationData,
  } = useQuery({
    queryKey: ['validations', user.cardno, JSON.stringify(data)],
    queryFn: fetchValidation,
    retry: false,
    enabled: !!user.cardno, // Only run when user.cardno is available
  });

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
    const requiredFields = ['date', 'pickup', 'drop', 'luggage', 'type'];
    return requiredFields.every((field) => forms.travel[field] !== '');
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
    setData((prev: any) => ({ ...prev, dismissedValidationError: true }));
    queryClient.resetQueries({ queryKey: ['validations', user.cardno] });
    router.back();
  }, [setData, queryClient, router, user.cardno]);

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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          className="h-full">
          <PageHeader title="Booking Details" />

          {renderBookingDetails()}

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

          {validationDataError && !data.dismissedValidationError && (
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

export default BookingDetails;
