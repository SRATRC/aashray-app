import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import { useGlobalContext } from '../../context/GlobalProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dropdowns, icons, types } from '../../constants';
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
      // Outbound journey (to Research Centre)
      outbound: {
        date: initialDates.startDate,
        pickup: '',
        drop: 'Research Centre', // Always Research Centre
        arrival_time: '',
        type: dropdowns.BOOKING_TYPE_LIST[0].value,
        luggage: '',
      },
      // Return journey (from Research Centre)
      return: {
        date: initialDates.endDate || '', // Default to end date if available
        pickup: 'Research Centre', // Always Research Centre
        drop: '',
        arrival_time: '',
        type: dropdowns.BOOKING_TYPE_LIST[0].value,
        luggage: '',
      },
      // Common fields
      adhyayan: dropdowns.TRAVEL_ADHYAYAN_ASK_LIST[1].value,
      special_request: '',
      // New field to track if return journey is needed
      needsReturn: false,
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
    // Add these for the TravelAddon component
    toRC_travel: false,
    fromRC_travel: false,
    toRC_time: false,
    fromRC_time: false,
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
    queryKey: ['validations', user.cardno],
    queryFn: fetchValidation,
    retry: false,
    enabled: !!user.cardno,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if Adhyayan is in Research Centre
  const isAdhyayanInResearchCentre = useMemo(() => {
    return (
      booking === types.ADHYAYAN_DETAILS_TYPE &&
      data.adhyayan &&
      data.adhyayan.length > 0 &&
      data.adhyayan[0].location !== 'Research Centre'
    );
  }, [booking, data.adhyayan]);

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
    // Check if travel form exists
    if (!forms.travel) return false;

    // Check for different travel form structures
    if (
      forms.travel.toResearchCentre !== undefined ||
      forms.travel.fromResearchCentre !== undefined
    ) {
      // New structure with toResearchCentre and fromResearchCentre
      let hasValidJourney = false;
      let allValid = true;

      // Validate "To Research Centre" journey if active
      if (forms.travel.toResearchCentre?.active === true) {
        hasValidJourney = true;
        // Make sure toResearchCentre exists and has all required fields
        if (forms.travel.toResearchCentre) {
          const requiredFields = ['date', 'pickup', 'drop', 'luggage', 'type'];
          const isValid = requiredFields.every(
            (field) => forms.travel.toResearchCentre[field] !== ''
          );
          if (!isValid) allValid = false;
        } else {
          allValid = false;
        }
      }

      // Validate "From Research Centre" journey if active
      if (forms.travel.fromResearchCentre?.active === true) {
        hasValidJourney = true;
        // Make sure fromResearchCentre exists and has all required fields
        if (forms.travel.fromResearchCentre) {
          const requiredFields = ['date', 'pickup', 'drop', 'luggage', 'type'];
          const isValid = requiredFields.every(
            (field) => forms.travel.fromResearchCentre[field] !== ''
          );
          if (!isValid) allValid = false;
        } else {
          allValid = false;
        }
      }

      // At least one journey must be active and all active journeys must be valid
      return hasValidJourney && allValid;
    } else if (forms.travel.outbound !== undefined || forms.travel.return !== undefined) {
      // Structure with outbound and return
      // First check if outbound exists
      if (!forms.travel.outbound) return false;

      // Validate outbound journey
      const outboundRequiredFields = ['date', 'pickup', 'drop', 'luggage', 'type'];
      const outboundValid = outboundRequiredFields.every(
        (field) => forms.travel.outbound[field] !== ''
      );

      // Validate return journey if needed
      let returnValid = true;
      if (forms.travel.needsReturn) {
        // Check if return exists
        if (!forms.travel.return) return false;

        const returnRequiredFields = ['date', 'pickup', 'drop', 'luggage', 'type'];
        returnValid = returnRequiredFields.every((field) => forms.travel.return[field] !== '');
      }

      return outboundValid && returnValid;
    } else {
      // Old structure - fallback to original implementation
      const requiredFields = ['date', 'pickup', 'drop', 'luggage', 'type'];
      return requiredFields.every((field) => forms.travel[field] !== '');
    }
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
          Alert.alert(
            'Please fill all the required travel fields or activate at least one journey'
          );
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
          <PageHeader title="Booking Details" icon={icons.backArrow} />

          {renderBookingDetails()}

          <View className="w-full px-4">
            {!isAdhyayanInResearchCentre && (
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
                {booking !== types.ADHYAYAN_DETAILS_TYPE && (
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
            )}

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
