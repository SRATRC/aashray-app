import { View, Text, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useGlobalContext } from '../../context/GlobalProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, icons } from '../../constants';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import CustomButton from '../../components/CustomButton';
import handleAPICall from '../../utils/HandleApiCall';
import MumukshuAdhyayanBookingDetails from '../../components/booking details cards/MumukshuAdhyayanBookingDetails';
import MumukshuRoomBookingDetails from '../../components/booking details cards/MumukshuRoomBookingDetails';
import MumukshuTravelBookingDetails from '../../components/booking details cards/MumukshuTravelBookingDetails';
import MumukshuFoodBookingDetails from '../../components/booking details cards/MumukshuFoodBookingDetails';
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-toast-message';

const mumukshuBookingConfirmation = () => {
  const router = useRouter();
  const { user, mumukshuData, setMumukshuData } = useGlobalContext();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const transformData = (input: any) => {
    const transformMumukshuGroup = (mumukshuGroup: any) =>
      mumukshuGroup.map((group: any) => {
        const transformed: any = {};
        if (group.cardno) return group.cardno;
        if (group.roomType) transformed.roomType = group.roomType;
        if (group.floorType && group.floorType !== 'n') transformed.floorType = group.floorType;
        if (group.mumukshus)
          transformed.mumukshus = group.mumukshus.map((mumukshu: any) => mumukshu.cardno);
        if (group.pickup) transformed.pickup_point = group.pickup;
        if (group.drop) transformed.drop_point = group.drop;
        if (group.luggage) transformed.luggage = group.luggage;
        if (group.type) transformed.type = group.type;
        if (group.special_request) transformed.comments = group.special_request;
        if (group.meals) transformed.meals = group.meals;
        if (group.spicy !== undefined) transformed.spicy = group.spicy;
        if (group.hightea) transformed.high_tea = group.hightea;
        return transformed;
      });

    const primaryBookingDetails = (primaryKey: any) => {
      const primaryData = input[primaryKey];

      switch (primaryKey) {
        case 'room':
          return {
            booking_type: 'room',
            details: {
              checkin_date: primaryData.startDay,
              checkout_date: primaryData.endDay,
              mumukshuGroup: transformMumukshuGroup(primaryData.mumukshuGroup),
            },
          };
        case 'food':
          return {
            booking_type: 'food',
            details: {
              start_date: primaryData.startDay,
              end_date: primaryData.endDay,
              mumukshuGroup: transformMumukshuGroup(primaryData.mumukshuGroup),
            },
          };
        case 'adhyayan':
          return {
            booking_type: 'adhyayan',
            details: {
              shibir_ids: [primaryData.adhyayan.id],
              mumukshus: transformMumukshuGroup(primaryData.mumukshuGroup),
            },
          };
        case 'travel':
          return {
            booking_type: 'travel',
            details: {
              date: primaryData.date,
              mumukshuGroup: transformMumukshuGroup(primaryData.mumukshuGroup),
            },
          };
        default:
          throw new Error(`Unsupported primary booking type: ${primaryKey}`);
      }
    };

    const transformAddons = (input: any) =>
      Object.keys(input)
        .filter((key) => key !== input.primary && key !== 'primary')
        .map((key) => {
          switch (key) {
            case 'room':
              return {
                booking_type: key,
                details: {
                  checkin_date: input[key].startDay,
                  checkout_date: input[key].endDay,
                  mumukshuGroup: transformMumukshuGroup(input[key].mumukshuGroup),
                },
              };
            case 'food':
              return {
                booking_type: key,
                details: {
                  start_date: input[key].startDay,
                  end_date: input[key].endDay,
                  mumukshuGroup: transformMumukshuGroup(input[key].mumukshuGroup),
                },
              };
            case 'adhyayan':
              return {
                booking_type: key,
                details: {
                  shibir_ids: [input[key].adhyayan.id],
                  mumukshus: input[key].mumukshus.map((mumukshu: any) => mumukshu.cardno),
                },
              };
            case 'travel':
              return {
                booking_type: key,
                details: {
                  date: input[key].date,
                  mumukshuGroup: transformMumukshuGroup(input[key].mumukshuGroup),
                },
              };
            case 'validationData':
              return null;
            default:
              throw new Error(`Unsupported addon type: ${key}`);
          }
        })
        .filter(Boolean);
    return {
      cardno: user.cardno,
      transaction_type: 'upi',
      transaction_ref: '',
      primary_booking: primaryBookingDetails(input.primary),
      addons: transformAddons(input),
    };
  };

  const transformedData = transformData(JSON.parse(JSON.stringify(mumukshuData)));
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
        () => reject(new Error('Failed to fetch validation and transaction data'))
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

  useEffect(() => {
    console.log('VALIDATION DATA: ', validationData);
  }, [validationData]);

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
                if (data.order.amount == 0) router.replace('/booking/paymentConfirmation');
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
                  // RazorpayCheckout.open(options)
                  //   .then((rzrpayData: any) => {
                  //     // handle success
                  //     setIsSubmitting(false);
                  //     console.log(JSON.stringify(rzrpayData));
                  //     router.replace('/booking/paymentConfirmation');
                  //   })
                  //   .catch((error: any) => {
                  //     // handle failure
                  //     setIsSubmitting(false);
                  //     Toast.show({
                  //       type: 'error',
                  //       text1: 'An error occurred!',
                  //       text2: error.reason,
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default mumukshuBookingConfirmation;
