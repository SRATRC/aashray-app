import { View, Text, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useGlobalContext } from '../../context/GlobalProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, icons } from '../../constants';
import { useQuery } from '@tanstack/react-query';
import GuestRoomBookingDetails from '../../components/booking details cards/GuestRoomBookingDetails';
import GuestAdhyayanBookingDetails from '../../components/booking details cards/GuestAdhyayanBookingDetails';
import GuestFoodBookingDetails from '../../components/booking details cards/GuestFoodBookingDetails';
import PageHeader from '../../components/PageHeader';
import CustomButton from '../../components/CustomButton';
import handleAPICall from '../../utils/HandleApiCall';
import RazorpayCheckout from 'react-native-razorpay';
import Toast from 'react-native-toast-message';

const guestBookingConfirmation = () => {
  const router = useRouter();
  const { user, guestData, setGuestData } = useGlobalContext();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const transformData = (input: any) => {
    const transformGuestGroup = (guestGroup: any) =>
      guestGroup.map((group: any) => {
        const transformed: any = {};
        if (group.roomType) transformed.roomType = group.roomType;
        if (group.floorType && group.floorType !== 'n') transformed.floorType = group.floorType;
        if (group.guests) transformed.guests = group.guests.map((guest: any) => guest.id);
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
              guestGroup: transformGuestGroup(primaryData.guestGroup),
            },
          };
        case 'food':
          return {
            booking_type: 'food',
            details: {
              start_date: primaryData.startDay,
              end_date: primaryData.endDay,
              guestGroup: transformGuestGroup(primaryData.guestGroup),
            },
          };
        case 'adhyayan':
          return {
            booking_type: 'adhyayan',
            details: {
              shibir_ids: [primaryData.adhyayan.id],
              guests: primaryData.guestGroup.map((guest: any) => guest.id),
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
                  guestGroup: transformGuestGroup(input[key].guestGroup),
                },
              };
            case 'food':
              return {
                booking_type: key,
                details: {
                  start_date: input[key].startDay,
                  end_date: input[key].endDay,
                  guestGroup: transformGuestGroup(input[key].guestGroup),
                },
              };
            case 'adhyayan':
              return {
                booking_type: 'adhyayan',
                details: {
                  shibir_ids: [input[key].adhyayan.id],
                  guests: input[key].guests.map((guest: any) => guest.id),
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
      primary_booking: primaryBookingDetails(input.primary),
      addons: transformAddons(input),
    };
  };
  const transformedData = transformData(JSON.parse(JSON.stringify(guestData)));

  const fetchValidation = async () => {
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
    queryKey: ['guestValidations', user.cardno],
    queryFn: fetchValidation,
  });

  return (
    <SafeAreaView className="h-full bg-white" edges={['top', 'right', 'left']}>
      <ScrollView alwaysBounceVertical={false} showsVerticalScrollIndicator={false}>
        <PageHeader title="Payment Summary" icon={icons.backArrow} />

        {guestData.room && <GuestRoomBookingDetails containerStyles={'mt-6'} />}
        {guestData.adhyayan && <GuestAdhyayanBookingDetails containerStyles={'mt-6'} />}
        {guestData.food && <GuestFoodBookingDetails containerStyles={'mt-6'} />}

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
                  ) > 0 && (
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
                {validationData.foodDetails?.charge && (
                  <View className="flex-row items-center justify-between">
                    <Text className="font-pregular text-base text-gray-500">Food Charge</Text>
                    <Text className="font-pregular text-base text-black">
                      ₹ {validationData.foodDetails.charge}
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
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default guestBookingConfirmation;
