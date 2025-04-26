import { View, Text, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useGlobalContext } from '../../context/GlobalProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, icons, status } from '../../constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { prepareMumukshuRequestBody } from '~/utils/preparingRequestBody';
import PageHeader from '../../components/PageHeader';
import CustomButton from '../../components/CustomButton';
import handleAPICall from '../../utils/HandleApiCall';
import MumukshuAdhyayanBookingDetails from '../../components/booking details cards/MumukshuAdhyayanBookingDetails';
import MumukshuRoomBookingDetails from '../../components/booking details cards/MumukshuRoomBookingDetails';
import MumukshuTravelBookingDetails from '../../components/booking details cards/MumukshuTravelBookingDetails';
import MumukshuFoodBookingDetails from '../../components/booking details cards/MumukshuFoodBookingDetails';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-toast-message';
import CustomModal from '~/components/CustomModal';

const mumukshuBookingConfirmation = () => {
  const router = useRouter();
  const { user, mumukshuData, setMumukshuData } = useGlobalContext();
  const queryClient = useQueryClient();

  const [isSubmitting, setIsSubmitting] = useState(false);

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
    queryKey: ['mumukshuValidations', user.cardno],
    queryFn: fetchValidation,
    retry: false,
  });

  return (
    <SafeAreaView className="h-full bg-white">
      <ScrollView alwaysBounceVertical={false} showsVerticalScrollIndicator={false}>
        <PageHeader title="Payment Summary" icon={icons.backArrow} />

        {mumukshuData.room && <MumukshuRoomBookingDetails containerStyles={'mt-2'} />}
        {mumukshuData.adhyayan && <MumukshuAdhyayanBookingDetails containerStyles={'mt-2'} />}
        {mumukshuData.food && <MumukshuFoodBookingDetails containerStyles={'mt-2'} />}
        {mumukshuData.travel && <MumukshuTravelBookingDetails containerStyles={'mt-2'} />}

        {validationData && (
          <View className="mt-4 w-full px-4">
            <Text className="mb-4 font-psemibold text-xl text-secondary">Charges</Text>
            <View
              className={`rounded-2xl bg-white p-4 ${
                Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'
              }`}>
              <View className="flex-col gap-y-2">
                {validationData.roomDetails &&
                  validationData.roomDetails?.length > 0 &&
                  validationData.roomDetails.reduce(
                    (total: any, room: any) => total + room.charge,
                    0
                  ) >= 0 && (
                    <View className="flex-row items-center justify-between">
                      <Text className="font-pregular text-base text-gray-500">Room Charge</Text>
                      <Text className="font-pregular text-base text-black">
                        ₹{' '}
                        {validationData.roomDetails.reduce(
                          (total: any, room: any) => total + room.charge,
                          0
                        )}
                      </Text>
                    </View>
                  )}
                {validationData.travelDetails?.charge >= 0 && (
                  <View className="flex-row items-center justify-between">
                    <Text className="font-pregular text-base text-gray-500">Travel Charge</Text>
                    <Text className="font-pregular text-base text-black">
                      ₹ {validationData.travelDetails.charge}
                    </Text>
                  </View>
                )}
                {validationData.adhyayanDetails &&
                  validationData.adhyayanDetails.length > 0 &&
                  validationData.adhyayanDetails.reduce(
                    (total: any, shibir: any) => total + shibir.charge,
                    0
                  ) && (
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
                if (data.data?.amount == 0 || user.country != 'India')
                  router.replace('/bookingConfirmation');
                else {
                  router.replace('/bookingConfirmation');
                  // var options = {
                  //   key: `${process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID}`,
                  //   name: 'Vitraag Vigyaan Aashray',
                  //   image: 'https://vitraagvigyaan.org/img/logo.png',
                  //   description: 'Payment for Vitraag Vigyaan Aashray',
                  //   amount: `${data.order.amount}`,
                  //   currency: 'INR',
                  //   order_id: `${data.order.id}`,
                  //   prefill: {
                  //     email: `${user.email}`,
                  //     contact: `${user.mobno}`,
                  //     name: `${user.issuedto}`,
                  //   },
                  //   theme: { color: colors.orange },
                  // };
                  // RazorpayCheckout.open(options)
                  //   .then((rzrpayData: any) => {
                  //     // handle success
                  //     setIsSubmitting(false);
                  //     console.log(JSON.stringify(rzrpayData));
                  //     router.replace('/paymentConfirmation');
                  //   })
                  //   .catch((error: any) => {
                  //     // handle failure
                  //     setIsSubmitting(false);
                  //     Toast.show({
                  //       type: 'error',
                  //       text1: 'An error occurred!',
                  //       text2: error.reason,
                  //       swipeable: false,
                  //     });
                  //     console.log(JSON.stringify(error));
                  //   });
                }
              };

              const onFinally = () => {
                setIsSubmitting(false);
              };

              await handleAPICall(
                'POST',
                '/mumukshu/booking',
                null,
                transformedData,
                onSuccess,
                onFinally
              );
            }}
            containerStyles="mb-8 min-h-[62px]"
            isLoading={isSubmitting}
            isDisabled={!validationData || validationDataError}
          />
        </View>

        {validationDataError && (
          <CustomModal
            visible={true}
            onClose={() => {
              setMumukshuData((prev: any) => ({ ...prev, dismissedValidationError: true }));
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

export default mumukshuBookingConfirmation;
