import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import React, { useState, useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGlobalContext } from '../../context/GlobalProvider';
import { colors } from '../../constants';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import PageHeader from '../../components/PageHeader';
import CustomEmptyMessage from '../../components/CustomEmptyMessage';
import CustomErrorMessage from '../../components/CustomErrorMessage';
import CustomButton from '../../components/CustomButton';
import handleAPICall from '../../utils/HandleApiCall';
import moment from 'moment';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';

const PendingPayments = () => {
  const { user } = useGlobalContext();
  const router = useRouter();

  const queryClient = useQueryClient();
  const [selectedPayments, setSelectedPayments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch pending payments
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['pendingPayments', user.cardno],
    queryFn: async () => {
      return new Promise<any[]>((resolve, reject) => {
        handleAPICall(
          'GET',
          '/profile/pendingPayments',
          {
            cardno: user.cardno,
          },
          null,
          (res: any) => {
            resolve(Array.isArray(res.data) ? res.data : []);
          },
          () => {},
          (error) => reject(new Error(error?.message || 'Failed to fetch pending payments'))
        );
      });
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (paymentIds: string[]) => {
      return new Promise((resolve, reject) => {
        handleAPICall(
          'POST',
          '/razorpay/pay',
          null,
          {
            cardno: user.cardno,
            bookingids: paymentIds,
          },
          (res: any) => {
            resolve(res);
          },
          () => {},
          (error) => reject(new Error(error?.message || 'Failed to process payment'))
        );
      });
    },
    onSuccess: () => {
      setSelectedPayments([]);
      queryClient.invalidateQueries({
        queryKey: ['pendingPayments', user.cardno],
      });
    },
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  // Memoized calculations
  const pendingPayments = useMemo(() => (data as any[]) || [], [data]);
  const totalAmount = useMemo(
    () => selectedPayments.reduce((total, payment) => total + payment.amount, 0),
    [selectedPayments]
  );
  const allSelected = useMemo(
    () => pendingPayments.length > 0 && selectedPayments.length === pendingPayments.length,
    [pendingPayments.length, selectedPayments.length]
  );

  // Check if payment is allowed based on the condition
  const totalPendingAmount = useMemo(
    () => pendingPayments.reduce((total, payment) => total + payment.amount, 0),
    [pendingPayments]
  );

  const isPaymentAllowed = useMemo(() => {
    // Payment is NOT allowed when: amount == 0 OR user.country != 'India'
    // So payment IS allowed when: amount != 0 AND user.country == 'India'
    return totalPendingAmount > 0 && user.country === 'India';
  }, [totalPendingAmount, user.country]);

  const handleSelectPayment = useCallback(
    (payment: any) => {
      if (!isPaymentAllowed) return;

      setSelectedPayments((prev) => {
        const isSelected = prev.some((item) => item.bookingid === payment.bookingid);
        const newSelection = isSelected
          ? prev.filter((item) => item.bookingid !== payment.bookingid)
          : [...prev, payment];
        return newSelection;
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [isPaymentAllowed]
  );

  const handleSelectAll = useCallback(() => {
    if (!isPaymentAllowed || pendingPayments.length === 0) return;

    setSelectedPayments(allSelected ? [] : [...pendingPayments]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [pendingPayments, allSelected, isPaymentAllowed]);

  const isPaymentSelected = useCallback(
    (bookingId: string) => {
      return selectedPayments.some((payment) => payment.bookingid === bookingId);
    },
    [selectedPayments]
  );

  const handleProceedToPayment = async () => {
    if (!isPaymentAllowed) {
      Toast.show({
        type: 'error',
        text1: 'Payment not available',
        text2: getPaymentDisabledMessage(),
        swipeable: false,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (selectedPayments.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No payments selected',
        text2: 'Please select at least one payment to proceed',
        swipeable: false,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSubmitting(true);
    try {
      const paymentIds = selectedPayments.map((payment) => payment.bookingid);
      const result = (await processPaymentMutation.mutateAsync(paymentIds)) as any;

      if (result.data?.amount === 0) {
        Toast.show({
          type: 'success',
          text1: 'Payment processed successfully',
          swipeable: false,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        // Configure Razorpay
        const options = {
          key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID,
          name: 'Vitraag Vigyaan Aashray',
          image: 'https://vitraagvigyaan.org/img/logo.png',
          description: `Payment for ${selectedPayments.length} item${selectedPayments.length > 1 ? 's' : ''}`,
          amount: result.data.amount,
          currency: 'INR',
          order_id: result.data.id,
          prefill: {
            email: user.email,
            contact: user.mobno,
            name: user.issuedto,
          },
          theme: { color: colors.orange },
        };

        // Open Razorpay
        RazorpayCheckout.open(options)
          .then((_rzrpayData: any) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Toast.show({
              type: 'success',
              text1: 'Payment successful',
              swipeable: false,
            });
            router.replace('/bookingConfirmation');
          })
          .catch((error: any) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            router.replace('/paymentFailed');
          });
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: 'Failed to process payment',
        text2: error.message || 'Please try again',
        swipeable: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPaymentDisabledMessage = () => {
    if (totalPendingAmount === 0) {
      return 'No payments required';
    }
    if (user.country !== 'India') {
      return 'Payment only available for users in India';
    }
    return 'Payment not available';
  };

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const isSelected = selectedPayments.some((payment) => payment.bookingid === item.bookingid);

      return (
        <TouchableOpacity
          onPress={() => handleSelectPayment(item)}
          activeOpacity={isPaymentAllowed ? 0.7 : 1}
          disabled={!isPaymentAllowed}
          className={`mb-4 rounded-xl p-4 ${
            isSelected && isPaymentAllowed ? 'border border-secondary bg-orange-50' : 'bg-white'
          } ${
            !isPaymentAllowed ? 'opacity-50' : ''
          } ${Platform.OS === 'ios' ? 'shadow-md shadow-gray-200' : 'shadow-lg shadow-gray-300'}`}
          style={{
            elevation: isSelected && isPaymentAllowed ? 3 : 1,
          }}>
          <View className="flex-row justify-between">
            <View className="flex-1">
              <Text
                className={`font-pbold text-base ${!isPaymentAllowed ? 'text-gray-400' : 'text-black'}`}
                numberOfLines={1}>
                {item.name || 'Payment'}
              </Text>
              <Text
                className={`font-pregular text-sm ${!isPaymentAllowed ? 'text-gray-300' : 'text-gray-500'}`}>
                {moment(item.start_day).format('DD MMM YYYY')}
              </Text>
              <View className="mt-2 flex-row items-center">
                <Text
                  className={`font-pmedium text-base ${!isPaymentAllowed ? 'text-gray-400' : 'text-black'}`}>
                  ₹ {item.amount.toLocaleString()}
                </Text>
                <View
                  className={`ml-2 rounded-full px-2 py-1 ${!isPaymentAllowed ? 'bg-gray-100' : 'bg-orange-100'}`}>
                  <Text
                    className={`font-pregular text-xs ${!isPaymentAllowed ? 'text-gray-400' : 'text-orange-600'}`}>
                    {item.category}
                  </Text>
                </View>
              </View>
            </View>
            <View className="justify-center">
              <View
                className={`h-6 w-6 items-center justify-center rounded-md border ${
                  isSelected && isPaymentAllowed
                    ? 'border-secondary bg-secondary'
                    : !isPaymentAllowed
                      ? 'border-gray-200 bg-gray-100'
                      : 'border-gray-300'
                }`}>
                {isSelected && isPaymentAllowed && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [selectedPayments, handleSelectPayment, isPaymentAllowed]
  );

  const ListHeader = useCallback(() => {
    if (!pendingPayments.length) return null;

    return (
      <View className="mb-4">
        {!isPaymentAllowed && (
          <View className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <View className="flex-row items-center">
              <MaterialIcons
                name="info-outline"
                size={20}
                color="#F59E0B"
                style={{ marginRight: 8 }}
              />
              <Text className="flex-1 font-pmedium text-sm text-yellow-700">
                {getPaymentDisabledMessage()}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSelectAll}
          activeOpacity={isPaymentAllowed ? 0.7 : 1}
          disabled={!isPaymentAllowed}
          className={`mb-4 flex-row items-center ${!isPaymentAllowed ? 'opacity-50' : ''}`}>
          <View
            className={`mr-2 h-6 w-6 items-center justify-center rounded-md border ${
              allSelected && isPaymentAllowed
                ? 'border-secondary bg-secondary'
                : !isPaymentAllowed
                  ? 'border-gray-200 bg-gray-100'
                  : 'border-gray-300'
            }`}>
            {allSelected && isPaymentAllowed && (
              <Ionicons name="checkmark" size={16} color="white" />
            )}
          </View>
          <Text
            className={`font-pmedium text-base ${!isPaymentAllowed ? 'text-gray-400' : 'text-black'}`}>
            Select All ({pendingPayments.length})
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [
    pendingPayments.length,
    allSelected,
    handleSelectAll,
    isPaymentAllowed,
    getPaymentDisabledMessage,
  ]);

  if (isLoading) {
    return (
      <SafeAreaView className="h-full bg-white">
        <PageHeader title="Pending Payments" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="h-full bg-white">
        <PageHeader title="Pending Payments" />
        <CustomErrorMessage />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-full bg-white">
      <PageHeader title="Pending Payments" />

      <FlashList
        className="flex-grow"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: selectedPayments.length > 0 && isPaymentAllowed ? 80 : 16,
        }}
        data={pendingPayments}
        estimatedItemSize={100}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View className="h-full flex-1 items-center justify-center pt-40">
            <CustomEmptyMessage message={`Look at you,\nfinancially responsible superstar!`} />
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyExtractor={(item) => item.bookingid}
        extraData={[selectedPayments, isPaymentAllowed]}
      />

      {selectedPayments.length > 0 && isPaymentAllowed && (
        <View className="absolute bottom-0 left-0 right-0 bg-white p-4 shadow-lg shadow-gray-300">
          <View className="mb-2 flex-row justify-between">
            <Text className="font-pmedium text-base text-black">
              {selectedPayments.length} {selectedPayments.length === 1 ? 'item' : 'items'} selected
            </Text>
            <Text className="font-pbold text-base text-black">
              ₹ {totalAmount.toLocaleString()}
            </Text>
          </View>
          <CustomButton
            text={`Pay ₹${totalAmount.toLocaleString()}`}
            handlePress={handleProceedToPayment}
            containerStyles="min-h-[50px]"
            isLoading={isSubmitting}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default PendingPayments;
