import { View, Text, ScrollView, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { useGlobalContext } from '../../context/GlobalProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants';
import { useQuery } from '@tanstack/react-query';
import { prepareGuestRequestBody } from '~/utils/preparingRequestBody';
import GuestRoomBookingDetails from '../../components/booking details cards/GuestRoomBookingDetails';
import GuestAdhyayanBookingDetails from '../../components/booking details cards/GuestAdhyayanBookingDetails';
import GuestFoodBookingDetails from '../../components/booking details cards/GuestFoodBookingDetails';
import PageHeader from '../../components/PageHeader';
import CustomButton from '../../components/CustomButton';
import handleAPICall from '../../utils/HandleApiCall';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import CustomModal from '~/components/CustomModal';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

const guestBookingConfirmation = () => {
  const router = useRouter();
  const { user, guestData, setGuestData } = useGlobalContext();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const transformedData = prepareGuestRequestBody(user, guestData);

  const fetchValidation = useCallback(async () => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'POST',
        '/guest/validate',
        null,
        transformedData,
        (res: any) => {
          setGuestData((prev: any) => ({ ...prev, validationData: res.data }));
          resolve(res.data);
        },
        () => {},
        (errorDetails: any) => reject(new Error(errorDetails.message))
      );
    });
  }, [transformedData, setGuestData]);

  const {
    isLoading: isValidationDataLoading,
    isError: isValidationDataError,
    error: validationDataError,
    data: validationData,
    refetch: refetchValidation,
  }: any = useQuery({
    queryKey: ['guestConfirmationValidations', user.cardno, JSON.stringify(guestData)],
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
    <SafeAreaView className="h-full bg-white" edges={['top', 'right', 'left']}>
      <ScrollView alwaysBounceVertical={false} showsVerticalScrollIndicator={false}>
        <PageHeader title="Payment Summary" />

        {guestData.room && <GuestRoomBookingDetails containerStyles={'mt-2'} />}
        {guestData.adhyayan && <GuestAdhyayanBookingDetails containerStyles={'mt-2'} />}
        {guestData.food && <GuestFoodBookingDetails containerStyles={'mt-2'} />}

        {validationData && validationData.totalCharge > 0 && (
          <View className="mt-4 w-full px-4">
            <Text className="mb-3 font-psemibold text-xl text-secondary">Charges</Text>
            <View
              className={`rounded-2xl bg-white ${
                Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'
              }`}>
              <View className="p-4">
                <View className="flex-col gap-y-3">
                  {validationData.roomDetails &&
                    validationData.roomDetails.length > 0 &&
                    (() => {
                      const totalCharge = validationData.roomDetails.reduce(
                        (total: any, room: any) => total + room.charge,
                        0
                      );
                      const totalCredits = validationData.roomDetails.reduce(
                        (total: any, room: any) => total + (room.availableCredits || 0),
                        0
                      );

                      if (totalCharge > 0) {
                        return (
                          <View className="border-b border-gray-200 pb-3">
                            <View className="flex-row items-center justify-between">
                              <Text className="font-pregular text-base text-gray-700">
                                Room Charge
                              </Text>
                              <View className="items-end">
                                <Text
                                  className={`font-${totalCredits > 0 ? 'pregular' : 'pregular'} text-base text-${totalCredits > 0 ? 'gray-400 line-through' : 'black'}`}>
                                  ₹{totalCharge.toLocaleString('en-IN')}
                                </Text>
                                {totalCredits > 0 && (
                                  <>
                                    <Text className="font-pregular text-xs text-green-600">
                                      −₹{totalCredits.toLocaleString('en-IN')} credit
                                    </Text>
                                    <Text className="mt-0.5 font-pmedium text-base text-black">
                                      ₹
                                      {Math.max(0, totalCharge - totalCredits).toLocaleString(
                                        'en-IN'
                                      )}
                                    </Text>
                                  </>
                                )}
                              </View>
                            </View>
                          </View>
                        );
                      }
                      return null;
                    })()}

                  {validationData.foodDetails?.charge !== undefined &&
                    validationData.foodDetails.charge > 0 && (
                      <View className="border-b border-gray-200 pb-3">
                        <View className="flex-row items-center justify-between">
                          <Text className="font-pregular text-base text-gray-700">Food Charge</Text>
                          <View className="items-end">
                            <Text
                              className={`font-${validationData.foodDetails.availableCredits > 0 ? 'pregular' : 'pregular'} text-base text-${validationData.foodDetails.availableCredits > 0 ? 'gray-400 line-through' : 'black'}`}>
                              ₹{validationData.foodDetails.charge.toLocaleString('en-IN')}
                            </Text>
                            {validationData.foodDetails.availableCredits > 0 && (
                              <>
                                <Text className="font-pregular text-xs text-green-600">
                                  −₹
                                  {validationData.foodDetails.availableCredits.toLocaleString(
                                    'en-IN'
                                  )}{' '}
                                  credit
                                </Text>
                                <Text className="mt-0.5 font-pmedium text-base text-black">
                                  ₹
                                  {Math.max(
                                    0,
                                    validationData.foodDetails.charge -
                                      validationData.foodDetails.availableCredits
                                  ).toLocaleString('en-IN')}
                                </Text>
                              </>
                            )}
                          </View>
                        </View>
                      </View>
                    )}

                  {validationData.adhyayanDetails &&
                    validationData.adhyayanDetails.length > 0 &&
                    (() => {
                      const totalCharge = validationData.adhyayanDetails.reduce(
                        (total: any, shibir: any) => total + shibir.charge,
                        0
                      );
                      const totalCredits = validationData.adhyayanDetails.reduce(
                        (total: any, shibir: any) => total + (shibir.availableCredits || 0),
                        0
                      );

                      if (totalCharge > 0) {
                        return (
                          <View className="border-b border-gray-200 pb-3">
                            <View className="flex-row items-center justify-between">
                              <Text className="font-pregular text-base text-gray-700">
                                Adhyayan Charge
                              </Text>
                              <View className="items-end">
                                <Text
                                  className={`font-${totalCredits > 0 ? 'pregular' : 'pregular'} text-base text-${totalCredits > 0 ? 'gray-400 line-through' : 'black'}`}>
                                  ₹{totalCharge.toLocaleString('en-IN')}
                                </Text>
                                {totalCredits > 0 && (
                                  <>
                                    <Text className="font-pregular text-xs text-green-600">
                                      −₹{totalCredits.toLocaleString('en-IN')} credit
                                    </Text>
                                    <Text className="mt-0.5 font-pmedium text-base text-black">
                                      ₹
                                      {Math.max(0, totalCharge - totalCredits).toLocaleString(
                                        'en-IN'
                                      )}
                                    </Text>
                                  </>
                                )}
                              </View>
                            </View>
                          </View>
                        );
                      }
                      return null;
                    })()}

                  {/* Total section */}
                  <View className="pt-2">
                    {(() => {
                      const totalCredits =
                        (validationData.roomDetails?.reduce(
                          (sum: any, item: any) => sum + (item.availableCredits || 0),
                          0
                        ) || 0) +
                        (validationData.foodDetails?.availableCredits || 0) +
                        (validationData.adhyayanDetails?.reduce(
                          (sum: any, item: any) => sum + (item.availableCredits || 0),
                          0
                        ) || 0);

                      return (
                        <>
                          {totalCredits > 0 && (
                            <>
                              <View className="mb-1 flex-row items-center justify-between">
                                <Text className="font-pregular text-sm text-gray-500">
                                  Subtotal
                                </Text>
                                <Text className="font-pregular text-sm text-gray-500">
                                  ₹{validationData.totalCharge.toLocaleString('en-IN')}
                                </Text>
                              </View>
                              <View className="mb-2 flex-row items-center justify-between">
                                <Text className="font-pregular text-sm text-green-600">
                                  Total Credits Applied
                                </Text>
                                <Text className="font-pregular text-sm text-green-600">
                                  −₹{totalCredits.toLocaleString('en-IN')}
                                </Text>
                              </View>
                            </>
                          )}
                          <View className="flex-row items-center justify-between">
                            <Text className="font-psemibold text-xl text-gray-800">
                              Total Charge
                            </Text>
                            <Text className="font-psemibold text-xl text-secondary">
                              ₹
                              {Math.max(
                                0,
                                validationData.totalCharge - totalCredits
                              ).toLocaleString('en-IN')}
                            </Text>
                          </View>
                        </>
                      );
                    })()}
                  </View>
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
              const onSuccess = (data: any) => {
                if (data.data?.amount == 0 || user.country != 'India')
                  router.replace('/bookingConfirmation');
                else {
                  var options = {
                    key: `${process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID}`,
                    name: 'Vitraag Vigyaan Aashray',
                    image: 'https://vitraagvigyaan.org/img/logo.png',
                    description: 'Payment for Vitraag Vigyaan Aashray',
                    amount: `${data.data.amount}`,
                    currency: 'INR',
                    order_id: `${data.data.id}`,
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
                '/guest/booking',
                null,
                transformedData,
                onSuccess,
                onFinally
              );
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
            message={validationDataError.message}
            btnText={'Okay'}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default guestBookingConfirmation;
