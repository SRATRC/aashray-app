import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGlobalContext } from '../../context/GlobalProvider';
import { icons, colors, status } from '../../constants';
import PageHeader from '../../components/PageHeader';
import CustomEmptyMessage from '../../components/CustomEmptyMessage';
import CustomErrorMessage from '../../components/CustomErrorMessage';
import CustomButton from '../../components/CustomButton';
import handleAPICall from '../../utils/HandleApiCall';
import moment from 'moment';
import { Image } from 'react-native';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
// @ts-ignore
// import RazorpayCheckout from 'react-native-razorpay';

const PendingPayments = () => {
  const { user } = useGlobalContext();
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
          '/profile/pay',
          null,
          {
            cardno: user.cardno,
            bookingids: paymentIds,
          },
          (res: any) => {
            console.log(JSON.stringify(res));
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
      Toast.show({
        type: 'success',
        text1: 'Payment initiated successfully',
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

  const handleSelectPayment = useCallback((payment: any) => {
    setSelectedPayments((prev) => {
      const isSelected = prev.some((item) => item.bookingid === payment.bookingid);
      const newSelection = isSelected
        ? prev.filter((item) => item.bookingid !== payment.bookingid)
        : [...prev, payment];
      return newSelection;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleSelectAll = useCallback(() => {
    if (pendingPayments.length > 0) {
      setSelectedPayments(allSelected ? [] : [...pendingPayments]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [pendingPayments, allSelected]);

  const isPaymentSelected = useCallback(
    (bookingId: string) => {
      return selectedPayments.some((payment) => payment.bookingid === bookingId);
    },
    [selectedPayments]
  );

  const handleProceedToPayment = async () => {
    if (selectedPayments.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No payments selected',
        text2: 'Please select at least one payment to proceed',
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
        // RazorpayCheckout.open(options)
        //   .then((_rzrpayData: any) => {
        //     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        //     Toast.show({
        //       type: 'success',
        //       text1: 'Payment successful',
        //     });
        //   })
        //   .catch((error: any) => {
        //     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        //     Toast.show({
        //       type: 'error',
        //       text1: 'Payment failed',
        //       text2: error.reason || 'Please try again',
        //     });
        //   });
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: 'Failed to process payment',
        text2: error.message || 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const isSelected = selectedPayments.some((payment) => payment.bookingid === item.bookingid);

      return (
        <TouchableOpacity
          onPress={() => handleSelectPayment(item)}
          activeOpacity={0.7}
          className={`mb-4 rounded-xl p-4 ${
            isSelected ? 'border border-secondary bg-orange-50' : 'bg-white'
          } ${Platform.OS === 'ios' ? 'shadow-md shadow-gray-200' : 'shadow-lg shadow-gray-300'}`}
          style={{ elevation: isSelected ? 3 : 1 }}>
          <View className="flex-row justify-between">
            <View className="flex-1">
              <Text className="font-pbold text-base text-black" numberOfLines={1}>
                {item.name || 'Payment'}
              </Text>
              <Text className="font-pregular text-sm text-gray-500">
                {moment(item.start_day).format('DD MMM YYYY')}
              </Text>
              <View className="mt-2 flex-row items-center">
                <Text className="font-pmedium text-base text-black">
                  ₹ {item.amount.toLocaleString()}
                </Text>
                <View className="ml-2 rounded-full bg-orange-100 px-2 py-1">
                  <Text className="font-pregular text-xs text-orange-600">{item.category}</Text>
                </View>
              </View>
            </View>
            <View className="justify-center">
              <View
                className={`h-6 w-6 items-center justify-center rounded-md border ${
                  isSelected ? 'border-secondary bg-secondary' : 'border-gray-300'
                }`}>
                {isSelected && (
                  <Image
                    source={icons.tick}
                    className="h-4 w-4"
                    resizeMode="contain"
                    tintColor="white"
                  />
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [selectedPayments, handleSelectPayment]
  );

  const ListHeader = useCallback(() => {
    if (!pendingPayments.length) return null;

    return (
      <View className="mb-4">
        <TouchableOpacity
          onPress={handleSelectAll}
          activeOpacity={0.7}
          className="mb-4 flex-row items-center">
          <View
            className={`mr-2 h-6 w-6 items-center justify-center rounded-md border ${
              allSelected ? 'border-secondary bg-secondary' : 'border-gray-300'
            }`}>
            {allSelected && (
              <Image
                source={icons.tick}
                className="h-4 w-4"
                resizeMode="contain"
                tintColor="white"
              />
            )}
          </View>
          <Text className="font-pmedium text-base text-black">
            Select All ({pendingPayments.length})
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [pendingPayments.length, allSelected, handleSelectAll]);

  if (isLoading) {
    return (
      <SafeAreaView className="h-full bg-white">
        <PageHeader title="Pending Payments" icon={icons.backArrow} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="h-full bg-white">
        <PageHeader title="Pending Payments" icon={icons.backArrow} />
        <CustomErrorMessage />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-full bg-white">
      <PageHeader title="Pending Payments" icon={icons.backArrow} />

      <FlashList
        className="flex-grow"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: selectedPayments.length > 0 ? 80 : 16,
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
        extraData={selectedPayments}
      />

      {selectedPayments.length > 0 && (
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
