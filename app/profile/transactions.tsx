import {
  View,
  Text,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useAuthStore } from '@/stores';
import { icons } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '@/components/PageHeader';
import CustomEmptyMessage from '@/components/CustomEmptyMessage';
import handleAPICall from '@/utils/HandleApiCall';
import moment from 'moment';

const Transactions = () => {
  const { user } = useAuthStore();
  const [selectedChip, setSelectedChip] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = async ({ pageParam = 1 }) => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/profile/transactions',
        {
          cardno: user.cardno,
          page: pageParam,
          status: selectedChip,
        },
        null,
        (res: any) => {
          resolve(Array.isArray(res.data) ? res.data : []);
        },
        () => {},
        (error) => reject(new Error(error?.message || 'Failed to fetch transactions'))
      );
    });
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch }: any =
    useInfiniteQuery({
      queryKey: ['transactions', user.cardno, selectedChip],
      queryFn: fetchTransactions,
      initialPageParam: 1,
      staleTime: 1000 * 60 * 30,
      getNextPageParam: (lastPage: any, pages: any) => {
        if (!lastPage || lastPage.length === 0) return undefined;
        return pages.length + 1;
      },
    });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const renderItem = ({ item }: { item: any }) => <TransactionItem item={item} />;

  return (
    <SafeAreaView className="h-full" edges={['top']}>
      <PageHeader title="Transaction History" />
      <FlashList
        className="flex-grow"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 20,
        }}
        data={data?.pages?.flatMap((page: any) => page) || []}
        estimatedItemSize={140}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        ListEmptyComponent={() => (
          <View className="h-full flex-1 items-center justify-center pt-40">
            {isError ? (
              <View className="items-center justify-center px-6">
                <Text className="mb-2 text-center text-lg font-semibold text-gray-800">
                  Oops! Something went wrong
                </Text>
                <Text className="mb-6 text-center text-gray-600">
                  Unable to load transactions. Please check your connection and try again.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    refetch();
                  }}
                  className="rounded-lg bg-secondary px-6 py-3"
                  activeOpacity={0.7}>
                  <Text className="font-semibold text-white">Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <CustomEmptyMessage message={'No transactions at this moment!'} />
            )}
          </View>
        )}
        ListFooterComponent={
          <View className="items-center pt-4">
            {(isFetchingNextPage || isLoading) && <ActivityIndicator size="small" />}
            {!hasNextPage && data?.pages?.[0]?.length > 0 && (
              <Text className="text-sm text-gray-500">No more transactions</Text>
            )}
          </View>
        }
        onEndReachedThreshold={0.1}
        onEndReached={() => hasNextPage && fetchNextPage()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
};

const TransactionItem = ({ item }: { item: any }) => {
  const getCategoryIcon = useMemo(() => {
    const categoryIconMap: Record<string, any> = {
      room: icons.room,
      flat: icons.room,
      travel: icons.travel,
      adhyayan: icons.adhyayan,
      utsav: icons.events,
      event: icons.events,
      breakfast: icons.food,
      lunch: icons.food,
      dinner: icons.food,
    };
    return categoryIconMap[item.category] || icons.miscellaneousTransaction;
  }, [item.category]);

  const getStatusStyles = useMemo(() => {
    const styleMap: Record<string, { textColor: string; bgColor: string; text: string }> = {
      pending: { textColor: 'text-amber-600', bgColor: 'bg-amber-50', text: 'Pending' },
      captured: { textColor: 'text-green-600', bgColor: 'bg-green-50', text: 'Completed' },
      completed: { textColor: 'text-green-600', bgColor: 'bg-green-50', text: 'Completed' },
      cancelled: { textColor: 'text-red-600', bgColor: 'bg-red-50', text: 'Cancelled' },
      failed: { textColor: 'text-red-600', bgColor: 'bg-red-50', text: 'Failed' },
      authorized: { textColor: 'text-blue-600', bgColor: 'bg-blue-50', text: 'Authorized' },
      credited: { textColor: 'text-green-600', bgColor: 'bg-green-50', text: 'Credited' },
    };
    return (
      styleMap[item.status] || {
        textColor: 'text-gray-600',
        bgColor: 'bg-gray-50',
        text: item.status || 'Unknown',
      }
    );
  }, [item.status]);

  const getCategoryName = useMemo(() => {
    const categoryNameMap: Record<string, string> = {
      room: 'Room',
      flat: 'Flat',
      travel: 'Travel',
      adhyayan: 'Adhyayan',
      utsav: 'Utsav',
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
    };
    return categoryNameMap[item.category] || 'Transaction';
  }, [item.category]);

  const getItemTitle = useMemo(() => {
    return item.name || getCategoryName;
  }, [item.name, getCategoryName]);

  const formatDateRange = useMemo(() => {
    if (!item.start_day) return null;

    const startDate = moment(item.start_day);
    const endDate = moment(item.end_day);

    if (item.end_day && !startDate.isSame(endDate, 'day')) {
      return `${startDate.format('DD MMM')} - ${endDate.format('DD MMM YYYY')}`;
    }

    return startDate.format('DD MMM YYYY');
  }, [item.start_day, item.end_day]);

  const getDuration = useMemo(() => {
    if (!item.start_day || !item.end_day) return null;

    const start = moment(item.start_day);
    const end = moment(item.end_day);
    const days = end.diff(start, 'days') + 1;

    return days === 1 ? '1 day' : `${days} days`;
  }, [item.start_day, item.end_day]);

  const displayAmount = useMemo(() => {
    const finalAmount = item.amount - (item.discount || 0);
    const isCredit = item.status === 'credited' || finalAmount < 0;
    return {
      amount: Math.abs(finalAmount),
      isCredit,
      textColor: isCredit ? 'text-green-600' : 'text-gray-900',
      prefix: isCredit ? '+' : '',
    };
  }, [item.amount, item.discount, item.status]);

  const categoryColors = {
    bg: 'bg-secondary-50',
    text: 'text-gray-700',
    border: 'border-secondary-50',
  };

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      className="mb-3 rounded-xl border border-gray-200 bg-white"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
      }}>
      <View className="p-4">
        {/* Header Section */}
        <View className="mb-3 flex-row items-start justify-between">
          <View className="flex-1 flex-row items-start">
            <View
              className={`mr-3 rounded-full ${categoryColors.bg} ${categoryColors.border} border`}>
              <Image source={getCategoryIcon} className="h-10 w-10" resizeMode="contain" />
            </View>
            <View className="flex-1">
              <Text
                className="font-psemibold text-sm leading-tight text-gray-900"
                numberOfLines={2}>
                {getItemTitle}
              </Text>
              <Text className="mt-1 font-pbold text-lg text-gray-900">
                {displayAmount.prefix}₹{displayAmount.amount.toLocaleString()}
              </Text>
            </View>
          </View>

          <View className="ml-2">
            <View className={`rounded-full px-2 py-1 ${getStatusStyles.bgColor}`}>
              <Text className={`font-pmedium text-xs ${getStatusStyles.textColor}`}>
                {getStatusStyles.text}
              </Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View className="mb-3 h-px bg-gray-200" />

        {/* Details Section */}
        <View className="gap-y-2">
          {/* Date and Duration */}
          {formatDateRange && (
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={14} color="#6B7280" style={{ marginRight: 6 }} />
              <Text className="font-pregular text-xs text-gray-600">{formatDateRange}</Text>
              {getDuration && (
                <Text className="ml-2 font-pregular text-xs text-gray-500">• {getDuration}</Text>
              )}
            </View>
          )}

          {/* Booked For */}
          {item.booked_for_name && (
            <View className="flex-row items-center">
              <Ionicons
                name="person-outline"
                size={14}
                color="#6B7280"
                style={{ marginRight: 6 }}
              />
              <Text className="font-pregular text-xs text-gray-600">
                Booked for {item.booked_for_name}
              </Text>
            </View>
          )}

          {/* Transaction Date */}
          <View className="flex-row items-center">
            <Ionicons
              name="calendar-outline"
              size={14}
              color="#6B7280"
              style={{ marginRight: 6 }}
            />
            <Text className="font-pregular text-xs text-gray-600">
              Transaction on {moment(item.createdAt).format('DD MMM YYYY [at] hh:mm A')}
            </Text>
          </View>

          {/* Description */}
          {item.description && (
            <View className="flex-row items-start">
              <Ionicons
                name="document-text-outline"
                size={14}
                color="#6B7280"
                style={{ marginRight: 6, marginTop: 1 }}
              />
              <Text className="flex-1 font-pregular text-xs text-gray-600">{item.description}</Text>
            </View>
          )}

          {/* Discount Information */}
          {item.discount > 0 && (
            <View className="flex-row items-center">
              <Ionicons
                name="pricetag-outline"
                size={14}
                color="#059669"
                style={{ marginRight: 6 }}
              />
              <Text className="font-pregular text-xs text-gray-600">
                Original: ₹{item.amount.toLocaleString()}
              </Text>
              <Text className="ml-2 font-pregular text-xs text-green-600">
                Saved: ₹{item.discount.toLocaleString()}
              </Text>
            </View>
          )}

          {/* Bottom Row with Category */}
          <View className="flex-row items-center justify-between pt-1">
            <View
              className={`rounded-full border px-2 py-1 ${categoryColors.bg} ${categoryColors.border}`}>
              <Text className={`font-pmedium text-xs capitalize ${categoryColors.text}`}>
                {item.category}
              </Text>
            </View>

            {/* Booking ID (if needed for debugging) */}
            {/* <Text className="font-pregular text-xs text-gray-400">
              #{item.bookingid?.slice(-8)}
            </Text> */}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default Transactions;
