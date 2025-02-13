import { View, Text, Image, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { icons, status, types } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import { FlashList } from '@shopify/flash-list';
import PageHeader from '../../components/PageHeader';
import handleAPICall from '../../utils/HandleApiCall';
import CustomChipGroup from '../../components/CustomChipGroup';
import CustomTag from '../../components/CustomTag';
import moment from 'moment';
import CustomEmptyMessage from '../../components/CustomEmptyMessage';

const CHIPS = [
  types.transaction_type_all,
  types.transaction_type_pending,
  types.transaction_type_completed,
  types.transaction_type_credited,
  types.transaction_type_cancelled,
];

const transactions = () => {
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

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: queryStatus,
    isLoading,
    isError,
    refetch,
  }: any = useInfiniteQuery({
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

  const renderItem = ({ item }: any) => <TransactionItem item={item} />;

  const renderHeader = () => (
    <View className="flex-col">
      <PageHeader title={'Transaction History'} icon={icons.backArrow} />
      <View className="mx-4 mb-6">
        <CustomChipGroup
          chips={CHIPS}
          selectedChip={selectedChip}
          handleChipPress={(chip) => setSelectedChip(chip)}
        />
      </View>
    </View>
  );

  const renderFooter = () => (
    <View className="items-center">
      {(isFetchingNextPage || isLoading) && <ActivityIndicator />}
      {!hasNextPage && data?.pages?.[0]?.length > 0 && <Text>No more bookings at the moment</Text>}
      {!isFetchingNextPage && data?.pages?.[0]?.length == 0 && (
        <CustomEmptyMessage
          lottiePath={require('../../assets/lottie/empty.json')}
          message={'You dont have any transactions yet'}
        />
      )}
    </View>
  );

  if (isError)
    return (
      <Text className="items-center justify-center font-pregular text-lg text-red-500">
        An error occurred
      </Text>
    );

  return (
    <SafeAreaView className="h-full bg-white">
      <FlashList
        className="flex-grow-1 mt-2"
        data={data?.pages?.flatMap((page: any) => page) || []}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={103}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReachedThreshold={0.1}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
};

const TransactionItem = ({ item }: any) => {
  return (
    <View className="px-5">
      <View
        className={`mb-5 rounded-2xl bg-white p-3 ${
          Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'
        }`}>
        <View className="flex flex-row items-center gap-x-4">
          <View className="flex h-full justify-center">
            <Image
              source={
                item.category == types.ROOM_DETAILS_TYPE ||
                item.category == types.GUEST_ROOM_DETAILS_TYPE
                  ? icons.room
                  : item.category == types.TRAVEL_DETAILS_TYPE ||
                      item.category == types.GUEST_TRAVEL_DETAILS_TYPE
                    ? icons.travel
                    : item.category == types.ADHYAYAN_DETAILS_TYPE ||
                        item.category == types.GUEST_ADHYAYAN_DETAILS_TYPE
                      ? icons.adhyayan
                      : item.category == types.EVENT_DETAILS_TYPE ||
                          item.category == types.GUEST_EVENT_DETAILS_TYPE
                        ? icons.events
                        : icons.logout
              }
              className="h-10 w-10"
              resizeMode="contain"
            />
          </View>
          <View className="flex flex-col gap-y-2">
            <CustomTag
              text={
                item.status == status.STATUS_PAYMENT_PENDING ||
                item.status == status.STATUS_CASH_PENDING
                  ? 'Payment Due'
                  : item.status == status.STATUS_CASH_COMPLETED ||
                      item.status == status.STATUS_PAYMENT_COMPLETED
                    ? 'Payment Completed'
                    : item.status == status.STATUS_CREDITED
                      ? 'Credited'
                      : item.status == status.STATUS_ADMIN_CANCELLED ||
                          item.status == status.STATUS_CANCELLED
                        ? 'Cancelled'
                        : ''
              }
              textStyles={
                item.status == status.STATUS_CANCELLED ||
                item.status == status.STATUS_ADMIN_CANCELLED
                  ? 'text-red-200'
                  : item.status == status.STATUS_PAYMENT_PENDING ||
                      item.status == status.STATUS_CASH_PENDING
                    ? 'text-secondary-200'
                    : item.status == status.STATUS_CASH_COMPLETED ||
                        item.status == status.STATUS_PAYMENT_COMPLETED ||
                        item.status == status.STATUS_CREDITED
                      ? 'text-green-200'
                      : ''
              }
              containerStyles={`${
                item.status == status.STATUS_CANCELLED ||
                item.status == status.STATUS_ADMIN_CANCELLED
                  ? 'bg-red-100'
                  : item.status == status.STATUS_PAYMENT_PENDING ||
                      item.status == status.STATUS_CASH_PENDING
                    ? 'bg-secondary-50'
                    : item.status == status.STATUS_CASH_COMPLETED ||
                        item.status == status.STATUS_PAYMENT_COMPLETED ||
                        item.status == status.STATUS_CREDITED
                      ? 'bg-green-100'
                      : ''
              }`}
            />
            <View className="flex flex-row items-center">
              <Text className="font-pmedium">
                {item.category == types.ROOM_DETAILS_TYPE ||
                item.category == types.GUEST_ROOM_DETAILS_TYPE
                  ? 'Room Booking'
                  : item.category == types.TRAVEL_DETAILS_TYPE ||
                      item.category == types.GUEST_TRAVEL_DETAILS_TYPE
                    ? 'Travel Booking'
                    : item.category == types.ADHYAYAN_DETAILS_TYPE ||
                        item.category == types.GUEST_ADHYAYAN_DETAILS_TYPE
                      ? 'Adhyayan Booking'
                      : item.category == types.EVENT_DETAILS_TYPE ||
                          item.category == types.GUEST_EVENT_DETAILS_TYPE
                        ? 'Event Booking'
                        : ''}
              </Text>
            </View>
            <Text className="font-pmedium text-secondary">
              {moment(item.createdAt).format('Do MMMM, YYYY')}
            </Text>
          </View>
        </View>
        <View className="absolute bottom-3 right-3">
          <Text className="font-pmedium text-lg text-black">₹ {item.amount}</Text>
        </View>
      </View>
    </View>
  );
};

export default transactions;
