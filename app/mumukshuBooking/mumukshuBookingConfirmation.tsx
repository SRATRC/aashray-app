import { View, Text, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
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
import MumukshuEventBookingDetails from '~/components/booking details cards/MumukshuEventBookingDetails';

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
  const queryClient = useQueryClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const transformedData = prepareMumukshuRequestBody(user, mumukshuData);

  const fetchValidation = async () => {
    try {
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
            setErrorMessage(errorDetails.message || 'Validation failed');
            setShowErrorModal(true);
            reject(new Error(errorDetails.message || 'Validation failed'));
          }
        );
      });
    } catch (error: any) {
      setErrorMessage(error.message || 'Validation failed');
      setShowErrorModal(true);
      throw error;
    }
  };

  const {
    isLoading: isValidationDataLoading,
    isError: isValidationDataError,
    error: validationDataError,
    data: validationData,
  } = useQuery<ValidationData, Error>({
    queryKey: ['mumukshuValidations', user.cardno],
    queryFn: fetchValidation,
    retry: false,
  });

  // Set error message when validation query fails
  useEffect(() => {
    if (validationDataError) {
      setErrorMessage(validationDataError.message || 'Validation failed');
      setShowErrorModal(true);
    }
  }, [validationDataError]);

  // Handle closing the error modal
  const handleCloseErrorModal = () => {
    // First, reset the modal state
    setShowErrorModal(false);

    // Reset validation query to clear any cached errors
    queryClient.resetQueries({ queryKey: ['mumukshuValidations', user.cardno] });

    // Mark this error as already shown, but keep it in state
    // This way the booking screen knows not to show it again
    setMumukshuData((prev: any) => ({
      ...prev,
      errorAlreadyShown: true,
      errorMessage: errorMessage || (validationDataError as any)?.message,
    }));

    // Navigate back
    router.back();
  };

  return (
    <SafeAreaView className="h-full bg-white">
      <ScrollView alwaysBounceVertical={false} showsVerticalScrollIndicator={false}>
        <PageHeader title="Payment Summary" />

        {mumukshuData.room && <MumukshuRoomBookingDetails containerStyles={'mt-2'} />}
        {mumukshuData.adhyayan && <MumukshuAdhyayanBookingDetails containerStyles={'mt-2'} />}
        {mumukshuData.food && <MumukshuFoodBookingDetails containerStyles={'mt-2'} />}
        {mumukshuData.travel && <MumukshuTravelBookingDetails containerStyles={'mt-2'} />}
        {mumukshuData.utsav && <MumukshuEventBookingDetails containerStyles={'mt-2'} />}

        {validationData && (
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
            text="Proceed to Payment"
            handlePress={async () => {
              setIsSubmitting(true);
              try {
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

                const onError = (errorDetails: any) => {
                  setErrorMessage(errorDetails.message || 'Booking failed');
                  setShowErrorModal(true);
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
                  onFinally,
                  onError
                );
              } catch (error: any) {
                setIsSubmitting(false);
                setErrorMessage(error.message || 'Booking failed');
                setShowErrorModal(true);
              }
            }}
            containerStyles="mb-8 min-h-[62px]"
            isLoading={isSubmitting}
            isDisabled={!validationData || isValidationDataError}
          />
        </View>

        {/* Show error modal for validation errors and API errors */}
        <CustomModal
          visible={
            showErrorModal || (isValidationDataError && !mumukshuData.dismissedValidationError)
          }
          onClose={handleCloseErrorModal}
          message={errorMessage || 'An error occurred'}
          btnText={'Okay'}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default mumukshuBookingConfirmation;
