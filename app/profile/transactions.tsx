import { View, Text, Image, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import moment from 'moment';
import PageHeader from '../../components/PageHeader';
import CustomChipGroup from '../../components/CustomChipGroup';
import CustomTag from '../../components/CustomTag';
import CustomEmptyMessage from '../../components/CustomEmptyMessage';
import handleAPICall from '../../utils/HandleApiCall';
import { useGlobalContext } from '../../context/GlobalProvider';
import { icons, status, types } from '../../constants';
import CustomErrorMessage from '~/components/CustomErrorMessage';

const CHIPS = [
  types.transaction_type_all,
  types.transaction_type_pending,
  types.transaction_type_completed,
  types.transaction_type_credited,
  types.transaction_type_cancelled,
];

const Transactions = () => {
  const { user } = useGlobalContext();
  const [selectedChip, setSelectedChip] = useState(types.transaction_type_all);
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
        () => reject(new Error('Failed to fetch transactions'))
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
    <SafeAreaView className="h-full bg-white">
      <FlashList
        className="flex-grow-1 mt-2"
        data={data?.pages?.flatMap((page: any) => page) || []}
        estimatedItemSize={103}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        ListHeaderComponent={
          <View className="flex-col">
            <PageHeader title="Transaction History" icon={icons.backArrow} />
            {isError ? (
              <CustomErrorMessage />
            ) : (
              <View className="mx-4 mb-6">
                <CustomChipGroup
                  chips={CHIPS}
                  selectedChip={selectedChip}
                  handleChipPress={setSelectedChip}
                />
              </View>
            )}
          </View>
        }
        ListFooterComponent={
          <View className="items-center">
            {(isFetchingNextPage || isLoading) && <ActivityIndicator />}
            {!hasNextPage && data?.pages?.[0]?.length > 0 && (
              <Text>No more transactions at the moment</Text>
            )}
            {!isFetchingNextPage && data?.pages?.[0]?.length === 0 && (
              <CustomEmptyMessage message="You don’t have any transactions yet" />
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
      [types.ROOM_DETAILS_TYPE]: icons.room,
      [types.GUEST_ROOM_DETAILS_TYPE]: icons.room,
      [types.TRAVEL_DETAILS_TYPE]: icons.travel,
      [types.GUEST_TRAVEL_DETAILS_TYPE]: icons.travel,
      [types.ADHYAYAN_DETAILS_TYPE]: icons.adhyayan,
      [types.GUEST_ADHYAYAN_DETAILS_TYPE]: icons.adhyayan,
      [types.EVENT_DETAILS_TYPE]: icons.events,
      [types.GUEST_EVENT_DETAILS_TYPE]: icons.events,
      [types.GUEST_BREAKFAST_DETAILS_TYPE]: icons.food,
      [types.GUEST_LUNCH_DETAILS_TYPE]: icons.food,
      [types.GUEST_DINNER_DETAILS_TYPE]: icons.food,
    };
    return categoryIconMap[item.category] || icons.logout;
  }, [item.category]);

  const getStatusDetails = useMemo(() => {
    const statusMap: Record<string, { text: string; textColor: string; bgColor: string }> = {
      [status.STATUS_PAYMENT_PENDING]: {
        text: 'Payment Due',
        textColor: 'text-secondary-200',
        bgColor: 'bg-secondary-50',
      },
      [status.STATUS_CASH_PENDING]: {
        text: 'Payment Due',
        textColor: 'text-secondary-200',
        bgColor: 'bg-secondary-50',
      },
      [status.STATUS_CASH_COMPLETED]: {
        text: 'Payment Completed',
        textColor: 'text-green-200',
        bgColor: 'bg-green-100',
      },
      [status.STATUS_PAYMENT_COMPLETED]: {
        text: 'Payment Completed',
        textColor: 'text-green-200',
        bgColor: 'bg-green-100',
      },
      [status.STATUS_CREDITED]: {
        text: 'Credited',
        textColor: 'text-secondary-200',
        bgColor: 'bg-secondary-50',
      },
      [status.STATUS_ADMIN_CANCELLED]: {
        text: 'Cancelled',
        textColor: 'text-red-200',
        bgColor: 'bg-red-100',
      },
      [status.STATUS_CANCELLED]: {
        text: 'Cancelled',
        textColor: 'text-red-200',
        bgColor: 'bg-red-100',
      },
    };
    return statusMap[item.status] || { text: '', textColor: '', bgColor: '' };
  }, [item.status]);

  const getCategoryName = useMemo(() => {
    const categoryNameMap: Record<string, string> = {
      [types.ROOM_DETAILS_TYPE]: 'Room Booking',
      [types.GUEST_ROOM_DETAILS_TYPE]: 'Guest Room Booking',
      [types.TRAVEL_DETAILS_TYPE]: 'Travel Booking',
      [types.GUEST_TRAVEL_DETAILS_TYPE]: 'Guest Travel Booking',
      [types.ADHYAYAN_DETAILS_TYPE]: 'Adhyayan Booking',
      [types.GUEST_ADHYAYAN_DETAILS_TYPE]: 'Guest Adhyayan Booking',
      [types.EVENT_DETAILS_TYPE]: 'Event Booking Booking',
      [types.GUEST_EVENT_DETAILS_TYPE]: 'Guest Event Booking',
      [types.GUEST_BREAKFAST_DETAILS_TYPE]: 'Guest Breakfast Booking',
      [types.GUEST_LUNCH_DETAILS_TYPE]: 'Guest Lunch Booking',
      [types.GUEST_DINNER_DETAILS_TYPE]: 'Guest Dinner Booking',
    };
    return categoryNameMap[item.category] || 'Other';
  }, [item.category]);

  return (
    <View className="px-5">
      <View
        className={`mb-5 rounded-2xl bg-white p-3 shadow-lg ${Platform.OS === 'ios' ? 'shadow-gray-200' : 'shadow-gray-400'}`}>
        <View className="flex flex-row items-center gap-x-4">
          <Image source={getCategoryIcon} className="h-10 w-10" resizeMode="contain" />
          <View className="flex flex-col gap-y-2">
            <CustomTag
              text={getStatusDetails.text}
              textStyles={getStatusDetails.textColor}
              containerStyles={getStatusDetails.bgColor}
            />
            <Text className="font-pmedium">{getCategoryName}</Text>
            <Text className="font-pmedium text-secondary">
              {moment(item.createdAt).format('Do MMMM, YYYY')}
            </Text>
            {item.description && (
              <Text className="font-pregular text-gray-500">{item.description}</Text>
            )}
          </View>
        </View>
        <View className="absolute bottom-3 right-3">
          <Text className="font-pmedium text-lg text-black">₹ {item.amount}</Text>
        </View>
      </View>
    </View>
  );
};

export default Transactions;
