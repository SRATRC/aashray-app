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
    return totalPendingAmount > 0 && user.country === 'India';
  }, [totalPendingAmount, user.country]);

  // Category statistics
  const categoryStats = useMemo(() => {
    const stats = pendingPayments.reduce(
      (acc, item) => {
        const category = item.category || 'other';
        if (!acc[category]) {
          acc[category] = { count: 0, amount: 0 };
        }
        acc[category].count += 1;
        acc[category].amount += item.amount;
        return acc;
      },
      {} as Record<string, { count: number; amount: number }>
    );

    return Object.entries(stats).map(([category, data]) => ({
      category,
      ...data,
    }));
  }, [pendingPayments]);

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

  // Helper functions for better display
  const getItemTitle = (item: any) => {
    if (item.name) {
      return item.name;
    }

    switch (item.category?.toLowerCase()) {
      case 'room':
        return 'Room Booking';
      case 'adhyayan':
        return 'Adhyayan Session';
      case 'utsav':
        return 'Utsav Event';
      default:
        return 'Booking';
    }
  };

  const getDateRange = (startDay: string, endDay: string) => {
    const start = moment(startDay);
    const end = moment(endDay);

    if (start.isSame(end, 'day')) {
      return start.format('DD MMM YYYY');
    } else {
      return `${start.format('DD MMM')} - ${end.format('DD MMM YYYY')}`;
    }
  };

  const getDuration = (startDay: string, endDay: string) => {
    const start = moment(startDay);
    const end = moment(endDay);
    const days = end.diff(start, 'days') + 1;

    if (days === 1) {
      return '1 day';
    } else {
      return `${days} days`;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'room':
        return 'bed-outline';
      case 'adhyayan':
        return 'book-outline';
      case 'utsav':
        return 'calendar-outline';
      default:
        return 'bookmark-outline';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'room':
        return { bg: 'bg-secondary-50', text: 'text-gray-700', border: 'border-secondary-50' };
      case 'adhyayan':
        return { bg: 'bg-secondary-50', text: 'text-gray-700', border: 'border-secondary-50' };
      case 'utsav':
        return { bg: 'bg-secondary-50', text: 'text-gray-700', border: 'border-secondary-50' };
      default:
        return { bg: 'bg-secondary-50', text: 'text-gray-700', border: 'border-secondary-50' };
    }
  };

  const isUpcoming = (startDay: string) => {
    return moment(startDay).isAfter(moment(), 'day');
  };

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const isSelected = selectedPayments.some((payment) => payment.bookingid === item.bookingid);
      const categoryColors = getCategoryColor(item.category);
      const upcoming = isUpcoming(item.start_day);

      return (
        <TouchableOpacity
          onPress={() => handleSelectPayment(item)}
          activeOpacity={isPaymentAllowed ? 0.6 : 1}
          disabled={!isPaymentAllowed}
          className={`mb-3 rounded-xl border ${
            isSelected && isPaymentAllowed
              ? 'border-secondary bg-secondary-50'
              : 'border-gray-200 bg-white'
          } ${!isPaymentAllowed ? 'opacity-50' : ''}`}
          style={{
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: isSelected && isPaymentAllowed ? 3 : 1,
            },
            shadowOpacity: isSelected && isPaymentAllowed ? 0.08 : 0.04,
            shadowRadius: isSelected && isPaymentAllowed ? 6 : 3,
            elevation: isSelected && isPaymentAllowed ? 3 : 1,
          }}>
          {/* Status indicator */}
          {upcoming && (
            <View className="absolute -right-1 -top-1 z-10">
              <View className="rounded-full border border-secondary bg-secondary-50 px-2 py-0.5">
                <Text className="font-pregular text-xs text-primary">Upcoming</Text>
              </View>
            </View>
          )}

          <View className="p-4">
            {/* Header with icon and title */}
            <View className="mb-3 flex-row items-start justify-between">
              <View className="flex-1 flex-row items-start">
                <View
                  className={`mr-3 rounded-lg p-2 ${categoryColors.bg} ${categoryColors.border} border`}>
                  <Ionicons
                    name={getCategoryIcon(item.category) as any}
                    size={18}
                    color={!isPaymentAllowed ? '#9CA3AF' : '#4B5563'}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`font-psemibold text-sm leading-tight ${!isPaymentAllowed ? 'text-gray-400' : 'text-gray-900'}`}
                    numberOfLines={2}>
                    {getItemTitle(item)}
                  </Text>
                  <Text
                    className={`mt-1 font-pbold text-lg ${!isPaymentAllowed ? 'text-gray-400' : 'text-gray-900'}`}>
                    ₹ {item.amount.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Selection indicator */}
              <View className="ml-2">
                <View
                  className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
                    isSelected && isPaymentAllowed
                      ? 'border-secondary bg-secondary'
                      : !isPaymentAllowed
                        ? 'border-gray-300 bg-gray-100'
                        : 'border-gray-300 bg-white'
                  }`}>
                  {isSelected && isPaymentAllowed && (
                    <Ionicons name="checkmark" size={14} color="#161622" />
                  )}
                </View>
              </View>
            </View>

            {/* Divider */}
            <View className="mb-3 h-px bg-gray-200" />

            {/* Details section */}
            <View className="gap-y-2">
              {/* Date and duration */}
              <View className="flex-row items-center">
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={!isPaymentAllowed ? '#9CA3AF' : '#6B7280'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  className={`font-pregular text-xs ${!isPaymentAllowed ? 'text-gray-400' : 'text-gray-600'}`}>
                  {getDateRange(item.start_day, item.end_day)}
                </Text>
                <Text
                  className={`ml-2 font-pregular text-xs ${!isPaymentAllowed ? 'text-gray-400' : 'text-gray-500'}`}>
                  • {getDuration(item.start_day, item.end_day)}
                </Text>
              </View>

              {/* Booked by information */}
              {item.booked_by_name && (
                <View className="flex-row items-center">
                  <Ionicons
                    name="person-outline"
                    size={14}
                    color={!isPaymentAllowed ? '#9CA3AF' : '#6B7280'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    className={`font-pregular text-xs ${!isPaymentAllowed ? 'text-gray-400' : 'text-gray-600'}`}>
                    Booked by {item.booked_by_name}
                  </Text>
                </View>
              )}

              {/* Category badge */}
              <View className="flex-row items-center justify-between pt-1">
                <View
                  className={`rounded-full border px-2 py-1 ${!isPaymentAllowed ? 'border-gray-200 bg-gray-100' : `${categoryColors.bg} ${categoryColors.border}`}`}>
                  <Text
                    className={`font-pmedium text-xs capitalize ${!isPaymentAllowed ? 'text-gray-400' : categoryColors.text}`}>
                    {item.category}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [selectedPayments, handleSelectPayment, isPaymentAllowed]
  );

  const SummaryCard = useCallback(() => {
    if (!pendingPayments.length) return null;

    return (
      <View className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-psemibold text-base text-gray-900">Payment Summary</Text>
          <View className="rounded-full bg-secondary-50 px-2.5 py-1">
            <Text className="font-pmedium text-xs text-primary">
              {pendingPayments.length} items
            </Text>
          </View>
        </View>

        <View className="flex-row items-end justify-between">
          <View>
            <Text className="mb-1 font-pregular text-xs text-gray-600">Total Amount</Text>
            <Text className="font-pbold text-xl text-gray-900">
              ₹ {totalPendingAmount.toLocaleString()}
            </Text>
          </View>

          <View className="flex-row gap-x-1.5">
            {categoryStats.slice(0, 3).map((stat, index) => (
              <View
                key={stat.category}
                className="rounded-lg border border-gray-200 bg-gray-100 px-2 py-1">
                <Text
                  className={`font-pmedium text-xs ${index === 0 ? 'text-gray-800' : 'text-gray-700'} capitalize`}>
                  {stat.category} ({stat.count})
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }, [pendingPayments.length, totalPendingAmount, categoryStats]);

  const ListHeader = useCallback(() => {
    if (!pendingPayments.length) return null;

    return (
      <View className="mb-2">
        <SummaryCard />

        {!isPaymentAllowed && (
          <View className="mb-4 rounded-xl border border-gray-300 bg-gray-50 p-4">
            <View className="flex-row items-center">
              <MaterialIcons
                name="info-outline"
                size={18}
                color="#6B7280"
                style={{ marginRight: 8 }}
              />
              <Text className="flex-1 font-pmedium text-xs text-gray-700">
                {getPaymentDisabledMessage()}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSelectAll}
          activeOpacity={isPaymentAllowed ? 0.6 : 1}
          disabled={!isPaymentAllowed}
          className={`mb-4 flex-row items-center rounded-xl bg-gray-50 p-3 ${!isPaymentAllowed ? 'opacity-50' : ''}`}>
          <View
            className={`mr-3 h-6 w-6 items-center justify-center rounded-full border-2 ${
              allSelected && isPaymentAllowed
                ? 'border-secondary bg-secondary-50'
                : !isPaymentAllowed
                  ? 'border-gray-300 bg-gray-100'
                  : 'border-gray-400 bg-white'
            }`}>
            {allSelected && isPaymentAllowed && (
              <Ionicons name="checkmark" size={14} color="#161622" />
            )}
          </View>
          <Text
            className={`font-pmedium text-sm ${!isPaymentAllowed ? 'text-gray-400' : 'text-gray-900'}`}>
            {allSelected ? 'Deselect All' : 'Select All'} ({pendingPayments.length} items)
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
    SummaryCard,
  ]);

  if (isLoading) {
    return (
      <SafeAreaView className="h-full bg-gray-50">
        <PageHeader title="Pending Payments" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F1AC09" />
          <Text className="mt-3 font-pregular text-sm text-gray-600">Loading your payments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="h-full bg-gray-50">
        <PageHeader title="Pending Payments" />
        <CustomErrorMessage />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-full bg-gray-50">
      <PageHeader title="Pending Payments" />

      <FlashList
        className="flex-grow"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: selectedPayments.length > 0 && isPaymentAllowed ? 90 : 20,
        }}
        data={pendingPayments}
        estimatedItemSize={120}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View className="h-full flex-1 items-center justify-center pt-40">
            <CustomEmptyMessage message={`Look at you,\nfinancially responsible superstar!`} />
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#F1AC09']}
            tintColor="#F1AC09"
          />
        }
        keyExtractor={(item) => item.bookingid}
        extraData={[selectedPayments, isPaymentAllowed]}
      />

      {/* Enhanced bottom payment bar */}
      {selectedPayments.length > 0 && isPaymentAllowed && (
        <View className="absolute bottom-0 left-0 right-0">
          <View className="border-t border-gray-200 bg-white p-4 shadow-lg">
            <View className="mb-3 flex-row items-center justify-between">
              <View>
                <Text className="font-pregular text-xs text-gray-600">
                  {selectedPayments.length} {selectedPayments.length === 1 ? 'item' : 'items'}{' '}
                  selected
                </Text>
                <Text className="font-pbold text-lg text-gray-900">
                  ₹ {totalAmount.toLocaleString()}
                </Text>
              </View>
              <View className="rounded-lg border border-secondary bg-secondary-50 px-3 py-1.5">
                <Text className="font-pmedium text-xs text-gray-800">Ready to pay</Text>
              </View>
            </View>
            <CustomButton
              text={`Proceed to Payment • ₹${totalAmount.toLocaleString()}`}
              handlePress={handleProceedToPayment}
              containerStyles="min-h-[48px]"
              textStyles="font-psemibold text-sm text-white"
              isLoading={isSubmitting}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default PendingPayments;
