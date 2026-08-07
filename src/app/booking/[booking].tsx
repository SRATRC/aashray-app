import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import RoomAddon from '@/src/components/booking addons/RoomAddon';
import FoodAddon from '@/src/components/booking addons/FoodAddon';
import AdhyayanAddon from '@/src/components/booking addons/AdhyayanAddon';
import TravelAddon from '@/src/components/booking addons/TravelAddon';
import handleAPICall from '@/src/utils/HandleApiCall';
import CustomModal from '@/src/components/CustomModal';
import CustomAlert from '@/src/components/CustomAlert';
import Callout from '@/src/components/Callout';
import CustomButton from '@/src/components/CustomButton';
import PageHeader from '@/src/components/PageHeader';
import SectionHeader from '@/src/components/booking/shared/SectionHeader';
import { ShadowBox } from '@/src/components/ShadowBox';
import BookingSummary from '@/src/components/booking/shared/BookingSummary';
import StayOutcomeBlock from '@/src/components/stay/StayOutcomeBlock';
import { useStayOutcome } from '@/src/components/stay/useStayOutcome';
import { dropdowns, types } from '@/src/constants';
import { useAuthStore, useBookingStore } from '@/src/stores';
import { prepareMumukshuRequestBody } from '@/src/utils/preparingRequestBody';

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

  // The verdict for these dates, per person and per segment. Shown here — above
  // the add-ons — so nobody fills in food and travel only to learn on the
  // payment screen that their stay is waitlisted.
  const stayOutcome = useStayOutcome('self');
  const [extraStayReason, setExtraStayReason] = useState(
    () => mumukshuData?.room?.extra_stay_reason || mumukshuData?.flat?.extra_stay_reason || ''
  );
  const [showReasonError, setShowReasonError] = useState(false);

  const reasonMissing = Boolean(stayOutcome?.requiresExtraStayReason && !extraStayReason.trim());
  const cannotBookHere = Boolean(
    stayOutcome?.segments.some((seg) => seg.groups.some((g) => g.verdict === 'unavailable'))
  );

  // Extract initial dates from context data with memoization
  const initialDates = useMemo(() => {
    const startDate =
      mumukshuData.room?.startDay ||
      mumukshuData.travel?.date ||
      (mumukshuData.adhyayan && mumukshuData.adhyayan.adhyayan?.start_date) ||
      mumukshuData.flat?.startDay ||
      mumukshuData.utsav?.utsav?.utsav_start ||
      '';

    const endDate =
      mumukshuData.room?.endDay ||
      (mumukshuData.adhyayan && mumukshuData.adhyayan.adhyayan?.end_date) ||
      mumukshuData.flat?.endDay ||
      mumukshuData.utsav?.utsav?.utsav_end ||
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

  useFocusEffect(
    useCallback(() => {
      if (!user?.cardno) return;

      // Runs on entry, not on a timer. The old version deferred this by 100ms
      // and cancelled a timeout id captured from an earlier render, so the real
      // timeout outlived the screen and wiped add-ons that Continue had just
      // written — an add-on chosen on a second visit vanished from the charges.
      setMumukshuData((prev: any) => {
        const cleanedData = { ...prev };

        // Drop anything that is not this screen's own booking. Whatever the
        // member picks here is written back by Continue.
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
        // Food is bookable on its own, so on its own screen it is the booking.
        if (booking !== types.FOOD_DETAILS_TYPE) {
          delete cleanedData.food;
        }

        return cleanedData;
      });

      if (!isValidating) {
        refetchValidation();
      }
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

    if (cannotBookHere) return;
    if (reasonMissing) {
      setShowReasonError(true);
      return;
    }

    setIsSubmitting(true);
    let hasValidationError = false;

    // Carry the reason forward on the booking itself, so the review screen shows
    // the same text and the waitlisted booking is submitted with it.
    if (extraStayReason.trim()) {
      const reasonText = extraStayReason.trim();
      setMumukshuData((prev: any) => ({
        ...prev,
        ...(prev.room ? { room: { ...prev.room, extra_stay_reason: reasonText } } : {}),
        ...(prev.flat ? { flat: { ...prev.flat, extra_stay_reason: reasonText } } : {}),
      }));
    }

    try {
      // Validate forms in batch and transform to mumukshu format when saving
      const validations: any[] = [];

      if (booking !== types.ROOM_DETAILS_TYPE && addonOpen.room) {
        if (!validateRoomForm()) {
          CustomAlert.alert('Please fill all the room fields');
          hasValidationError = true;
          return;
        }
        const mumukshuRoomData = transformToMumukshuFormat(user, forms.room, 'room');
        validations.push(['room', mumukshuRoomData]);
      }

      if (addonOpen.food) {
        if (!validateFoodForm()) {
          CustomAlert.alert('Please fill all the required food fields');
          hasValidationError = true;
          return;
        }
        const mumukshuFoodData = transformToMumukshuFormat(user, forms.food, 'food');
        validations.push(['food', mumukshuFoodData]);
      }

      if (booking !== types.TRAVEL_DETAILS_TYPE && addonOpen.travel) {
        if (!validateTravelForm()) {
          CustomAlert.alert('Please fill all the travel fields');
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
        router.push('/booking/bookingReview');
      }
    } catch (error) {
      console.error('Error during submission:', error);
      CustomAlert.alert('An error occurred. Please try again.');
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
    cannotBookHere,
    reasonMissing,
    extraStayReason,
  ]);

  const handleCloseValidationModal = useCallback(() => {
    // Reset validation state when closing modal
    setIsValidating(false);
    router.back();
  }, [router]);

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
    <SafeAreaView className="h-full bg-gray-50" edges={['right', 'top', 'left']}>
      <KeyboardAwareScrollView
        bottomOffset={62}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}>
        <PageHeader title="Booking Details" />

        {/* One gap between every section. Each block used to carry its own
            margin, and an empty view stood in for one of them. */}
        <View className="gap-y-6">
          {/* Same card component the review screen uses. There is one way to show
              a booking, so the two screens cannot drift apart. */}
          <BookingSummary
            data={mumukshuData}
            audience="self"
            validationData={mumukshuData?.validationData}
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
                reason={extraStayReason}
                onChangeReason={(text) => {
                  setExtraStayReason(text);
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
            {renderAddons()}
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
          handlePress={handleSubmit}
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

export default BookingDetails;
