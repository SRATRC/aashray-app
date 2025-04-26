import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dropdowns, icons, types } from '../../constants';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGlobalContext } from '../../context/GlobalProvider';
import { ScrollView } from 'react-native-gesture-handler';
import { prepareMumukshuRequestBody } from '~/utils/preparingRequestBody';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import CustomButton from '../../components/CustomButton';
import MumukshuRoomBookingDetails from '../../components/booking details cards/MumukshuRoomBookingDetails';
import MumukshuAdhyayanBookingDetails from '../../components/booking details cards/MumukshuAdhyayanBookingDetails';
import MumukshuTravelBookingDetails from '../../components/booking details cards/MumukshuTravelBookingDetails';
import MumukshuRoomAddon from '../../components/booking addons/MumukshuRoomAddon';
import MumukshuFoodAddon from '../../components/booking addons/MumukshuFoodAddon';
import MumukshuAdhyayanAddon from '../../components/booking addons/MumukshuAdhyayanAddon';
import MumukshuTravelAddon from '../../components/booking addons/MumukshuTravelAddon';
import Toast from 'react-native-toast-message';
import handleAPICall from '~/utils/HandleApiCall';
import CustomModal from '~/components/CustomModal';

const INITIAL_ROOM_FORM = {
  startDay: '',
  endDay: '',
  mumukshuGroup: [{ roomType: '', floorType: '', mumukshus: [], mumukshuIndices: [] }],
};

const INITIAL_FOOD_FORM = {
  startDay: '',
  endDay: '',
  mumukshuGroup: [
    {
      meals: [],
      spicy: '',
      hightea: dropdowns.HIGHTEA_LIST[2].key,
      mumukshus: [],
      mumukshuIndices: [],
    },
  ],
};

const INITIAL_ADHYAYAN_FORM = {
  adhyayan: {},
  mumukshus: [],
  mumukshuIndices: [],
};

const INITIAL_TRAVEL_FORM = {
  date: '',
  mumukshuGroup: [
    {
      pickup: '',
      drop: '',
      luggage: '',
      type: 'regular',
      adhyayan: 0,
      arrival_time: '',
      special_request: '',
      mumukshus: [],
      mumukshuIndices: [],
    },
  ],
};

const MumukshuAddons = () => {
  const router = useRouter();

  const { booking } = useLocalSearchParams();
  const { user, mumukshuData, setMumukshuData } = useGlobalContext();

  const transformedData = prepareMumukshuRequestBody(user, mumukshuData);
  const fetchValidation = async () => {
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
        (errorDetails: any) => {
          reject(new Error(errorDetails.message));
        }
      );
    });
  };

  const {
    isLoading: isValidationDataLoading,
    isError: isValidationDataError,
    error: validationDataError,
    data: validationData,
  }: any = useQuery({
    queryKey: ['mumukshuValidations', user.cardno],
    queryFn: fetchValidation,
    retry: false,
  });

  const mumukshus = (
    mumukshuData.room?.mumukshuGroup ||
    mumukshuData.adhyayan?.mumukshuGroup ||
    mumukshuData.travel?.mumukshuGroup ||
    []
  ).flatMap((group: any) => group.mumukshus || [group]);
  const mumukshu_dropdown = mumukshus.map((mumukshu: any, index: any) => ({
    value: `${index}`,
    label: mumukshu.issuedto,
  }));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState({
    checkin: false,
    checkout: false,
    foodStart: false,
    foodEnd: false,
    travel: false,
    travel_time: false,
  });

  // Room Addon Form Data
  const [roomForm, setRoomForm] = useState(JSON.parse(JSON.stringify(INITIAL_ROOM_FORM)));
  const resetRoomForm = () => {
    setRoomForm(JSON.parse(JSON.stringify(INITIAL_ROOM_FORM)));
    setMumukshuData((prev: any) => {
      const { room, ...rest } = prev;
      return rest;
    });
  };
  const addRoomForm = () => {
    setRoomForm((prevRoomForm: any) => ({
      ...prevRoomForm,
      mumukshuGroup: [
        ...prevRoomForm.mumukshuGroup,
        { roomType: '', floorType: '', mumukshus: [], mumukshuIndices: [] },
      ],
    }));
  };

  const reomveRoomForm = (indexToRemove: any) => {
    return () => {
      setRoomForm((prevRoomForm: any) => {
        const updatedMumukshuGroup = [...prevRoomForm.mumukshuGroup];
        updatedMumukshuGroup.splice(indexToRemove, 1);
        return {
          ...prevRoomForm,
          mumukshuGroup: updatedMumukshuGroup,
        };
      });
    };
  };

  const updateRoomForm = (groupIndex: any, key: any, value: any) => {
    setRoomForm((prevRoomForm: any) => {
      const updatedMumukshuGroup: any = [...prevRoomForm.mumukshuGroup];

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
  };

  // Food Addon Form Data
  const [foodForm, setFoodForm] = useState(JSON.parse(JSON.stringify(INITIAL_FOOD_FORM)));
  const resetFoodForm = () => {
    setFoodForm(JSON.parse(JSON.stringify(INITIAL_FOOD_FORM)));
    setMumukshuData((prev: any) => {
      const { food, ...rest } = prev;
      return rest;
    });
  };

  const addFoodForm = () => {
    setFoodForm((prevFoodForm: any) => ({
      ...prevFoodForm,
      mumukshuGroup: [
        ...prevFoodForm.mumukshuGroup,
        {
          meals: [],
          spicy: '',
          hightea: 'NONE',
          mumukshus: [],
          mumukshuIndices: [],
        },
      ],
    }));
  };

  const reomveFoodForm = (indexToRemove: any) => {
    return () => {
      setFoodForm((prevFoodForm: any) => {
        const updatedMumukshuGroup = [...prevFoodForm.mumukshuGroup];
        updatedMumukshuGroup.splice(indexToRemove, 1);
        return {
          ...prevFoodForm,
          mumukshuGroup: updatedMumukshuGroup,
        };
      });
    };
  };

  const updateFoodForm = (groupIndex: any, key: any, value: any) => {
    setFoodForm((prevFoodForm: any) => {
      const updatedMumukshuGroup: any = [...prevFoodForm.mumukshuGroup];

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
  };

  // Travel Booking Form Data
  const [travelForm, setTravelForm] = useState(JSON.parse(JSON.stringify(INITIAL_TRAVEL_FORM)));
  const resetTravelForm = () => {
    setTravelForm(JSON.parse(JSON.stringify(INITIAL_TRAVEL_FORM)));
    setMumukshuData((prev: any) => {
      const { travel, ...rest } = prev;
      return rest;
    });
  };

  const addTravelForm = () => {
    setTravelForm((prevTravelForm: any) => ({
      ...prevTravelForm,
      mumukshuGroup: [
        ...prevTravelForm.mumukshuGroup,
        {
          pickup: '',
          drop: '',
          arrival_time: '',
          luggage: '',
          adhyayan: 0,
          type: 'regular',
          special_request: '',
          mumukshus: [],
          mumukshuIndices: [],
        },
      ],
    }));
  };

  const reomveTravelForm = (indexToRemove: any) => {
    return () => {
      setTravelForm((prevTravelForm: any) => {
        const updatedMumukshuGroup = [...prevTravelForm.mumukshuGroup];
        updatedMumukshuGroup.splice(indexToRemove, 1);
        return {
          ...prevTravelForm,
          mumukshuGroup: updatedMumukshuGroup,
        };
      });
    };
  };

  const updateTravelForm = (groupIndex: any, key: any, value: any) => {
    setTravelForm((prevTravelForm: any) => {
      const updatedMumukshuGroup: any = [...prevTravelForm.mumukshuGroup];

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
  };

  // Adhyayan Booking Form Data
  const [adhyayanForm, setAdhyayanForm] = useState(
    JSON.parse(JSON.stringify(INITIAL_ADHYAYAN_FORM))
  );
  const updateAdhyayanForm = (field: any, value: any) => {
    setAdhyayanForm((prevAdhyayanForm: any) => ({
      ...prevAdhyayanForm,
      [field]: value,
      ...(field === 'mumukshuIndices' && {
        mumukshus: mumukshus.filter((_v: any, i: any) => {
          return value.includes(i.toString());
        }),
      }),
    }));
  };

  return (
    <SafeAreaView className="h-full bg-white" edges={['right', 'top', 'left']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}>
          <PageHeader title="Booking Details" icon={icons.backArrow} />

          {booking === types.ROOM_DETAILS_TYPE && (
            <MumukshuRoomBookingDetails containerStyles={'mt-2'} />
          )}
          {booking === types.ADHYAYAN_DETAILS_TYPE && (
            <MumukshuAdhyayanBookingDetails containerStyles={'mt-2'} />
          )}
          {booking === types.TRAVEL_DETAILS_TYPE && (
            <MumukshuTravelBookingDetails containerStyles={'mt-2'} />
          )}
          <View className="w-full px-4">
            {!(
              booking === types.ADHYAYAN_DETAILS_TYPE &&
              mumukshuData.adhyayan.adhyayan.location != 'Research Centre'
            ) && (
              <View>
                <Text className="mb-2 mt-4 font-psemibold text-xl text-secondary">Add Ons</Text>

                {/* MUMUKSHU ROOM BOOKING COMPONENT */}
                {booking !== types.ROOM_DETAILS_TYPE && (
                  <MumukshuRoomAddon
                    roomForm={roomForm}
                    setRoomForm={setRoomForm}
                    addRoomForm={addRoomForm}
                    reomveRoomForm={reomveRoomForm}
                    updateRoomForm={updateRoomForm}
                    resetRoomForm={resetRoomForm}
                    mumukshu_dropdown={mumukshu_dropdown}
                    isDatePickerVisible={isDatePickerVisible}
                    setDatePickerVisibility={setDatePickerVisibility}
                  />
                )}

                {/* MUMUKSHU FOOD BOOKING COMPONENT */}
                <MumukshuFoodAddon
                  foodForm={foodForm}
                  setFoodForm={setFoodForm}
                  addFoodForm={addFoodForm}
                  resetFoodForm={resetFoodForm}
                  reomveFoodForm={reomveFoodForm}
                  updateFoodForm={updateFoodForm}
                  mumukshu_dropdown={mumukshu_dropdown}
                  isDatePickerVisible={isDatePickerVisible}
                  setDatePickerVisibility={setDatePickerVisibility}
                />

                {/* MUMUKSHU ADHYAYAN BOOKING COMPONENT */}
                {booking !== types.ADHYAYAN_DETAILS_TYPE && (
                  <MumukshuAdhyayanAddon
                    adhyayanForm={adhyayanForm}
                    setAdhyayanForm={setAdhyayanForm}
                    updateAdhyayanForm={updateAdhyayanForm}
                    INITIAL_ADHYAYAN_FORM={INITIAL_ADHYAYAN_FORM}
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
                    removeTravelForm={reomveTravelForm}
                    mumukshu_dropdown={mumukshu_dropdown}
                    isDatePickerVisible={isDatePickerVisible}
                    setDatePickerVisibility={setDatePickerVisibility}
                  />
                )}
              </View>
            )}

            <CustomButton
              text="Confirm"
              handlePress={() => {
                setIsSubmitting(true);

                const isRoomFormEmpty = () => {
                  return roomForm.mumukshuGroup.some(
                    (group: any) =>
                      group.roomType !== '' || group.floorType !== '' || group.mumukshus.length > 0
                  );
                };

                const isFoodFormEmpty = () => {
                  return foodForm.mumukshuGroup.some(
                    (group: any) =>
                      group.meals.length > 0 || group.spicy !== '' || group.mumukshus.length > 0
                  );
                };

                const isAdhyayanFormEmpty = () => {
                  return (
                    Object.keys(adhyayanForm.adhyayan).length > 0 ||
                    adhyayanForm.mumukshus.length > 0
                  );
                };

                const isTravelFormEmpty = () => {
                  return travelForm.mumukshuGroup.some(
                    (group: any) =>
                      group.pickup !== '' ||
                      group.drop !== '' ||
                      group.luggage !== '' ||
                      group.mumukshus.length === 0
                  );
                };

                // Validate and set Room Form data
                if (booking !== types.ROOM_DETAILS_TYPE && isRoomFormEmpty()) {
                  const hasEmptyFields = roomForm.mumukshuGroup.some(
                    (group: any) =>
                      !group.roomType || !group.floorType || group.mumukshus.length === 0
                  );

                  if (hasEmptyFields || !roomForm.startDay || !roomForm.endDay) {
                    Toast.show({
                      type: 'error',
                      text1: 'Please fill all the room booking fields',
                      text2: '',
                      swipeable: false,
                    });
                    setIsSubmitting(false);
                    return;
                  }
                  setMumukshuData((prev: any) => ({ ...prev, room: roomForm }));
                }

                // Validate and set Food Form data
                if (
                  isFoodFormEmpty() &&
                  JSON.stringify(foodForm) !== JSON.stringify(INITIAL_FOOD_FORM)
                ) {
                  const hasEmptyFields = foodForm.mumukshuGroup.some((group: any) => {
                    return (
                      group.meals.length === 0 || group.mumukshus.length === 0 || group.spicy === ''
                    );
                  });

                  if (hasEmptyFields || !foodForm.startDay || !foodForm.endDay) {
                    Toast.show({
                      type: 'error',
                      text1: 'Please fill all the food booking fields',
                      text2: '',
                      swipeable: false,
                    });
                    setIsSubmitting(false);
                    return;
                  }
                  setMumukshuData((prev: any) => ({ ...prev, food: foodForm }));
                }

                // Validate and set Adhyayan Form data
                if (booking !== types.ADHYAYAN_DETAILS_TYPE && isAdhyayanFormEmpty()) {
                  if (
                    Object.keys(adhyayanForm.adhyayan).length === 0 ||
                    adhyayanForm.mumukshus.length === 0
                  ) {
                    Toast.show({
                      type: 'error',
                      text1: 'Please fill all the adhyayan booking fields',
                      text2: '',
                      swipeable: false,
                    });
                    setIsSubmitting(false);
                    return;
                  }
                  setMumukshuData((prev: any) => ({
                    ...prev,
                    adhyayan: adhyayanForm,
                  }));
                }

                // Validate and set Travel Form data
                if (
                  booking !== types.TRAVEL_DETAILS_TYPE &&
                  isTravelFormEmpty() &&
                  JSON.stringify(travelForm) !== JSON.stringify(INITIAL_TRAVEL_FORM)
                ) {
                  const hasEmptyFields = travelForm.mumukshuGroup.some(
                    (group: any) =>
                      group.pickup == '' ||
                      group.drop == '' ||
                      group.luggage == '' ||
                      group.mumukshus.length == 0
                  );

                  if (hasEmptyFields || !travelForm.date) {
                    Toast.show({
                      type: 'error',
                      text1: 'Please fill all travel the fields',
                      swipeable: false,
                    });
                    setIsSubmitting(false);
                    return;
                  }

                  setMumukshuData((prev: any) => ({ ...prev, travel: travelForm }));
                }
                setIsSubmitting(false);
                router.push('/mumukshuBooking/mumukshuBookingConfirmation');
              }}
              containerStyles="mb-8 min-h-[62px]"
              isLoading={isSubmitting}
            />
          </View>

          {validationDataError && !mumukshuData.dismissedValidationError && (
            <CustomModal
              visible={true}
              onClose={() => router.back()}
              message={validationDataError.message}
              btnText={'Okay'}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default MumukshuAddons;
