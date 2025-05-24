import { View, Text, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { icons, status } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import { FlashList } from '@shopify/flash-list';
import CustomButton from '../CustomButton';
import handleAPICall from '../../utils/HandleApiCall';
import ExpandableItem from '../ExpandableItem';
import CustomTag from '../CustomTag';
import HorizontalSeparator from '../HorizontalSeparator';
import CustomEmptyMessage from '../CustomEmptyMessage';
import moment from 'moment';

const TravelBookingCancellation = () => {
  const { user } = useGlobalContext();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTravels = async ({ pageParam = 1 }) => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/travel/booking',
        {
          cardno: user.cardno,
          page: pageParam,
        },
        null,
        (res: any) => {
          resolve(Array.isArray(res.data) ? res.data : []);
        },
        () => reject(new Error('Failed to fetch travels'))
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
    queryKey: ['travelBooking', user.cardno],
    queryFn: fetchTravels,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
    getNextPageParam: (lastPage: any, pages: any) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      return pages.length + 1;
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: (bookingid) => {
      return new Promise((resolve, reject) => {
        handleAPICall(
          'DELETE',
          '/travel/booking',
          null,
          {
            cardno: user.cardno,
            bookingid,
          },
          (res: any) => resolve(res),
          () => reject(new Error('Failed to cancel booking'))
        );
      });
    },
    onSuccess: (_, bookingid) => {
      queryClient.setQueryData(['travelBooking', user.cardno], (oldData: any) => {
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
          <Image source={icons.travel} className="h-10 w-10 items-center" resizeMode="contain" />
          <View className="flex-col gap-y-2">
            <View className="flex flex-row">
              <CustomTag
                text={item.status}
                textStyles={
                  item.status == status.STATUS_CANCELLED ||
                  item.status == status.STATUS_ADMIN_CANCELLED
                    ? 'text-red-200'
                    : item.status == status.STATUS_WAITING || item.status == status.STATUS_PENDING
                      ? 'text-secondary-200'
                      : 'text-green-200'
                }
                containerStyles={
                  item.status == status.STATUS_CANCELLED ||
                  item.status == status.STATUS_ADMIN_CANCELLED
                    ? 'bg-red-100'
                    : item.status == status.STATUS_WAITING || item.status == status.STATUS_PENDING
                      ? 'bg-secondary-50'
                      : 'bg-green-100'
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
            <Text className="font-pmedium">{moment(item.date).format('Do MMMM, YYYY')}</Text>
            <Text className="font-pmedium text-secondary">
              {item.pickup_point == 'Research Centre'
                ? 'Research Centre to Mumbai'
                : 'Mumbai to Research Centre'}
            </Text>
            {item.bookedBy && user.cardno == item.bookedBy && (
              <Text className="font-pmedium">
                Booked For: <Text className="text-secondary">{item.user_name}</Text>
              </Text>
            )}
          </View>
        </View>
      }
      containerStyles={'mt-3'}>
      <HorizontalSeparator />
      <View className="mt-3">
        {item.drop_point == 'RC' ? (
          <View className="mt-2 flex flex-row items-center gap-x-2 px-2">
            <Image source={icons.marker} className="h-4 w-4" resizeMode="contain" />
            <Text className="font-pregular text-gray-400">Pickup Point:</Text>
            <Text className="flex-1 font-pmedium text-black" numberOfLines={1} ellipsizeMode="tail">
              {item.pickup_point}
            </Text>
          </View>
        ) : (
          <View className="mt-2 flex flex-row items-center gap-x-2 px-2">
            <Image source={icons.marker} className="h-4 w-4" resizeMode="contain" />
            <Text className="font-pregular text-gray-400">Drop Point:</Text>
            <Text className="flex-1 font-pmedium text-black" numberOfLines={1} ellipsizeMode="tail">
              {item.drop_point}
            </Text>
          </View>
        )}
        <View className="mt-2 flex flex-row items-center gap-x-2 px-2">
          <Image source={icons.luggage} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Luggage:</Text>
          <Text className="font-pmedium text-black">{item.luggage}</Text>
        </View>
        {item.comments && (
          <View className="mt-2 flex flex-row items-center gap-x-2 px-2">
            <Image source={icons.request} className="h-4 w-4" resizeMode="contain" />
            <Text className="font-pregular text-gray-400">Special Request:</Text>
            <Text className="font-pmedium text-black">{item.comments}</Text>
          </View>
        )}
        {item.amount && (
          <View className="mt-2 flex flex-row items-center gap-x-2 px-2">
            <Image source={icons.charge} className="h-4 w-4" resizeMode="contain" />
            <Text className="font-pregular text-gray-400">Charge:</Text>
            <Text className="font-pmedium text-black">₹ {item.amount}</Text>
          </View>
        )}
        <View>
          {moment(item.date).diff(moment().format('YYYY-MM-DD')) > 0 &&
            ![status.STATUS_CANCELLED, status.STATUS_ADMIN_CANCELLED].includes(item.status) && (
              <CustomButton
                text="Cancel Booking"
                containerStyles={'mt-5 py-3 mx-1 flex-1'}
                textStyles={'text-sm text-white'}
                handlePress={() => {
                  cancelBookingMutation.mutate(item.bookingid);
                }}
              />
            )}
        </View>
      </View>
    </ExpandableItem>
  );

  const renderFooter = () => (
    <View className="items-center">
      {(isFetchingNextPage || isLoading) && <ActivityIndicator />}
      {!hasNextPage && data?.pages?.[0]?.length > 0 && <Text>No more bookings at the moment</Text>}
    </View>
  );

  if (isError)
    return (
      <Text className="items-center justify-center font-pregular text-lg text-red-500">
        An error occurred
      </Text>
    );

  return (
    <View className="mt-3 w-full flex-1">
      <FlashList
        className="flex-grow-1"
        contentContainerStyle={{ paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        data={data?.pages?.flatMap((page: any) => page) || []}
        estimatedItemSize={113}
        renderItem={renderItem}
        ListFooterComponent={renderFooter}
        onEndReachedThreshold={0.1}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      />
      {!isFetchingNextPage && data?.pages?.[0]?.length == 0 && (
        <CustomEmptyMessage message={'Empty itinerary? Your Research Centre calls.'} />
      )}
    </View>
  );
};

export default TravelBookingCancellation;
