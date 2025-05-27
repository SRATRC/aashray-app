import { View, Text, ScrollView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useGlobalContext } from '../../context/GlobalProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, icons } from '../../constants';
import { prepareSelfRequestBody } from '~/utils/preparingRequestBody';
import RoomBookingDetails from '../../components/booking details cards/RoomBookingDetails';
import PageHeader from '../../components/PageHeader';
import TravelBookingDetails from '../../components/booking details cards/TravelBookingDetails';
import AdhyayanBookingDetails from '../../components/booking details cards/AdhyayanBookingDetails';
import CustomButton from '../../components/CustomButton';
import FoodBookingDetails from '../../components/booking details cards/FoodBookingDetails';
import handleAPICall from '../../utils/HandleApiCall';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-toast-message';
import CustomModal from '~/components/CustomModal';
import EventBookingDetails from '~/components/booking details cards/EventBookingDetails';

const bookingConfirmation = () => {
  const router = useRouter();
  const { user, data, setData } = useGlobalContext();
  const queryClient = useQueryClient();

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <SafeAreaView className="h-full bg-white" edges={['top', 'right', 'left']}>
      <ScrollView alwaysBounceVertical={false} showsVerticalScrollIndicator={false}>
        <PageHeader title="Payment Summary" />

        {data.room && <RoomBookingDetails containerStyles={'mt-2'} />}
        {data.travel && <TravelBookingDetails containerStyles={'mt-2'} />}
        {data.adhyayan && <AdhyayanBookingDetails containerStyles={'mt-2'} />}
        {data.food && <FoodBookingDetails containerStyles={'mt-2'} />}
        {data.utsav && <EventBookingDetails containerStyles={'mt-2'} />}

        {validationData && validationData.totalCharge > 0 && (
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
                {validationData.utsavDetails && validationData.utsavDetails.length > 0 && (
                  <View className="flex-row items-center justify-between">
                    <Text className="font-pregular text-base text-gray-500">Utsav Charge</Text>
                    <Text className="font-pregular text-base text-black">
                      ₹{' '}
                      {validationData.utsavDetails.reduce(
                        (total: any, utsav: any) => total + utsav.charge,
                        0
                      )}
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
            text={
              validationData && validationData.totalCharge > 0 ? 'Proceed to Payment' : 'Confirm'
            }
            handlePress={async () => {
              setIsSubmitting(true);

              const onSuccess = (data: any) => {
                if (data.data?.amount == 0 || user.country != 'India')
                  router.replace('/bookingConfirmation');
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
                      router.replace('/bookingConfirmation');
                    })
                    .catch((error: any) => {
                      // handle failure
                      setIsSubmitting(false);
                      router.replace('/paymentFailed');
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
            onClose={() => {
              setData((prev: any) => ({ ...prev, dismissedValidationError: true }));
              queryClient.resetQueries({ queryKey: ['validations', user.cardno] });
              router.back();
            }}
            message={validationDataError.message}
            btnText={'Okay'}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default bookingConfirmation;
