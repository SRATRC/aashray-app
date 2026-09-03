import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import moment from 'moment';
import React, { useState, useCallback, useMemo, useSyncExternalStore } from 'react';
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
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import CustomButton from '@/src/components/CustomButton';
import CustomEmptyMessage from '@/src/components/CustomEmptyMessage';
import CustomErrorMessage from '@/src/components/CustomErrorMessage';
import PageHeader from '@/src/components/PageHeader';
import { colors, icons, status } from '@/src/constants';
import { useAuthStore } from '@/src/stores';
import handleAPICall from '@/src/utils/HandleApiCall';
import checkIsInternationalUser from '@/src/utils/isInternationalUser';
import { invalidatePostBookingQueries } from '@/src/utils/queryInvalidation';
import shouldShowRoomNumberRule from '@/src/utils/shouldShowRoomNumber';

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
  roomno?: string | null;
  roomtype?: string | null;
  stay?: string | null;
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

const computeTimeRemaining = (createdAt: string, now = Date.now()) => {
  const expiry = moment.utc(createdAt).add(24, 'hours');
  const diff = expiry.diff(moment.utc(now));

  if (diff <= 0) {
    return { label: 'Expired', isExpired: true, isUrgent: false };
  }

  const duration = moment.duration(diff);
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();
  const seconds = duration.seconds();

  return {
    label:
      hours > 0 ? `${hours}h ${minutes}m` : minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`,
    isExpired: false,
    isUrgent: diff <= 3 * 60 * 60 * 1000,
  };
};

type ClockListener = () => void;

let paymentClockNow = Date.now();
let paymentClockInterval: ReturnType<typeof setInterval> | null = null;
const paymentClockListeners = new Set<ClockListener>();

const paymentClock = {
  getSnapshot: () => paymentClockNow,
  subscribe: (listener: ClockListener) => {
    paymentClockListeners.add(listener);
    if (!paymentClockInterval) {
      // The module-level timestamp is from whenever the last subscriber left
      // (or app start); refresh it so the first snapshot isn't stale.
      paymentClockNow = Date.now();
      paymentClockInterval = setInterval(() => {
        paymentClockNow = Date.now();
        paymentClockListeners.forEach((notify) => notify());
      }, 1000);
    }

    return () => {
      paymentClockListeners.delete(listener);
      if (paymentClockListeners.size === 0 && paymentClockInterval) {
        clearInterval(paymentClockInterval);
        paymentClockInterval = null;
      }
    };
  },
};

// Minute-granularity view of the same clock, for the list container. Expiry
// only needs minute precision, and subscribing the whole screen to the
// second-level tick would re-render every row each second.
const paymentMinuteClock = {
  getSnapshot: () => Math.floor(paymentClockNow / 60000),
  subscribe: paymentClock.subscribe,
};

const isTransactionExpiredAt = (transaction: Transaction, nowMs: number) => {
  // Cash pending payments never expire
  if (transaction.status === 'cash pending') {
    return false;
  }
  return moment.utc(nowMs).isAfter(moment.utc(transaction.createdAt).add(24, 'hours'));
};

const PaymentTimer = ({ createdAt }: { createdAt: string }) => {
  const now = useSyncExternalStore(paymentClock.subscribe, paymentClock.getSnapshot);
  const timeRemaining = useMemo(() => computeTimeRemaining(createdAt, now), [createdAt, now]);

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

  return (
    <View className={`flex-row items-center rounded-lg border px-2 py-1 ${getTimerBgColor()}`}>
      <Ionicons
        name={getTimerIcon()}
        size={12}
        color={timeRemaining.isExpired ? '#DC2626' : timeRemaining.isUrgent ? '#EA580C' : '#059669'}
        style={{ marginRight: 4 }}
      />
      <Text className={`font-pmedium text-xs ${getTimerColor()}`}>{timeRemaining.label}</Text>
    </View>
  );
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
  }
  return `${start.format('DD MMM')} - ${end.format('DD MMM YYYY')}`;
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
  }
  return `${nights} nights`;
};

const isFlatBooking = (item: Transaction) =>
  item.category?.toLowerCase() === 'flat' || item.roomtype?.toLowerCase() === 'flat';

const isEventBooking = (item: Transaction) => item.category?.toLowerCase() === 'utsav';

const getRoomLabel = (item: Transaction) => {
  if (isFlatBooking(item)) return 'Flat';
  return 'Room';
};

const getRoomValue = (item: Transaction) => {
  if (isEventBooking(item)) return item.stay;
  return item.roomno;
};

const shouldShowRoomNumber = (item: Transaction) => {
  const value = getRoomValue(item);
  if (!value) return false;

  return shouldShowRoomNumberRule({
    alwaysShow: isEventBooking(item) || isFlatBooking(item),
    isPaid:
      item.status === status.STATUS_PAYMENT_COMPLETED ||
      item.status === status.STATUS_CASH_COMPLETED,
    checkinDate: item.start_day,
  });
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

interface PendingPaymentRowProps {
  item: Transaction;
  isSelected: boolean;
  isExpired: boolean;
  isCashPending: boolean;
  onSelect: (item: Transaction) => void;
}

const SELECTED_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 3,
};

const PendingPaymentRow = React.memo(
  ({ item, isSelected, isExpired, isCashPending, onSelect }: PendingPaymentRowProps) => {
    const handlePress = useCallback(() => onSelect(item), [item, onSelect]);

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={!isExpired ? 0.6 : 1}
        disabled={isExpired}
        className={`mb-3 rounded-xl border ${
          isSelected && !isExpired
            ? 'border-secondary bg-secondary-50'
            : isExpired
              ? 'border-gray-200 bg-gray-50/70'
              : 'border-gray-200 bg-white'
        }`}
        style={isSelected && !isExpired ? SELECTED_SHADOW : undefined}>
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
                    : 'border border-secondary-50 bg-secondary-50'
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
                      ? 'border border-gray-300 bg-gray-100'
                      : 'border-2 border-gray-300 bg-white'
                }`}>
                {isSelected && !isExpired && <Ionicons name="checkmark" size={14} color="#fff" />}
                {isExpired && <View className="h-2 w-2 rounded-full bg-gray-400" />}
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

            {(item.category?.toLowerCase() === 'room' ||
              isFlatBooking(item) ||
              isEventBooking(item)) && (
              <View className="flex-row items-center">
                <Ionicons
                  name="key-outline"
                  size={14}
                  color={isExpired ? '#9CA3AF' : '#6B7280'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  className={`font-pregular text-xs ${
                    isExpired ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                  {getRoomLabel(item)}{' '}
                  {shouldShowRoomNumber(item) ? getRoomValue(item) : 'shown 24h before check-in'}
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
                  isExpired ? 'border-gray-200 bg-gray-100' : 'border-secondary-50 bg-secondary-50'
                }`}>
                <Text
                  className={`font-pmedium text-xs capitalize ${
                    isExpired ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                  {item.category}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

interface CategoryStat {
  category: string;
  count: number;
  amount: number;
  expiredCount: number;
  expiredAmount: number;
}

// Module-level, so FlashList sees a stable header component type. Defined
// inside the screen (as useCallback components) their identity changed with
// their deps and every change unmounted and remounted the whole header subtree.
const SummaryCard = ({
  totalCount,
  validCount,
  totalNonExpiredAmount,
  totalExpiredAmount,
  categoryStats,
}: {
  totalCount: number;
  validCount: number;
  totalNonExpiredAmount: number;
  totalExpiredAmount: number;
  categoryStats: CategoryStat[];
}) => {
  if (!totalCount) return null;

  const expiredCount = totalCount - validCount;

  return (
    <View className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-psemibold text-base text-gray-900">Payment Summary</Text>
        <View className="rounded-full bg-secondary-50 px-2.5 py-1">
          <Text className="font-pmedium text-xs text-primary">{totalCount} total items</Text>
        </View>
      </View>

      <View className="mb-3 flex-row items-end justify-between">
        <View>
          <Text className="mb-1 font-pregular text-xs text-gray-600">Payable Amount</Text>
          <Text className="font-pbold text-xl text-gray-900">
            ₹ {totalNonExpiredAmount.toLocaleString()}
          </Text>
          <Text className="font-pregular text-xs text-green-600">
            {validCount} active payment{validCount !== 1 ? 's' : ''}
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
};

const ListHeader = ({
  totalCount,
  validCount,
  totalNonExpiredAmount,
  totalExpiredAmount,
  categoryStats,
  isInternationalUser,
  userCountry,
  allSelected,
  isPaymentAllowed,
  onSelectAll,
}: {
  totalCount: number;
  validCount: number;
  totalNonExpiredAmount: number;
  totalExpiredAmount: number;
  categoryStats: CategoryStat[];
  isInternationalUser: boolean;
  userCountry?: string | null;
  allSelected: boolean;
  isPaymentAllowed: boolean;
  onSelectAll: () => void;
}) => {
  if (!totalCount) return null;

  return (
    <View className="mb-2">
      <SummaryCard
        totalCount={totalCount}
        validCount={validCount}
        totalNonExpiredAmount={totalNonExpiredAmount}
        totalExpiredAmount={totalExpiredAmount}
        categoryStats={categoryStats}
      />

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
                You are paying from {userCountry}. We do not support international cards — use an
                Indian bank account, or pay at the Research Centre on arrival.
              </Text>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity
        onPress={onSelectAll}
        activeOpacity={isPaymentAllowed ? 0.6 : 1}
        disabled={!isPaymentAllowed || validCount === 0}
        className={`mb-4 flex-row items-center rounded-xl p-3 ${
          !isPaymentAllowed || validCount === 0 ? 'opacity-50' : ''
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
            !isPaymentAllowed || validCount === 0 ? 'text-gray-400' : 'text-gray-900'
          }`}>
          {allSelected ? 'Deselect All' : 'Select All'} ({validCount} valid items)
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const PendingPayments = () => {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const queryClient = useQueryClient();
  const [selectedPayments, setSelectedPayments] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
            data,
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
      // Both this screen's ['transactions', ...] key and the home alert's
      // ['pendingPayments', ...] key describe the same server state; the
      // zero-amount path returns without navigating, so nothing else
      // invalidates the home alert if we don't do it here.
      invalidatePostBookingQueries(queryClient);
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

  // Ticks once a minute, so payments that expire while the screen is open drop
  // out of the totals and the selectable set instead of staying frozen at
  // whatever the last render happened to compute.
  const clockMinute = useSyncExternalStore(
    paymentMinuteClock.subscribe,
    paymentMinuteClock.getSnapshot
  );

  const isTransactionExpired = useCallback(
    (transaction: Transaction) => isTransactionExpiredAt(transaction, clockMinute * 60000),
    [clockMinute]
  );

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

  const isInternationalUser = useMemo(() => checkIsInternationalUser(user), [user.country]);

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
      invalidatePostBookingQueries(queryClient);
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

    await proceedWithPayment();
  };

  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => {
      const isSelected = selectedPayments.some(
        (payment) => payment.bookingid === item.bookingid && payment.category === item.category
      );
      const isExpired = isTransactionExpired(item);
      const isCashPending = item.status === 'cash pending';

      return (
        <PendingPaymentRow
          item={item}
          isSelected={isSelected}
          isExpired={isExpired}
          isCashPending={isCashPending}
          onSelect={handleSelectPayment}
        />
      );
    },
    [selectedPayments, handleSelectPayment, isTransactionExpired]
  );

  const extraData = useMemo(
    () => [selectedPayments, isPaymentAllowed],
    [selectedPayments, isPaymentAllowed]
  );

  return (
    <SafeAreaView className="h-full" edges={['top']}>
      <PageHeader title="Pending Payments" />

      {isError && (
        <View className="flex-1 items-center justify-center">
          <CustomErrorMessage errorTitle="Error" errorMessage="Failed to fetch pending payments" />
        </View>
      )}

      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F1AC09" />
          <Text className="mt-3 font-pregular text-sm text-gray-600">Loading your payments...</Text>
        </View>
      )}

      {!isLoading && !isError && (
        <FlashList
          className="flex-grow"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom:
              selectedPayments.length > 0 && isPaymentAllowed ? 120 + insets.bottom : 20,
          }}
          data={pendingPayments}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          ListHeaderComponent={
            <ListHeader
              totalCount={pendingPayments.length}
              validCount={validPayments.length}
              totalNonExpiredAmount={totalNonExpiredAmount}
              totalExpiredAmount={totalExpiredAmount}
              categoryStats={categoryStats}
              isInternationalUser={isInternationalUser}
              userCountry={user.country}
              allSelected={allSelected}
              isPaymentAllowed={isPaymentAllowed}
              onSelectAll={handleSelectAll}
            />
          }
          ListEmptyComponent={
            <View className="h-full flex-1 items-center justify-center pt-40">
              <CustomEmptyMessage message={`Look at you,\nfinancially responsible superstar!`} />
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyExtractor={(item) => `${item.bookingid}-${item.category}-${item.createdAt}`}
          extraData={extraData}
        />
      )}

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
    </SafeAreaView>
  );
};

export default PendingPayments;
