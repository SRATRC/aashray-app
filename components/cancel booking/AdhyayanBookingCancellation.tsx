import { useState } from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { icons, status } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import { FlashList } from '@shopify/flash-list';
import CustomButton from '../CustomButton';
import handleAPICall from '../../utils/HandleApiCall';
import ExpandableItem from '../ExpandableItem';
import CustomTag from '../CustomTag';
import moment from 'moment';
import HorizontalSeparator from '../HorizontalSeparator';
import CustomEmptyMessage from '../CustomEmptyMessage';

const AdhyayanBookingCancellation = () => {
  const { user } = useGlobalContext();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAdhyayans = async ({ pageParam = 1 }) => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/adhyayan/getbooked',
        {
          cardno: user.cardno,
          page: pageParam,
        },
        null,
        (res: any) => {
          resolve(Array.isArray(res.data) ? res.data : []);
        },
        () => reject(new Error('Failed to fetch adhyayans'))
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
    queryKey: ['adhyayanBooking', user.cardno],
    queryFn: fetchAdhyayans,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
    getNextPageParam: (lastPage: any, pages: any) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      return pages.length + 1;
    },
  });

  const cancelBookingMutation = useMutation<any, any, any>({
    mutationFn: ({ cardno, bookingid }) => {
      return new Promise((resolve, reject) => {
        handleAPICall(
          'DELETE',
          '/adhyayan/cancel',
          null,
          {
            cardno,
            bookingid,
          },
          (res: any) => resolve(res),
          () => reject(new Error('Failed to cancel booking'))
        );
      });
    },
    onSuccess: (_, { bookingid }) => {
      queryClient.setQueryData(['adhyayanBooking', user.cardno], (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) =>
            page.map((booking: any) => {
              const isMatchingBooking = booking.bookingid === bookingid;

              if (!isMatchingBooking) {
                return booking;
              }

              const isPending =
                booking.transaction_status === status.STATUS_PAYMENT_PENDING ||
                booking.transaction_status === status.STATUS_CASH_PENDING;

              const isCompleted =
                booking.transaction_status === status.STATUS_PAYMENT_COMPLETED ||
                booking.transaction_status === status.STATUS_CASH_COMPLETED;

              const newTransactionStatus = isPending
                ? status.STATUS_CANCELLED
                : isCompleted
                  ? status.STATUS_CREDITED
                  : booking.transaction_status;

              return {
                ...booking,
                status: status.STATUS_CANCELLED,
                transaction_status: newTransactionStatus,
              };
            })
          ),
        };
      });
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderItem = ({ item }: any) => (
    <ExpandableItem
      visibleContent={
        <View className="flex flex-row items-center gap-x-4">
          <Image source={icons.adhyayan} className="h-10 w-10 items-center" resizeMode="contain" />
          <View className="flex-col gap-y-2">
            <View className="flex flex-row">
              <CustomTag
                text={item.status}
                textStyles={
                  item.status == status.STATUS_CANCELLED ||
                  item.status == status.STATUS_ADMIN_CANCELLED
                    ? 'text-red-200'
                    : item.status == status.STATUS_CONFIRMED
                      ? 'text-green-200'
                      : 'text-secondary-200'
                }
                containerStyles={
                  item.status == status.STATUS_CANCELLED ||
                  item.status == status.STATUS_ADMIN_CANCELLED
                    ? 'bg-red-100'
                    : item.status == status.STATUS_CONFIRMED
                      ? 'bg-green-100'
                      : 'bg-secondary-50'
                }
              />
              {item.transaction_status && (
                <CustomTag
                  text={
                    item.transaction_status == status.STATUS_CANCELLED ||
                    item.transaction_status == status.STATUS_ADMIN_CANCELLED
                      ? 'Payment Cancelled'
                      : item.transaction_status == status.STATUS_PAYMENT_PENDING ||
                          item.transaction_status == status.STATUS_CASH_PENDING
                        ? 'Payment Due'
                        : item.transaction_status == status.STATUS_CREDITED
                          ? 'Credited'
                          : 'Paid'
                  }
                  textStyles={
                    item.transaction_status == status.STATUS_CANCELLED ||
                    item.transaction_status == status.STATUS_ADMIN_CANCELLED
                      ? 'text-red-200'
                      : item.transaction_status == status.STATUS_PAYMENT_PENDING ||
                          item.transaction_status == status.STATUS_CASH_PENDING
                        ? 'text-secondary-200'
                        : 'text-green-200'
                  }
                  containerStyles={`${
                    item.transaction_status == status.STATUS_CANCELLED ||
                    item.transaction_status == status.STATUS_ADMIN_CANCELLED
                      ? 'bg-red-100'
                      : item.transaction_status == status.STATUS_PAYMENT_PENDING ||
                          item.transaction_status == status.STATUS_CASH_PENDING
                        ? 'bg-secondary-50'
                        : 'bg-green-100'
                  } mx-1`}
                />
              )}
            </View>
            <View className="flex-col">
              <Text className="font-pmedium text-gray-700">{item.shibir_name}</Text>
              <Text className="font-pmedium text-secondary-100">
                {moment(item.start_date).format('Do MMMM')} -{' '}
                {moment(item.end_date).format('Do MMMM, YYYY')}
              </Text>
              {item.bookedBy && user.cardno == item.bookedBy && (
                <View className="flex-row items-center gap-x-2">
                  <Text className="font-pmedium">Booked For:</Text>
                  <Text className="font-pmedium text-secondary-100">{item.name}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      }
      containerStyles={'mt-3'}>
      <HorizontalSeparator />
      <View className="mt-3">
        <View className="flex flex-row items-center gap-x-2 px-2">
          <Image source={icons.person} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Swadhyay Karta:</Text>
          <Text className="font-pmedium text-black">{item.speaker}</Text>
        </View>
        <View className="mt-2 flex flex-row items-center gap-x-2 px-2">
          <Image source={icons.marker} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Location:</Text>
          <Text className="font-pmedium text-black">{item.location}</Text>
        </View>
        <View className="mt-2 flex flex-row items-center gap-x-2 px-2">
          <Image source={icons.charge} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Charge:</Text>
          <Text className="font-pmedium text-black">₹ {item.amount}</Text>
        </View>
        {moment(item.start_date).diff(moment().format('YYYY-MM-DD')) > 0 &&
          ![status.STATUS_CANCELLED, status.STATUS_ADMIN_CANCELLED].includes(item.status) && (
            <CustomButton
              text="Cancel Booking"
              containerStyles={'mt-5 py-3 mx-1 flex-1'}
              textStyles={'text-sm text-white'}
              handlePress={() => {
                cancelBookingMutation.mutate({
                  cardno: item.cardno,
                  bookingid: item.bookingid,
                });
              }}
            />
          )}
      </View>
    </ExpandableItem>
  );

  const renderFooter = () => (
    <View className="items-center">
      {(isFetchingNextPage || isLoading) && <ActivityIndicator />}
      {!hasNextPage && data?.pages?.[0]?.length > 0 && <Text>No more bookings at the moment</Text>}
    </View>
  );

  return (
    <View className="mt-3 w-full flex-1">
      <FlashList
        className="flex-grow-1"
        contentContainerStyle={{ paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        data={data?.pages?.flatMap((page: any) => page) || []}
        estimatedItemSize={109}
        renderItem={renderItem}
        ListEmptyComponent={() => (
          <View className="h-full flex-1 items-center justify-center pt-40">
            <CustomEmptyMessage message={'Zero adhyayans. Impressive...ly empty.'} />
          </View>
        )}
        ListFooterComponent={() => (
          <View>
            {renderFooter()}
            {isFetchingNextPage && isError && (
              <View className="items-center py-4">
                <Text className="mb-3 text-red-500">Failed to load more items</Text>
                <TouchableOpacity
                  onPress={() => fetchNextPage()}
                  className="rounded bg-red-500 px-4 py-2"
                  activeOpacity={0.7}>
                  <Text className="font-medium text-white">Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        onEndReachedThreshold={0.1}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      />
    </View>
  );
};

export default AdhyayanBookingCancellation;
