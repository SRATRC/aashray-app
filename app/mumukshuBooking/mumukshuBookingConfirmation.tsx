import { View, Text, ScrollView, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { useGlobalContext } from '../../context/GlobalProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants';
import { useQuery } from '@tanstack/react-query';
import { prepareMumukshuRequestBody } from '~/utils/preparingRequestBody';
import PageHeader from '../../components/PageHeader';
import CustomButton from '../../components/CustomButton';
import handleAPICall from '../../utils/HandleApiCall';
import MumukshuAdhyayanBookingDetails from '../../components/booking details cards/MumukshuAdhyayanBookingDetails';
import MumukshuRoomBookingDetails from '../../components/booking details cards/MumukshuRoomBookingDetails';
import MumukshuTravelBookingDetails from '../../components/booking details cards/MumukshuTravelBookingDetails';
import MumukshuFoodBookingDetails from '../../components/booking details cards/MumukshuFoodBookingDetails';
import MumukshuEventBookingDetails from '~/components/booking details cards/MumukshuEventBookingDetails';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import CustomModal from '~/components/CustomModal';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

// Define validation data type
interface ValidationData {
  roomDetails?: Array<{ charge: number }>;
  travelDetails?: { charge: number };
  adhyayanDetails?: Array<{ charge: number }>;
  utsavDetails?: Array<{ charge: number }>;
  totalCharge: number;
}

const mumukshuBookingConfirmation = () => {
  const router = useRouter();
  const { user, mumukshuData, setMumukshuData } = useGlobalContext();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const transformedData = prepareMumukshuRequestBody(user, mumukshuData);

  const fetchValidation = useCallback(async () => {
    return new Promise<ValidationData>((resolve, reject) => {
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
          reject(new Error(errorDetails.message || 'Validation failed'));
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
  } = useQuery<ValidationData, Error>({
    queryKey: ['mumukshuConfirmationValidations', user.cardno, JSON.stringify(mumukshuData)],
    queryFn: fetchValidation,
    retry: false,
    enabled: !!user.cardno,
  });

  // Force refetch validation when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user.cardno) {
        refetchValidation();
      }
    }, [user.cardno, refetchValidation])
  );

  const handleCloseValidationModal = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView className="h-full bg-white" edges={['top', 'left', 'right']}>
      <ScrollView alwaysBounceVertical={false} showsVerticalScrollIndicator={false}>
        <PageHeader title="Payment Summary" />

        {mumukshuData.room && <MumukshuRoomBookingDetails containerStyles={'mt-2'} />}
        {mumukshuData.adhyayan && <MumukshuAdhyayanBookingDetails containerStyles={'mt-2'} />}
        {mumukshuData.food && <MumukshuFoodBookingDetails containerStyles={'mt-2'} />}
        {mumukshuData.travel && <MumukshuTravelBookingDetails containerStyles={'mt-2'} />}
        {mumukshuData.utsav && <MumukshuEventBookingDetails containerStyles={'mt-2'} />}

        {validationData && validationData.totalCharge > 0 && (
          <View className="mt-4 w-full px-4">
            <Text className="mb-4 font-psemibold text-xl text-secondary">Charges</Text>
            <View
              className={`rounded-2xl bg-white p-4 ${
                Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'
              }`}>
              <View className="flex-col gap-y-2">
                {validationData.roomDetails &&
                  validationData.roomDetails.length > 0 &&
                  validationData.roomDetails.reduce(
                    (total: number, room: { charge: number }) => total + room.charge,
                    0
                  ) > 0 && (
                    <View className="flex-row items-center justify-between">
                      <Text className="font-pregular text-base text-gray-500">Room Charge</Text>
                      <Text className="font-pregular text-base text-black">
                        ₹{' '}
                        {validationData.roomDetails.reduce(
                          (total: number, room: { charge: number }) => total + room.charge,
                          0
                        )}
                      </Text>
                    </View>
                  )}
                {validationData.travelDetails && validationData.travelDetails.charge > 0 && (
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
                    (total: number, shibir: { charge: number }) => total + shibir.charge,
                    0
                  ) > 0 && (
                    <View className="flex-row items-center justify-between">
                      <Text className="font-pregular text-base text-gray-500">Adhyayan Charge</Text>
                      <Text className="font-pregular text-base text-black">
                        ₹{' '}
                        {validationData.adhyayanDetails.reduce(
                          (total: number, shibir: { charge: number }) => total + shibir.charge,
                          0
                        )}
                      </Text>
                    </View>
                  )}
                {validationData.utsavDetails &&
                  validationData.utsavDetails.length > 0 &&
                  validationData.utsavDetails.reduce(
                    (total: number, utsav: { charge: number }) => total + utsav.charge,
                    0
                  ) > 0 && (
                    <View className="flex-row items-center justify-between">
                      <Text className="font-pregular text-base text-gray-500">Utsav Charge</Text>
                      <Text className="font-pregular text-base text-black">
                        ₹{' '}
                        {validationData.utsavDetails.reduce(
                          (total: number, utsav: { charge: number }) => total + utsav.charge,
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
            text={validationData && validationData.totalCharge > 0 ? 'Proceed to Payment' : 'Book'}
            handlePress={async () => {
              setIsSubmitting(true);
              try {
                const onSuccess = (data: any) => {
                  if (data.data?.amount == 0 || user.country != 'India')
                    router.replace('/bookingConfirmation');
                  else {
                    var options = {
                      key: `${process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID}`,
                      name: 'Vitraag Vigyaan Aashray',
                      image: 'https://vitraagvigyaan.org/img/logo.png',
                      description: 'Payment for Vitraag Vigyaan Aashray',
                      amount: `${data.order.amount}`,
                      currency: 'INR',
                      order_id: `${data.order.id}`,
                      prefill: {
                        email: `${user.email}`,
                        contact: `${user.mobno}`,
                        name: `${user.issuedto}`,
                      },
                      theme: { color: colors.orange },
                    };
                    RazorpayCheckout.open(options)
                      .then((_rzrpayData: any) => {
                        setIsSubmitting(false);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Toast.show({
                          type: 'success',
                          text1: 'Payment successful',
                          swipeable: false,
                        });
                        router.replace('/bookingConfirmation');
                      })
                      .catch((_error: any) => {
                        setIsSubmitting(false);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        router.replace('/paymentFailed');
                      });
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
              } catch (error: any) {
                setIsSubmitting(false);
              }
            }}
            containerStyles="mb-8 min-h-[62px]"
            isLoading={isSubmitting}
            isDisabled={!validationData}
          />
        </View>

        {validationDataError && (
          <CustomModal
            visible={true}
            onClose={handleCloseValidationModal}
            message={validationDataError.message || 'An error occurred'}
            btnText={'Okay'}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default mumukshuBookingConfirmation;
