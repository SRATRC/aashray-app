import { View, Text, ScrollView, Platform, Modal } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useGlobalContext } from '../../context/GlobalProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, icons } from '../../constants';
import RoomBookingDetails from '../../components/booking details cards/RoomBookingDetails';
import PageHeader from '../../components/PageHeader';
import TravelBookingDetails from '../../components/booking details cards/TravelBookingDetails';
import AdhyayanBookingDetails from '../../components/booking details cards/AdhyayanBookingDetails';
import CustomButton from '../../components/CustomButton';
import FoodBookingDetails from '../../components/booking details cards/FoodBookingDetails';
import handleAPICall from '../../utils/HandleApiCall';
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-toast-message';
import CustomModal from '~/components/CustomModal';

const bookingConfirmation = () => {
  const router = useRouter();
  const { user, data, setData } = useGlobalContext();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const prepareRequestBody = () => {
    const payload: any = {
      cardno: user.cardno,
    };

    if (data.primary === 'room') {
      payload.primary_booking = {
        booking_type: 'room',
        details: {
          checkin_date: data.room?.startDay,
          checkout_date: data.room?.endDay,
          room_type: data.room?.roomType,
          floor_type: data.room?.floorType,
        },
      };
    } else if (data.primary === 'travel') {
      payload.primary_booking = {
        booking_type: 'travel',
        details: {
          date: data.travel?.date,
          pickup_point: data.travel?.pickup,
          drop_point: data.travel?.drop,
          luggage: data.travel?.luggage,
          type: data.travel?.type,
          special_request: data.travel?.special_request,
        },
      };
    } else if (data.primary === 'adhyayan') {
      payload.primary_booking = {
        booking_type: 'adhyayan',
        details: {
          shibir_ids: data.adhyayan.map((shibir: any) => shibir.id),
        },
      };
    }

    const addons = [];
    if (data.primary !== 'room' && data.room) {
      addons.push({
        booking_type: 'room',
        details: {
          checkin_date: data.room?.startDay,
          checkout_date: data.room?.endDay,
          room_type: data.room?.roomType,
          floor_type: data.room?.floorType,
        },
      });
    }
    if (data.primary !== 'food' && data.food) {
      addons.push({
        booking_type: 'food',
        details: {
          start_date: data.food?.startDay,
          end_date: data.food?.endDay,
          breakfast: data.food?.meals.includes('breakfast'),
          lunch: data.food?.meals.includes('lunch'),
          dinner: data.food?.meals.includes('dinner'),
          spicy: data.food?.spicy,
          hightea: data.food?.hightea,
        },
      });
    }
    if (data.primary !== 'travel' && data.travel) {
      addons.push({
        booking_type: 'travel',
        details: {
          date: data.travel?.date,
          pickup_point: data.travel?.pickup,
          drop_point: data.travel?.drop,
          luggage: data.travel?.luggage,
          type: data.travel?.type,
          comments: data.travel?.special_request,
        },
      });
    }
    if (data.primary !== 'adhyayan' && data.adhyayan) {
      addons.push({
        booking_type: 'adhyayan',
        details: {
          shibir_ids: data.adhyayan.map((shibir: any) => shibir.id),
        },
      });
    }

    if (addons.length > 0) {
      payload.addons = addons;
    }

    return payload;
  };
  const payload = prepareRequestBody();

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
        (errorMessage: string) => {
          reject(new Error(errorMessage));
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
    queryKey: ['validations', user.cardno],
    queryFn: fetchValidation,
    retry: false,
  });

  return (
    <SafeAreaView className="h-full bg-white" edges={['top', 'right', 'left']}>
      <ScrollView alwaysBounceVertical={false} showsVerticalScrollIndicator={false}>
        <PageHeader title="Payment Summary" icon={icons.backArrow} />

        {data.room && <RoomBookingDetails containerStyles={'mt-6'} />}
        {data.travel && <TravelBookingDetails containerStyles={'mt-6'} />}
        {data.adhyayan && <AdhyayanBookingDetails containerStyles={'mt-6'} />}
        {data.food && <FoodBookingDetails containerStyles={'mt-6'} />}

        {validationData && (
          <View className="mt-4 w-full px-4">
            <Text className="mb-4 font-psemibold text-xl text-secondary">Charges</Text>
            <View
              className={`rounded-2xl bg-white p-4 ${
                Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'
              }`}>
              <View className="flex-col gap-y-2">
                {validationData.roomDetails?.charge && (
                  <View className="flex-row items-center justify-between">
                    <Text className="font-pregular text-base text-gray-500">Room Charge</Text>
                    <Text className="font-pregular text-base text-black">
                      ₹ {validationData.roomDetails.charge}
                    </Text>
                  </View>
                )}
                {validationData.travelDetails?.charge > 0 && (
                  <View className="flex-row items-center justify-between">
                    <Text className="font-pregular text-base text-gray-500">Travel Charge</Text>
                    <Text className="font-pregular text-base text-black">
                      ₹ {validationData.travelDetails.charge}
                    </Text>
                  </View>
                )}
                {validationData.adhyayanDetails && validationData.adhyayanDetails.length > 0 && (
                  <View className="flex-row items-center justify-between">
                    <Text className="font-pregular text-base text-gray-500">Adhyayan Charge</Text>
                    <Text className="font-pregular text-base text-black">
                      ₹{' '}
                      {validationData.adhyayanDetails.reduce(
                        (total: any, shibir: any) => total + shibir.charge,
                        0
                      )}
                    </Text>
                  </View>
                )}
                {validationData.taxes && (
                  <View className="flex-row items-center justify-between">
                    <Text className="font-pregular text-base text-gray-500">Tax</Text>
                    <Text className="font-pregular text-base text-black">
                      ₹ {validationData.taxes}
                    </Text>
                  </View>
                )}
                <View className="mt-2 flex-row items-center justify-between border-t border-gray-200 pt-4">
                  <Text className="font-psemibold text-xl text-gray-800">Total Charge</Text>
                  <Text className="font-psemibold text-xl text-secondary">
                    ₹ {validationData.totalCharge}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View className="mt-6 w-full px-4">
          <CustomButton
            text="Proceed to Payment"
            handlePress={async () => {
              setIsSubmitting(true);

              const onSuccess = (data: any) => {
                if (data.data.amount == 0) router.replace('/booking/paymentConfirmation');
                else {
                  var options = {
                    key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID,
                    name: 'Vitraag Vigyaan Aashray',
                    image: 'https://vitraagvigyaan.org/img/logo.png',
                    description: 'Payment for Vitraag Vigyaan Aashray',
                    amount: data.data.amount.toString(),
                    currency: 'INR',
                    order_id: data.data.id.toString(),
                    prefill: {
                      email: user.email.toString(),
                      contact: user.mobno.toString(),
                      name: user.issuedto.toString(),
                    },
                    theme: { color: colors.orange },
                  };
                  RazorpayCheckout.open(options)
                    .then((rzrpayData: any) => {
                      // handle success
                      setIsSubmitting(false);
                      console.log(JSON.stringify(rzrpayData));
                      router.replace('/booking/paymentConfirmation');
                    })
                    .catch((error: any) => {
                      // handle failure
                      setIsSubmitting(false);
                      Toast.show({
                        type: 'error',
                        text1: 'An error occurred!',
                        text2: error.reason,
                      });
                      console.log(JSON.stringify(error));
                    });
                }
              };

              const onFinally = () => {
                setIsSubmitting(false);
              };

              await handleAPICall('POST', '/unified/booking', null, payload, onSuccess, onFinally);
            }}
            containerStyles="mb-8 min-h-[62px]"
            isLoading={isSubmitting}
            isDisabled={!validationData}
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
    </SafeAreaView>
  );
};

export default bookingConfirmation;
