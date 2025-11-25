import { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { dropdowns, types } from '@/src/constants';
import { FontAwesome } from '@expo/vector-icons';
import { ShadowBox } from '@/src/components/ShadowBox';
import { prepareMumukshuRequestBody } from '@/src/utils/preparingRequestBody';
import { useAuthStore, useBookingStore } from '@/src/stores';
import PageHeader from '@/src/components/PageHeader';
import CustomButton from '@/src/components/CustomButton';
import MumukshuRoomBookingDetails from '@/src/components/booking details cards/MumukshuRoomBookingDetails';
import MumukshuAdhyayanBookingDetails from '@/src/components/booking details cards/MumukshuAdhyayanBookingDetails';
import MumukshuTravelBookingDetails from '@/src/components/booking details cards/MumukshuTravelBookingDetails';
import MumukshuEventBookingDetails from '@/src/components/booking details cards/MumukshuEventBookingDetails';
import MumukshuFlatBookingDetails from '@/src/components/booking details cards/MumukshuFlatBookingDetails';
import MumukshuRoomAddon from '@/src/components/booking addons/MumukshuRoomAddon';
import MumukshuFoodAddon from '@/src/components/booking addons/MumukshuFoodAddon';
import MumukshuAdhyayanAddon from '@/src/components/booking addons/MumukshuAdhyayanAddon';
import MumukshuTravelAddon from '@/src/components/booking addons/MumukshuTravelAddon';
import handleAPICall from '@/src/utils/HandleApiCall';
import CustomModal from '@/src/components/CustomModal';
import CustomAlert from '@/src/components/CustomAlert';
import Callout from '@/src/components/Callout';

const MumukshuAddons = () => {
  const router = useRouter();
  const { booking } = useLocalSearchParams();

  const user = useAuthStore((state) => state.user);
  const mumukshuData = useBookingStore((state) => state.mumukshuData);
  const setMumukshuData = useBookingStore((state) => state.setMumukshuData);

  const [addonOpen, setAddonOpen] = useState({
    room: false,
    food: false,
    travel: false,
  });

  // Get shared date information from all booking types
  const getInitialDates = useMemo(() => {
    // Find the first available date from any existing booking
    const startDate =
      mumukshuData.room?.startDay ||
      mumukshuData.food?.startDay ||
      mumukshuData.adhyayan?.adhyayan?.start_date ||
      mumukshuData.travel?.date ||
      mumukshuData.utsav?.utsav?.utsav_start ||
      '';

    const endDate =
      mumukshuData.room?.endDay ||
      mumukshuData.food?.endDay ||
      mumukshuData.adhyayan?.adhyayan?.end_date ||
      mumukshuData.utsav?.utsav?.utsav_end ||
      '';

    return { startDate, endDate };
  }, [mumukshuData]);

  // Get mumukshus from all possible sources
  const mumukshus = useMemo(() => {
    const fromRoom =
      mumukshuData.room?.mumukshuGroup?.flatMap((group: any) => group.mumukshus || []) || [];
    const fromFood =
      mumukshuData.food?.mumukshuGroup?.flatMap((group: any) => group.mumukshus || []) || [];
    const fromAdhyayan = mumukshuData.adhyayan?.mumukshuGroup || [];
    const fromTravel =
      mumukshuData.travel?.mumukshuGroup?.flatMap((group: any) => group.mumukshus || []) || [];
    const fromUtsav = mumukshuData.utsav?.mumukshus || [];
    const fromFlat = mumukshuData.flat?.mumukshuGroup || [];

    // Use the non-empty array, prioritizing the primary booking type based on the current page
    let result = [];

    if (booking === types.ROOM_DETAILS_TYPE && fromRoom.length > 0) {
      result = fromRoom;
    } else if (booking === types.ADHYAYAN_DETAILS_TYPE && fromAdhyayan.length > 0) {
      result = fromAdhyayan;
    } else if (booking === types.TRAVEL_DETAILS_TYPE && fromTravel.length > 0) {
      result = fromTravel;
    } else if (booking === types.EVENT_DETAILS_TYPE && fromUtsav.length > 0) {
      result = fromUtsav;
    } else if (booking === types.FLAT_DETAILS_TYPE && fromFlat.length > 0) {
      result = fromFlat;
    } else {
      // Use the first non-empty array
      result =
        fromRoom.length > 0
          ? fromRoom
          : fromAdhyayan.length > 0
            ? fromAdhyayan
            : fromTravel.length > 0
              ? fromTravel
              : fromFood.length > 0
                ? fromFood
                : fromUtsav.length > 0
                  ? fromUtsav
                  : fromFlat.length > 0
                    ? fromFlat
                    : [];
    }

    return result;
  }, [booking, mumukshuData]);

  // Create dropdown options for mumukshus
  const mumukshu_dropdown = useMemo(() => {
    return mumukshus.map((mumukshu: any, index: any) => ({
      key: `${index}`,
      value: mumukshu.issuedto,
    }));
  }, [mumukshus]);

  // Define initial form structures with factory functions for better reuse
  const createInitialRoomForm = (existingData: any = null) => ({
    startDay: getInitialDates?.startDate || '',
    endDay: getInitialDates?.endDate || '',
    mumukshuGroup: existingData?.mumukshuGroup || [
      {
        roomType: dropdowns.ROOM_TYPE_LIST[0].key,
        floorType: dropdowns.FLOOR_TYPE_LIST[0].key,
        mumukshus: [],
        mumukshuIndices: [],
      },
    ],
  });

  const createInitialFoodForm = (existingData: any = null) => ({
    startDay: getInitialDates?.startDate || '',
    endDay: getInitialDates?.endDate || '',
    mumukshuGroup: existingData?.mumukshuGroup || [
      {
        meals: ['breakfast', 'lunch', 'dinner'],
        spicy: dropdowns.SPICE_LIST[0].key,
        hightea: dropdowns.HIGHTEA_LIST[0].key,
        mumukshus: existingData?.mumukshuGroup?.[0]?.mumukshus || [],
        mumukshuIndices: existingData?.mumukshuGroup?.[0]?.mumukshuIndices || [],
      },
    ],
  });

  const createInitialAdhyayanForm = (existingData: any = null) => ({
    adhyayan: existingData?.adhyayan || {},
    mumukshus: existingData?.mumukshus || [],
    mumukshuIndices: existingData?.mumukshuIndices || [],
  });

  const createInitialTravelForm = (existingData: any = null) => ({
    date: getInitialDates?.startDate || '',
    mumukshuGroup: existingData?.mumukshuGroup || [
      {
        pickup: '',
        drop: '',
        luggage: [],
        type: dropdowns.BOOKING_TYPE_LIST[0].value,
        adhyayan: dropdowns.TRAVEL_ADHYAYAN_ASK_LIST[1].value,
        arrival_time: '',
        special_request: '',
        total_people: null,
        mumukshus: [],
        mumukshuIndices: [],
      },
    ],
  });

  // Initialize form states with existing data and cross-referenced dates
  const [roomForm, setRoomForm] = useState(() => createInitialRoomForm(mumukshuData.room));
  const [foodForm, setFoodForm] = useState(() => createInitialFoodForm(mumukshuData.food));
  const [adhyayanForm, setAdhyayanForm] = useState(() =>
    createInitialAdhyayanForm(mumukshuData.adhyayan)
  );
  const [travelForm, setTravelForm] = useState(() => createInitialTravelForm(mumukshuData.travel));

  // Update forms when context data changes (for proper prefilling)
  useEffect(() => {
    // Get latest dates from any booking type
    const startDate =
      mumukshuData.room?.startDay ||
      mumukshuData.food?.startDay ||
      mumukshuData.adhyayan?.adhyayan?.start_date ||
      mumukshuData.travel?.date ||
      mumukshuData.utsav?.utsav_start ||
      '';

    const endDate =
      mumukshuData.room?.endDay ||
      mumukshuData.food?.endDay ||
      mumukshuData.adhyayan?.adhyayan?.end_date ||
      mumukshuData.travel?.date ||
      mumukshuData.utsav?.utsav_end ||
      '';

    // Update room form with cross-referenced dates
    if (mumukshuData.room) {
      setRoomForm((prev) => ({
        ...createInitialRoomForm(mumukshuData.room),
        startDay: mumukshuData.room.startDay || startDate,
        endDay: mumukshuData.room.endDay || endDate,
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
    if (mumukshuData.food) {
      setFoodForm((prev) => ({
        ...createInitialFoodForm(mumukshuData.food),
        startDay: mumukshuData.food.startDay || startDate,
        endDay: mumukshuData.food.endDay || endDate,
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
    if (mumukshuData.adhyayan) {
      setAdhyayanForm(createInitialAdhyayanForm(mumukshuData.adhyayan));
    }

    // Update travel form with cross-referenced date
    if (mumukshuData.travel) {
      setTravelForm((prev) => ({
        ...createInitialTravelForm(mumukshuData.travel),
        date: mumukshuData.travel.date || startDate,
      }));
    } else if (startDate) {
      // If travel data doesn't exist but we have date from other bookings
      setTravelForm((prev) => ({
        ...prev,
        date: prev.date || startDate,
      }));
    }
  }, [mumukshuData]);

  // Date picker visibility state
  const [isDatePickerVisible, setDatePickerVisibility] = useState({
    checkin: false,
    checkout: false,
    foodStart: false,
    foodEnd: false,
    travel: false,
    travel_time: false,
  });

  const toggleAddon = useCallback((addonType: any, isOpen: any) => {
    setAddonOpen((prev) => ({ ...prev, [addonType]: isOpen }));
  }, []);

  // Toggle date picker visibility
  const toggleDatePicker = useCallback((pickerType: any, isVisible: any) => {
    setDatePickerVisibility((prev) => ({ ...prev, [pickerType]: isVisible }));
  }, []);

  // API validation state and handler
  const transformedData = useMemo(() => {
    return prepareMumukshuRequestBody(user, mumukshuData);
  }, [user, mumukshuData]);

  const fetchValidation = useCallback(async () => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'POST',
        '/mumukshu/validate',
        null,
        transformedData,
        (res: any) => {
          setMumukshuData((prev: any) => ({ ...prev, validationData: res.data }));
          resolve(res.data);
        },
        () => {},
        (errorDetails) => {
          reject(new Error(errorDetails.message));
        }
      );
    });
  }, [transformedData, setMumukshuData]);

  const {
    isLoading: isValidationDataLoading,
    isError: isValidationDataError,
    error: validationDataError,
    data: validationData,
    refetch: refetchValidation,
  } = useQuery({
    queryKey: ['mumukshuValidations', user.cardno, JSON.stringify(mumukshuData)],
    queryFn: fetchValidation,
    retry: false,
    enabled: !!user.cardno && Object.keys(mumukshuData).length > 0,
  });

  // Force refetch validation when screen comes into focus and clean up addons
  useFocusEffect(
    useCallback(() => {
      if (user.cardno) {
        // Clean up addon data when coming back from mumukshu booking confirmation
        // Only keep the main booking data based on the booking type
        setMumukshuData((prev: any) => {
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
          if (booking !== types.TRAVEL_DETAILS_TYPE) {
            delete cleanedData.travel;
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
    }, [user.cardno, refetchValidation, booking, setMumukshuData])
  );

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Room form handlers
  const resetRoomForm = useCallback(() => {
    setRoomForm(createInitialRoomForm());
    setMumukshuData((prev: any) => {
      const { room, ...rest } = prev;
      return rest;
    });
  }, [setMumukshuData]);

  const addRoomForm = useCallback(() => {
    setRoomForm((prevRoomForm) => ({
      ...prevRoomForm,
      mumukshuGroup: [
        ...prevRoomForm.mumukshuGroup,
        { roomType: '', floorType: '', mumukshus: [], mumukshuIndices: [] },
      ],
    }));
  }, []);

  const removeRoomForm = useCallback((indexToRemove: any) => {
    return () => {
      setRoomForm((prevRoomForm) => {
        const updatedMumukshuGroup = [...prevRoomForm.mumukshuGroup];
        updatedMumukshuGroup.splice(indexToRemove, 1);
        return {
          ...prevRoomForm,
          mumukshuGroup: updatedMumukshuGroup,
        };
      });
    };
  }, []);

  const updateRoomForm = useCallback(
    (groupIndex: any, key: any, value: any) => {
      setRoomForm((prevRoomForm) => {
        const updatedMumukshuGroup = [...prevRoomForm.mumukshuGroup];

        if (key === 'mumukshus') {
          updatedMumukshuGroup[groupIndex].mumukshuIndices = value;
          updatedMumukshuGroup[groupIndex].mumukshus = mumukshus.filter((_: any, i: any) =>
            value.includes(i.toString())
          );
        } else {
          updatedMumukshuGroup[groupIndex][key] = value;
        }

        return {
          ...prevRoomForm,
          mumukshuGroup: updatedMumukshuGroup,
        };
      });
    },
    [mumukshus]
  );

  // Food form handlers
  const resetFoodForm = useCallback(() => {
    setFoodForm(createInitialFoodForm());
    setMumukshuData((prev: any) => {
      const { food, ...rest } = prev;
      return rest;
    });
  }, [setMumukshuData]);

  const addFoodForm = useCallback(() => {
    setFoodForm((prevFoodForm) => ({
      ...prevFoodForm,
      mumukshuGroup: [
        ...prevFoodForm.mumukshuGroup,
        {
          meals: ['breakfast', 'lunch', 'dinner'],
          spicy: dropdowns.SPICE_LIST[0].key,
          hightea: dropdowns.HIGHTEA_LIST[0].key,
          mumukshus: [],
          mumukshuIndices: [],
        },
      ],
    }));
  }, []);

  const removeFoodForm = useCallback((indexToRemove: any) => {
    return () => {
      setFoodForm((prevFoodForm) => {
        const updatedMumukshuGroup = [...prevFoodForm.mumukshuGroup];
        updatedMumukshuGroup.splice(indexToRemove, 1);
        return {
          ...prevFoodForm,
          mumukshuGroup: updatedMumukshuGroup,
        };
      });
    };
  }, []);

  const updateFoodForm = useCallback(
    (groupIndex: any, key: any, value: any) => {
      setFoodForm((prevFoodForm) => {
        const updatedMumukshuGroup = [...prevFoodForm.mumukshuGroup];

        if (key === 'mumukshus') {
          updatedMumukshuGroup[groupIndex].mumukshuIndices = value;
          updatedMumukshuGroup[groupIndex].mumukshus = mumukshus.filter((_: any, i: any) =>
            value.includes(i.toString())
          );
        } else {
          updatedMumukshuGroup[groupIndex][key] = value;
        }

        return {
          ...prevFoodForm,
          mumukshuGroup: updatedMumukshuGroup,
        };
      });
    },
    [mumukshus]
  );

  // Travel form handlers
  const resetTravelForm = useCallback(() => {
    setTravelForm(createInitialTravelForm());
    setMumukshuData((prev: any) => {
      const { travel, ...rest } = prev;
      return rest;
    });
  }, [setMumukshuData]);

  const addTravelForm = useCallback(() => {
    setTravelForm((prevTravelForm) => ({
      ...prevTravelForm,
      mumukshuGroup: [
        ...prevTravelForm.mumukshuGroup,
        {
          pickup: '',
          drop: '',
          arrival_time: '',
          luggage: [],
          adhyayan: dropdowns.TRAVEL_ADHYAYAN_ASK_LIST[1].value,
          type: dropdowns.BOOKING_TYPE_LIST[0].value,
          total_people: null,
          special_request: '',
          mumukshus: [],
          mumukshuIndices: [],
        },
      ],
    }));
  }, []);

  const removeTravelForm = useCallback((indexToRemove: any) => {
    return () => {
      setTravelForm((prevTravelForm) => {
        const updatedMumukshuGroup = [...prevTravelForm.mumukshuGroup];
        updatedMumukshuGroup.splice(indexToRemove, 1);
        return {
          ...prevTravelForm,
          mumukshuGroup: updatedMumukshuGroup,
        };
      });
    };
  }, []);

  const updateTravelForm = useCallback(
    (groupIndex: any, key: any, value: any) => {
      setTravelForm((prevTravelForm) => {
        const updatedMumukshuGroup = [...prevTravelForm.mumukshuGroup];

        if (key === 'mumukshus') {
          updatedMumukshuGroup[groupIndex].mumukshuIndices = value;
          updatedMumukshuGroup[groupIndex].mumukshus = mumukshus.filter((_: any, i: any) =>
            value.includes(i.toString())
          );
        } else {
          updatedMumukshuGroup[groupIndex][key] = value;
        }

        return {
          ...prevTravelForm,
          mumukshuGroup: updatedMumukshuGroup,
        };
      });
    },
    [mumukshus]
  );

  // Adhyayan form handler
  const updateAdhyayanForm = useCallback(
    (field: any, value: any) => {
      setAdhyayanForm((prevAdhyayanForm) => ({
        ...prevAdhyayanForm,
        [field]: value,
        ...(field === 'mumukshuIndices' && {
          mumukshus: mumukshus.filter((_: any, i: any) => value.includes(i.toString())),
        }),
      }));
    },
    [mumukshus]
  );

  // Form validation handlers
  const validateRoomForm = useCallback(() => {
    const hasEmptyFields = roomForm.mumukshuGroup.some(
      (group: any) => !group.roomType || !group.floorType || group.mumukshus.length === 0
    );
    return !hasEmptyFields && roomForm.startDay && roomForm.endDay;
  }, [roomForm]);

  const validateFoodForm = useCallback(() => {
    const hasEmptyFields = foodForm.mumukshuGroup.some(
      (group: any) => group.meals.length === 0 || group.mumukshus.length === 0 || group.spicy === ''
    );
    return !hasEmptyFields && foodForm.startDay && foodForm.endDay;
  }, [foodForm]);

  const validateAdhyayanForm = useCallback(() => {
    return Object.keys(adhyayanForm.adhyayan).length !== 0 && adhyayanForm.mumukshus.length !== 0;
  }, [adhyayanForm]);

  const validateTravelForm = useCallback(() => {
    const otherLocation = dropdowns.LOCATION_LIST.find((loc) => loc.key === 'other');
    const hasEmptyFields = travelForm.mumukshuGroup.some(
      (group: any) =>
        !group.pickup ||
        !group.drop ||
        group.mumukshus.length === 0 ||
        group.luggage.length === 0 ||
        (group.pickup === otherLocation?.value && group.special_request.trim() === '') ||
        (group.drop === otherLocation?.value && group.special_request.trim() === '') ||
        (group.pickup == 'Research Centre' && group.drop == 'Research Centre') ||
        (group.pickup != 'Research Centre' && group.drop != 'Research Centre') ||
        (group.type == dropdowns.BOOKING_TYPE_LIST[1].value && !group.total_people)
    );
    return !hasEmptyFields && travelForm.date;
  }, [travelForm]);

  // Form content check handlers (to see if user has started filling them)
  const isRoomFormEmpty = useCallback(() => {
    return roomForm.mumukshuGroup.some(
      (group: any) => group.roomType !== '' || group.floorType !== '' || group.mumukshus.length > 0
    );
  }, [roomForm]);

  const isFoodFormEmpty = useCallback(() => {
    return foodForm.mumukshuGroup.some(
      (group: any) => group.meals.length > 0 || group.spicy !== '' || group.mumukshus.length > 0
    );
  }, [foodForm]);

  const isAdhyayanFormEmpty = useCallback(() => {
    return Object.keys(adhyayanForm.adhyayan).length > 0 || adhyayanForm.mumukshus.length > 0;
  }, [adhyayanForm]);

  const isTravelFormEmpty = useCallback(() => {
    return travelForm.mumukshuGroup.some(
      (group: any) =>
        group.pickup !== '' ||
        group.drop !== '' ||
        group.luggage.length == 0 ||
        group.mumukshus.length > 0
    );
  }, [travelForm]);

  // Form submission handler
  const handleSubmit = useCallback(() => {
    setIsSubmitting(true);
    let hasValidationError = false;

    try {
      // Validate and set Room Form data
      if (booking !== types.ROOM_DETAILS_TYPE && addonOpen.room) {
        if (!validateRoomForm()) {
          CustomAlert.alert('Please fill all the room booking fields');
          hasValidationError = true;
          return;
        }
        setMumukshuData((prev: any) => ({ ...prev, room: roomForm }));
      }

      // Validate and set Food Form data
      if (addonOpen.food) {
        if (!validateFoodForm()) {
          CustomAlert.alert('Please fill all the food booking fields');
          hasValidationError = true;
          return;
        }
        setMumukshuData((prev: any) => ({ ...prev, food: foodForm }));
      }

      // Validate and set Adhyayan Form data
      if (booking !== types.ADHYAYAN_DETAILS_TYPE && isAdhyayanFormEmpty()) {
        if (!validateAdhyayanForm()) {
          CustomAlert.alert('Please fill all the adhyayan booking fields');
          hasValidationError = true;
          return;
        }
        setMumukshuData((prev: any) => ({ ...prev, adhyayan: adhyayanForm }));
      }

      // Validate and set Travel Form data
      if (booking !== types.TRAVEL_DETAILS_TYPE && addonOpen.travel) {
        if (!validateTravelForm()) {
          CustomAlert.alert('Please fill all travel fields');
          hasValidationError = true;
          return;
        }
        setMumukshuData((prev: any) => ({ ...prev, travel: travelForm }));
      }

      // If no validation errors, navigate to confirmation page
      if (!hasValidationError) {
        router.push('/mumukshuBooking/bookingReview');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    booking,
    isRoomFormEmpty,
    isFoodFormEmpty,
    isAdhyayanFormEmpty,
    isTravelFormEmpty,
    validateRoomForm,
    validateFoodForm,
    validateAdhyayanForm,
    validateTravelForm,
    roomForm,
    foodForm,
    adhyayanForm,
    travelForm,
    setMumukshuData,
    router,
  ]);

  // Handle validation error modal close
  const handleCloseValidationModal = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView className="h-full bg-white" edges={['right', 'top', 'left']}>
      <KeyboardAwareScrollView
        bottomOffset={62}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled">
        <PageHeader title="Booking Details" />

        {booking === types.ROOM_DETAILS_TYPE && (
          <MumukshuRoomBookingDetails containerStyles="mt-2" />
        )}
        {booking === types.ADHYAYAN_DETAILS_TYPE && (
          <MumukshuAdhyayanBookingDetails containerStyles="mt-2" />
        )}
        {booking === types.TRAVEL_DETAILS_TYPE && (
          <MumukshuTravelBookingDetails containerStyles="mt-2" />
        )}
        {booking === types.EVENT_DETAILS_TYPE && (
          <MumukshuEventBookingDetails containerStyles="mt-2" />
        )}
        {booking === types.FLAT_DETAILS_TYPE && (
          <MumukshuFlatBookingDetails containerStyles="mt-2" />
        )}

        {booking === types.EVENT_DETAILS_TYPE ? (
          <Callout
            variant="warning"
            message="For Early Arrival or Late Departure during events please book your stay, food and travel through add-ons below."
            overrideStyle="m-4"
          />
        ) : (
          <View className="mt-4" />
        )}

        <View className="w-full px-4">
          <Text className="mb-2 font-psemibold text-xl text-secondary">Add Ons</Text>

          {/* MUMUKSHU ROOM BOOKING COMPONENT */}
          {![types.ROOM_DETAILS_TYPE, types.FLAT_DETAILS_TYPE].includes(booking as string) && (
            <MumukshuRoomAddon
              roomForm={roomForm}
              setRoomForm={setRoomForm}
              addRoomForm={addRoomForm}
              reomveRoomForm={removeRoomForm}
              updateRoomForm={updateRoomForm}
              resetRoomForm={resetRoomForm}
              mumukshu_dropdown={mumukshu_dropdown}
              isDatePickerVisible={isDatePickerVisible}
              setDatePickerVisibility={toggleDatePicker}
              onToggle={(isOpen) => toggleAddon('room', isOpen)}
            />
          )}

          {/* MUMUKSHU FOOD BOOKING COMPONENT */}
          <MumukshuFoodAddon
            foodForm={foodForm}
            setFoodForm={setFoodForm}
            addFoodForm={addFoodForm}
            resetFoodForm={resetFoodForm}
            reomveFoodForm={removeFoodForm}
            updateFoodForm={updateFoodForm}
            mumukshu_dropdown={mumukshu_dropdown}
            isDatePickerVisible={isDatePickerVisible}
            setDatePickerVisibility={toggleDatePicker}
            onToggle={(isOpen) => toggleAddon('food', isOpen)}
          />

          {/* MUMUKSHU ADHYAYAN BOOKING COMPONENT */}
          {!(booking === types.ADHYAYAN_DETAILS_TYPE || booking === types.EVENT_DETAILS_TYPE) && (
            <MumukshuAdhyayanAddon
              adhyayanForm={adhyayanForm}
              setAdhyayanForm={setAdhyayanForm}
              updateAdhyayanForm={updateAdhyayanForm}
              INITIAL_ADHYAYAN_FORM={createInitialAdhyayanForm()}
              mumukshu_dropdown={mumukshu_dropdown}
            />
          )}

          {/* MUMUKSHU TRAVEL BOOKING COMPONENT */}
          {booking !== types.TRAVEL_DETAILS_TYPE && (
            <MumukshuTravelAddon
              travelForm={travelForm}
              setTravelForm={setTravelForm}
              addTravelForm={addTravelForm}
              updateTravelForm={updateTravelForm}
              resetTravelForm={resetTravelForm}
              removeTravelForm={removeTravelForm}
              mumukshu_dropdown={mumukshu_dropdown}
              isDatePickerVisible={isDatePickerVisible}
              setDatePickerVisibility={toggleDatePicker}
              onToggle={(isOpen) => toggleAddon('travel', isOpen)}
            />
          )}
        </View>
      </KeyboardAwareScrollView>

      <ShadowBox className="w-full border-t border-gray-200 bg-white px-4 py-4">
        <CustomButton
          text="Continue"
          handlePress={handleSubmit}
          containerStyles="min-h-[52px] mb-8"
          isLoading={isSubmitting}
        />
      </ShadowBox>

      {validationDataError && (
        <CustomModal
          visible={true}
          onClose={handleCloseValidationModal}
          message={validationDataError.message}
          btnText="Okay"
        />
      )}
    </SafeAreaView>
  );
};

export default MumukshuAddons;
