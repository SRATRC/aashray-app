import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useGlobalContext } from '../../context/GlobalProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { icons, types } from '../../constants';
import { useQuery } from '@tanstack/react-query';
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

const details = () => {
  const { booking } = useLocalSearchParams();
  const { user, data, setData } = useGlobalContext();

  const router = useRouter();

  const payload = prepareSelfRequestBody(user, data);

  const fetchValidation = async () => {
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
        (errorDetails: any) => reject(new Error(errorDetails.message))
      );
    });
  };

  const {
    isLoading: isValidationDataLoading,
    isError: isValidationDataError,
    error: validationDataError,
    data: validationData,
  }: any = useQuery({
    queryKey: ['validations', user.cardno],
    queryFn: fetchValidation,
    retry: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // FOOD BOOKING VAIABLESs
  const [foodForm, setFoodForm] = useState({
    startDay: '',
    endDay: '',
    spicy: '',
    hightea: 'NONE',
  });

  const [meals, setMeals] = useState([]);

  // ROOM BOOKING VARIABLES
  const [roomForm, setRoomForm] = useState({
    startDay: '',
    endDay: '',
    roomType: '',
    floorType: '',
  });

  const [isDatePickerVisible, setDatePickerVisibility] = useState({
    checkin: false,
    checkout: false,
    foodStart: false,
    foodEnd: false,
    travel: false,
  });

  // TRAVEL BOOKING VARIABLES
  const [travelForm, setTravelForm] = useState({
    date: '',
    pickup: '',
    drop: '',
    luggage: '',
    type: 'regular',
    special_request: '',
  });

  // ADHYAYAN BOOKING VARIABLES
  const [adhyayanBookingList, setAdhyayanBookingList] = useState([]);

  return (
    <SafeAreaView className="h-full bg-white" edges={['right', 'top', 'left']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}>
          <PageHeader title="Booking Details" icon={icons.backArrow} />

          {booking === types.ROOM_DETAILS_TYPE && <RoomBookingDetails containerStyles={'mt-2'} />}
          {booking === types.ADHYAYAN_DETAILS_TYPE && (
            <AdhyayanBookingDetails containerStyles={'mt-2'} />
          )}
          {booking === types.TRAVEL_DETAILS_TYPE && (
            <TravelBookingDetails containerStyles={'mt-2'} />
          )}

          <View className="w-full px-4">
            <Text className="mb-2 mt-4 font-psemibold text-xl text-secondary">Add Ons</Text>

            {/* ROOM BOOKING COMPONENT */}
            {booking !== types.ROOM_DETAILS_TYPE && (
              <RoomAddon
                roomForm={roomForm}
                setRoomForm={setRoomForm}
                isDatePickerVisible={isDatePickerVisible}
                setDatePickerVisibility={setDatePickerVisibility}
              />
            )}

            {/* FOOD BOOKING COMPONENT */}
            <FoodAddon
              foodForm={foodForm}
              setFoodForm={setFoodForm}
              setMeals={setMeals}
              isDatePickerVisible={isDatePickerVisible}
              setDatePickerVisibility={setDatePickerVisibility}
            />

            {/* ADHYAYAN BOOKING COMPONENT */}
            {booking !== types.ADHYAYAN_DETAILS_TYPE && (
              <AdhyayanAddon
                adhyayanBookingList={adhyayanBookingList}
                setAdhyayanBookingList={setAdhyayanBookingList}
                booking={booking}
              />
            )}

            {/* TRAVEL BOOKING COMPONENT */}
            {booking !== types.TRAVEL_DETAILS_TYPE && (
              <TravelAddon
                travelForm={travelForm}
                setTravelForm={setTravelForm}
                isDatePickerVisible={isDatePickerVisible}
                setDatePickerVisibility={setDatePickerVisibility}
              />
            )}

            <CustomButton
              text="Confirm"
              handlePress={() => {
                setIsSubmitting(true);

                const isRoomFormEmpty = () => {
                  return Object.values(roomForm).some((value) => value != '');
                };

                const isFoodFormEmpty = () => {
                  const excludedKey = 'hightea';
                  return (
                    Object.entries(foodForm)
                      .filter(([key]) => key !== excludedKey)
                      .some(([_, value]) => value !== '') || meals.length !== 0
                  );
                };

                const isTravelFormEmpty = () => {
                  const excludedKey = 'type';
                  return Object.entries(travelForm)
                    .filter(([key]) => key !== excludedKey)
                    .some(([_, value]) => value !== '');
                };

                const isAdhyayanFormEmpty = () => {
                  return adhyayanBookingList.length != 0;
                };

                if (booking !== types.ROOM_DETAILS_TYPE && isRoomFormEmpty()) {
                  if (Object.values(roomForm).some((value) => value == '')) {
                    Alert.alert('Please fill all the fields');
                    setIsSubmitting(false);
                    return;
                  }
                  setData((prev: any) => ({ ...prev, room: roomForm }));
                }
                if (booking !== types.ADHYAYAN_DETAILS_TYPE && adhyayanBookingList.length != 0) {
                  setData((prev: any) => ({
                    ...prev,
                    adhyayan: adhyayanBookingList,
                  }));
                }
                if (isFoodFormEmpty()) {
                  if (Object.values(foodForm).some((value) => value == '')) {
                    Alert.alert('Please fill all the fields');
                    setIsSubmitting(false);
                    return;
                  }
                  setData((prev: any) => ({
                    ...prev,
                    food: { ...foodForm, meals: meals },
                  }));
                }
                if (booking !== types.TRAVEL_DETAILS_TYPE && isTravelFormEmpty()) {
                  if (
                    travelForm.date == '' ||
                    travelForm.pickup == '' ||
                    travelForm.drop == '' ||
                    travelForm.luggage == ''
                  ) {
                    Alert.alert('Please fill all the fields');
                    setIsSubmitting(false);
                    return;
                  }
                  setData((prev: any) => ({ ...prev, travel: travelForm }));
                }

                if (booking !== types.ADHYAYAN_DETAILS_TYPE && isAdhyayanFormEmpty()) {
                  setData((prev: any) => ({
                    ...prev,
                    adhyayan: adhyayanBookingList,
                  }));
                }

                setIsSubmitting(false);
                router.push('/booking/bookingConfirmation');
              }}
              containerStyles="mb-8 min-h-[62px]"
              isLoading={isSubmitting}
            />
          </View>

          {validationDataError && (
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

export default details;
