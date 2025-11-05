import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  InteractionManager,
  Platform,
} from 'react-native';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, icons } from '@/src/constants';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/stores';
import PageHeader from '@/src/components/PageHeader';
import CustomEmptyMessage from '@/src/components/CustomEmptyMessage';
import CustomErrorMessage from '@/src/components/CustomErrorMessage';
import CustomButton from '@/src/components/CustomButton';
import CustomModal from '@/src/components/CustomModal';
import handleAPICall from '@/src/utils/HandleApiCall';
import moment from 'moment';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';

interface Transaction {
  bookingid: string;
  amount: number;
  category: string;
  status: string;
  discount: number;
  description: string | null;
  createdAt: string;
  booked_for: string | null;
  booked_by: string | null;
  start_day: string | null;
  end_day: string | null;
  name: string | null;
  booked_for_name: string | null;
}

interface ApiResponse {
  message: string;
  data: Transaction[];
  pagination: {
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

const PaymentTimer = ({ createdAt }: { createdAt: string }) => {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    isUrgent: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, isExpired: false, isUrgent: false });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const created = moment.utc(createdAt);
      const expiry = created.clone().add(24, 'hours');
      const now = moment.utc();
      const diff = expiry.diff(now);

      if (diff <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, isExpired: true, isUrgent: false });
        return;
      }

      const duration = moment.duration(diff);
      const hours = Math.floor(duration.asHours());
      const minutes = duration.minutes();
      const seconds = duration.seconds();
      const isUrgent = diff <= 3 * 60 * 60 * 1000;

      setTimeRemaining({ hours, minutes, seconds, isExpired: false, isUrgent });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  const getTimerColor = () => {
    if (timeRemaining.isExpired) return 'text-red-600';
    if (timeRemaining.isUrgent) return 'text-orange-600';
    return 'text-green-600';
  };

  const getTimerBgColor = () => {
    if (timeRemaining.isExpired) return 'bg-red-50 border-red-200';
    if (timeRemaining.isUrgent) return 'bg-orange-50 border-orange-200';
    return 'bg-green-50 border-green-200';
  };

  const getTimerIcon = () => {
    if (timeRemaining.isExpired) return 'time';
    if (timeRemaining.isUrgent) return 'timer';
    return 'time-outline';
  };

  const formatTime = () => {
    if (timeRemaining.isExpired) return 'Expired';

    const { hours, minutes, seconds } = timeRemaining;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <View className={`flex-row items-center rounded-lg border px-2 py-1 ${getTimerBgColor()}`}>
      <Ionicons
        name={getTimerIcon()}
        size={12}
        color={timeRemaining.isExpired ? '#DC2626' : timeRemaining.isUrgent ? '#EA580C' : '#059669'}
        style={{ marginRight: 4 }}
      />
      <Text className={`font-pmedium text-xs ${getTimerColor()}`}>{formatTime()}</Text>
    </View>
  );
};

const PendingPayments = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const queryClient = useQueryClient();
  const [selectedPayments, setSelectedPayments] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInternationalWarning, setShowInternationalWarning] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['transactions', user.cardno, 'pending,cash pending,failed'],
    queryFn: async () => {
      return new Promise<Transaction[]>((resolve, reject) => {
        handleAPICall(
          'GET',
          '/profile/transactions',
          {
            cardno: user.cardno,
            page: 1,
            page_size: 100,
            status: 'pending,cash pending,failed',
          },
          null,
          (res: ApiResponse) => {
            // Handle the new API response structure
            resolve(Array.isArray(res.data) ? res.data : []);
          },
          () => {},
          (error) => reject(new Error(error?.message || 'Failed to fetch pending payments'))
        );
      });
    },
    staleTime: 1000 * 60 * 30,
    refetchOnMount: 'always',
  });

  const processPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return new Promise((resolve, reject) => {
        handleAPICall(
          'POST',
          '/razorpay/payv2',
          null,
          {
            cardno: user.cardno,
            data: data,
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
        queryKey: ['transactions', user.cardno, 'pending,cash pending,failed'],
        refetchType: 'all',
        exact: true,
      });
    },
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const pendingPayments = useMemo(() => (data as Transaction[]) || [], [data]);
  const totalAmount = useMemo(
    () => selectedPayments.reduce((total, payment) => total + payment.amount, 0),
    [selectedPayments]
  );

  const isTransactionExpired = useCallback((transaction: Transaction) => {
    // Cash pending payments never expire
    if (transaction.status === 'cash pending') {
      return false;
    }

    const created = moment.utc(transaction.createdAt);
    const expiry = created.clone().add(24, 'hours');
    return moment.utc().isAfter(expiry);
  }, []);

  // Calculate total of non-expired payments
  const totalNonExpiredAmount = useMemo(() => {
    return pendingPayments
      .filter((payment) => !isTransactionExpired(payment))
      .reduce((total, payment) => total + payment.amount, 0);
  }, [pendingPayments, isTransactionExpired]);

  // Calculate total of expired payments
  const totalExpiredAmount = useMemo(() => {
    return pendingPayments
      .filter((payment) => isTransactionExpired(payment))
      .reduce((total, payment) => total + payment.amount, 0);
  }, [pendingPayments, isTransactionExpired]);

  const isPaymentAllowed = useMemo(() => {
    return totalNonExpiredAmount > 0;
  }, [totalNonExpiredAmount]);

  const isInternationalUser = useMemo(() => {
    return user.country !== 'India';
  }, [user.country]);

  const categoryStats = useMemo(() => {
    const stats = pendingPayments.reduce(
      (acc, item) => {
        const category = item.category || 'other';
        if (!acc[category]) {
          acc[category] = { count: 0, amount: 0, expiredCount: 0, expiredAmount: 0 };
        }
        acc[category].count += 1;
        acc[category].amount += item.amount;

        if (isTransactionExpired(item)) {
          acc[category].expiredCount += 1;
          acc[category].expiredAmount += item.amount;
        }
        return acc;
      },
      {} as Record<
        string,
        { count: number; amount: number; expiredCount: number; expiredAmount: number }
      >
    );

    return Object.entries(stats).map(([category, data]) => ({
      category,
      ...data,
    }));
  }, [pendingPayments, isTransactionExpired]);

  const validPayments = useMemo(() => {
    return pendingPayments.filter((payment) => !isTransactionExpired(payment));
  }, [pendingPayments, isTransactionExpired]);

  const allSelected = useMemo(
    () => validPayments.length > 0 && selectedPayments.length === validPayments.length,
    [selectedPayments, validPayments]
  );

  const handleSelectPayment = useCallback(
    (payment: Transaction) => {
      if (!isPaymentAllowed) return;

      if (isTransactionExpired(payment)) {
        Toast.show({
          type: 'error',
          text1: 'Payment expired',
          text2: 'This payment window has expired',
          swipeable: false,
        });
        return;
      }

      setSelectedPayments((prev) => {
        const isSelected = prev.some(
          (item) => item.bookingid === payment.bookingid && item.category === payment.category
        );
        const newSelection = isSelected
          ? prev.filter(
              (item) => item.bookingid !== payment.bookingid || item.category !== payment.category
            )
          : [...prev, payment];
        return newSelection;
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [isPaymentAllowed, isTransactionExpired]
  );

  const handleSelectAll = useCallback(() => {
    if (!isPaymentAllowed || pendingPayments.length === 0) return;

    const validPayments = pendingPayments.filter((payment) => !isTransactionExpired(payment));
    setSelectedPayments(allSelected ? [] : validPayments);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [pendingPayments, allSelected, isPaymentAllowed, isTransactionExpired]);

  const proceedWithPayment = async () => {
    // Dismiss the modal first (if shown) to avoid native modal conflicts
    setShowInternationalWarning(false);

    // Prevent double invocations while in-flight
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const paymentData = selectedPayments.map((payment) => ({
        bookingid: payment.bookingid,
        category: payment.category,
      }));

      const result = (await processPaymentMutation.mutateAsync(paymentData)) as any;

      if (result.data?.amount === 0) {
        Toast.show({
          type: 'success',
          text1: 'Payment processed successfully',
          swipeable: false,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

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
      } as const;

      // Ensure RN Modal has fully dismissed and UI interactions have settled
      await new Promise<void>((resolve) =>
        InteractionManager.runAfterInteractions(() => resolve())
      );
      await new Promise((resolve) => setTimeout(resolve, Platform.OS === 'android' ? 200 : 100));

      await RazorpayCheckout.open(options);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Payment successful',
        swipeable: false,
      });
      queryClient.invalidateQueries({
        queryKey: ['transactions', user.cardno, 'pending,cash pending,failed'],
        refetchType: 'all',
        exact: true,
      });
      router.replace('/paymentConfirmation');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (error?.message) {
        Toast.show({
          type: 'error',
          text1: 'Failed to process payment',
          text2: error.message,
          swipeable: false,
        });
      }
      router.replace('/paymentFailed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (isSubmitting) return; // guard

    if (!isPaymentAllowed) {
      Toast.show({
        type: 'error',
        text1: 'Payment not available',
        text2: 'No payments required',
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

    const expiredPayments = selectedPayments.filter((payment) => isTransactionExpired(payment));
    if (expiredPayments.length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Some payments have expired',
        text2: 'Please remove expired payments from selection',
        swipeable: false,
      });
      return;
    }

    // Show warning for international users
    if (isInternationalUser) {
      setShowInternationalWarning(true);
      return;
    }

    // Proceed directly for Indian users
    await proceedWithPayment();
  };

  const getItemTitle = (item: Transaction) => {
    if (item.name) {
      return item.name;
    }

    switch (item.category?.toLowerCase()) {
      case 'room':
        return 'Room Booking';
      case 'flat':
        return 'Flat Booking';
      case 'adhyayan':
        return 'Adhyayan Booking';
      case 'utsav':
        return 'Utsav Booking';
      case 'travel':
        return 'Travel Booking';
      case 'breakfast':
        return 'Breakfast Booking';
      case 'lunch':
        return 'Lunch Booking';
      case 'dinner':
        return 'Dinner Booking';
      default:
        return 'Miscellaneous Booking';
    }
  };

  const getDateRange = (startDay: string | null, endDay: string | null) => {
    if (!startDay) {
      return 'Date not specified';
    }

    const start = moment(startDay);
    const end = moment(endDay ? endDay : startDay);

    if (start.isSame(end, 'day')) {
      return start.format('DD MMM YYYY');
    } else {
      return `${start.format('DD MMM')} - ${end.format('DD MMM YYYY')}`;
    }
  };

  const getDuration = (startDay: string | null, endDay: string | null) => {
    if (!startDay) {
      return 'Duration not specified';
    }

    const start = moment(startDay);
    const end = moment(endDay ? endDay : startDay);
    const nights = end.diff(start, 'days');

    if (nights === 0) {
      return '1 night';
    } else {
      return `${nights} nights`;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'room':
        return icons.room;
      case 'flat':
        return icons.room;
      case 'adhyayan':
        return icons.adhyayan;
      case 'utsav':
        return icons.events;
      case 'travel':
        return icons.travel;
      case 'breakfast':
      case 'lunch':
      case 'dinner':
        return icons.food;
      default:
        return icons.room;
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => {
      const isSelected = selectedPayments.some(
        (payment) => payment.bookingid === item.bookingid && payment.category === item.category
      );
      const isExpired = isTransactionExpired(item);
      const isCashPending = item.status === 'cash pending';

      const categoryColors = {
        bg: 'bg-secondary-50',
        text: 'text-gray-700',
        border: 'border-secondary-50',
      };

      return (
        <TouchableOpacity
          onPress={() => handleSelectPayment(item)}
          activeOpacity={!isExpired ? 0.6 : 1}
          disabled={isExpired}
          className={`mb-3 rounded-xl border ${
            isSelected && !isExpired
              ? 'border-secondary bg-secondary-50'
              : isExpired
                ? 'border-gray-200 bg-gray-50/70' // Subtle gray background
                : 'border-gray-200 bg-white'
          }`}
          style={{
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: isSelected && !isExpired ? 3 : 0,
            },
            shadowOpacity: isSelected && !isExpired ? 0.08 : 0,
            shadowRadius: isSelected && !isExpired ? 6 : 0,
            elevation: isSelected && !isExpired ? 3 : 0,
          }}>
          {/* Timer badge - Only show for non-cash pending payments */}
          {!isCashPending && (
            <View className="absolute -right-1 -top-1 z-10">
              <PaymentTimer createdAt={item.createdAt} />
            </View>
          )}

          <View className="p-4">
            <View className="mb-3 flex-row items-start justify-between">
              <View className="flex-1 flex-row items-start">
                <View
                  className={`mr-3 rounded-full ${
                    isExpired
                      ? 'border-gray-200 bg-gray-100'
                      : `${categoryColors.bg} ${categoryColors.border} border`
                  }`}>
                  <Image
                    source={getCategoryIcon(item.category)}
                    className="h-10 w-10"
                    resizeMode="contain"
                    style={{ opacity: isExpired ? 0.5 : 1 }}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`font-psemibold text-sm leading-tight ${
                      isExpired ? 'text-gray-500' : 'text-gray-900'
                    }`}
                    numberOfLines={2}>
                    {getItemTitle(item)}
                  </Text>
                  <View className="mt-1 flex-row items-baseline">
                    <Text
                      className={`font-pbold text-lg ${
                        isExpired ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                      ₹ {item.amount.toLocaleString()}
                    </Text>
                    {isExpired && (
                      <Text className="ml-2 font-pregular text-xs text-red-500">Expired</Text>
                    )}
                  </View>
                </View>
              </View>

              <View className="ml-2">
                <View
                  className={`h-6 w-6 items-center justify-center rounded-full ${
                    isSelected && !isExpired
                      ? 'border-2 border-secondary bg-secondary'
                      : isExpired
                        ? 'border border-gray-300 bg-gray-100' // Thinner border, filled background
                        : 'border-2 border-gray-300 bg-white'
                  }`}>
                  {isSelected && !isExpired && <Ionicons name="checkmark" size={14} color="#fff" />}
                  {isExpired && (
                    <View className="h-2 w-2 rounded-full bg-gray-400" /> // Subtle dot indicator
                  )}
                </View>
              </View>
            </View>

            <View className={`mb-3 h-px ${isExpired ? 'bg-gray-200/70' : 'bg-gray-200'}`} />

            <View className="gap-y-2">
              {(item.start_day || item.end_day) && (
                <View className="flex-row items-center">
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={isExpired ? '#9CA3AF' : '#6B7280'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    className={`font-pregular text-xs ${
                      isExpired ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    {getDateRange(item.start_day, item.end_day)}
                  </Text>
                  {item.start_day && item.end_day && (
                    <Text
                      className={`ml-2 font-pregular text-xs ${
                        isExpired ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      • {getDuration(item.start_day, item.end_day)}
                    </Text>
                  )}
                </View>
              )}

              {item.booked_for_name && (
                <View className="flex-row items-center">
                  <Ionicons
                    name="person-outline"
                    size={14}
                    color={isExpired ? '#9CA3AF' : '#6B7280'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    className={`font-pregular text-xs ${
                      isExpired ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    Booked for {item.booked_for_name}
                  </Text>
                </View>
              )}

              {item.description && (
                <View className="flex-row items-center">
                  <Ionicons
                    name="information-outline"
                    size={14}
                    color={isExpired ? '#9CA3AF' : '#6B7280'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    className={`font-pregular text-xs ${
                      isExpired ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    {item.description}
                  </Text>
                </View>
              )}

              {isCashPending && (
                <View className="flex-row items-center">
                  <Ionicons
                    name="cash-outline"
                    size={14}
                    color={isExpired ? '#9CA3AF' : '#F59E0B'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    className={`font-pregular text-xs ${
                      isExpired ? 'text-gray-400' : 'text-amber-600'
                    }`}>
                    Cash payment pending
                  </Text>
                </View>
              )}

              <View className="flex-row items-center justify-between pt-1">
                <View
                  className={`rounded-full border px-2 py-1 ${
                    isExpired
                      ? 'border-gray-200 bg-gray-100'
                      : `${categoryColors.bg} ${categoryColors.border}`
                  }`}>
                  <Text
                    className={`font-pmedium text-xs capitalize ${
                      isExpired ? 'text-gray-400' : categoryColors.text
                    }`}>
                    {item.category}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [selectedPayments, handleSelectPayment, isTransactionExpired]
  );

  const SummaryCard = useCallback(() => {
    if (!pendingPayments.length) return null;

    const validPayments = pendingPayments.filter((payment) => !isTransactionExpired(payment));
    const expiredCount = pendingPayments.length - validPayments.length;

    return (
      <View className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-psemibold text-base text-gray-900">Payment Summary</Text>
          <View className="rounded-full bg-secondary-50 px-2.5 py-1">
            <Text className="font-pmedium text-xs text-primary">
              {pendingPayments.length} total items
            </Text>
          </View>
        </View>

        <View className="mb-3 flex-row items-end justify-between">
          <View>
            <Text className="mb-1 font-pregular text-xs text-gray-600">Payable Amount</Text>
            <Text className="font-pbold text-xl text-gray-900">
              ₹ {totalNonExpiredAmount.toLocaleString()}
            </Text>
            <Text className="font-pregular text-xs text-green-600">
              {validPayments.length} active payment{validPayments.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <View className="flex-row gap-x-1.5">
            {categoryStats.slice(0, 3).map((stat, index) => (
              <View
                key={stat.category}
                className="rounded-lg border border-gray-200 bg-gray-100 px-2 py-1">
                <Text
                  className={`font-pmedium text-xs ${index === 0 ? 'text-gray-800' : 'text-gray-700'} capitalize`}>
                  {stat.category} ({stat.count - stat.expiredCount})
                </Text>
              </View>
            ))}
          </View>
        </View>

        {expiredCount > 0 && (
          <View className="mt-2 rounded-lg bg-red-50 p-2.5">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center">
                <MaterialIcons
                  name="info-outline"
                  size={16}
                  color="#DC2626"
                  style={{ marginRight: 6 }}
                />
                <Text className="font-pregular text-xs text-red-700">
                  {expiredCount} expired payment{expiredCount > 1 ? 's' : ''} worth ₹{' '}
                  {totalExpiredAmount.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }, [
    pendingPayments.length,
    totalNonExpiredAmount,
    totalExpiredAmount,
    categoryStats,
    isTransactionExpired,
  ]);

  const ListHeader = useCallback(() => {
    if (!pendingPayments.length) return null;

    const validPayments = pendingPayments.filter((payment) => !isTransactionExpired(payment));

    return (
      <View className="mb-2">
        <SummaryCard />

        {isInternationalUser && (
          <View className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <View className="flex-row items-start">
              <MaterialIcons
                name="info-outline"
                size={18}
                color="#D97706"
                style={{ marginRight: 8, marginTop: 2 }}
              />
              <View className="flex-1">
                <Text className="mb-1 font-psemibold text-xs text-amber-800">
                  International Payment Notice
                </Text>
                <Text className="font-pregular text-xs text-amber-700">
                  You are attempting to make a payment from {user.country}. Unfortunately, we do not
                  accept payments from outside India.
                </Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSelectAll}
          activeOpacity={isPaymentAllowed ? 0.6 : 1}
          disabled={!isPaymentAllowed || validPayments.length === 0}
          className={`mb-4 flex-row items-center rounded-xl p-3 ${
            !isPaymentAllowed || validPayments.length === 0 ? 'opacity-50' : ''
          }`}>
          <View
            className={`mr-3 h-6 w-6 items-center justify-center rounded-full border-2 ${
              allSelected && isPaymentAllowed
                ? 'border-secondary bg-secondary-50'
                : !isPaymentAllowed
                  ? 'border-gray-300 bg-gray-100'
                  : 'border-gray-400 bg-white'
            }`}>
            {allSelected && isPaymentAllowed && <Ionicons name="checkmark" size={14} />}
          </View>
          <Text
            className={`font-pmedium text-sm ${
              !isPaymentAllowed || validPayments.length === 0 ? 'text-gray-400' : 'text-gray-900'
            }`}>
            {allSelected ? 'Deselect All' : 'Select All'} ({validPayments.length} valid items)
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [
    pendingPayments.length,
    allSelected,
    handleSelectAll,
    isPaymentAllowed,
    isInternationalUser,
    user.country,
    SummaryCard,
    isTransactionExpired,
  ]);

  if (isLoading) {
    return (
      <SafeAreaView className="h-full bg-gray-50" edges={['top']}>
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
      <SafeAreaView className="h-full bg-gray-50" edges={['top']}>
        <PageHeader title="Pending Payments" />
        <CustomErrorMessage />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-full" edges={['top']}>
      <PageHeader title="Pending Payments" />

      <FlashList
        className="flex-grow"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: selectedPayments.length > 0 && isPaymentAllowed ? 120 + insets.bottom : 20,
        }}
        data={pendingPayments}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View className="h-full flex-1 items-center justify-center pt-40">
            <CustomEmptyMessage message={`Look at you,\nfinancially responsible superstar!`} />
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyExtractor={(item) => `${item.bookingid}-${item.category}-${item.createdAt}`}
        extraData={[selectedPayments, isPaymentAllowed]}
      />

      {selectedPayments.length > 0 && isPaymentAllowed && (
        <View className="absolute bottom-0 left-0 right-0">
          <View
            className="rounded-t-xl border-t border-gray-200 bg-white shadow-lg"
            style={{ paddingBottom: insets.bottom }}>
            <View className="p-4">
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
                  <Text className="font-pmedium text-xs text-gray-800">
                    {isInternationalUser ? 'International Payment' : 'Ready to pay'}
                  </Text>
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
        </View>
      )}

      <CustomModal
        visible={showInternationalWarning}
        onClose={() => setShowInternationalWarning(false)}
        title="Warning"
        showActionButton={false}>
        <View>
          <View className="mb-4">
            <View className="mb-4 items-center">
              <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <Ionicons name="warning" size={32} color="#F59E0B" />
              </View>
            </View>

            <Text className="mb-3 text-center font-pregular text-sm text-gray-700">
              You are attempting to make a payment from{' '}
              <Text className="font-psemibold">{user.country}</Text>.
            </Text>

            <View className="rounded-lg bg-amber-50 p-3">
              <Text className="mb-2 font-pmedium text-xs text-amber-900">
                Important Information:
              </Text>
              <Text className="mb-1 font-pregular text-xs text-amber-800">
                We currently do not support international payments. If you intend to pay using an
                Indian bank account, you may proceed with the payment.
              </Text>
            </View>
          </View>

          <View className="gap-y-3">
            <CustomButton
              text="I Understand, Proceed"
              handlePress={proceedWithPayment}
              containerStyles="min-h-[44px]"
              textStyles="font-psemibold text-sm text-white"
              isLoading={isSubmitting}
            />
          </View>
        </View>
      </CustomModal>
    </SafeAreaView>
  );
};

export default PendingPayments;
