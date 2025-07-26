import {
  View,
  Text,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { icons, status } from '@/constants';
import { useAuthStore } from '@/stores';
import { FlashList } from '@shopify/flash-list';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import CustomButton from '../CustomButton';
import handleAPICall from '@/utils/HandleApiCall';
import ExpandableItem from '../ExpandableItem';
import HorizontalSeparator from '../HorizontalSeparator';
import CustomEmptyMessage from '../CustomEmptyMessage';
import BookingStatusDisplay from '../BookingStatusDisplay';
import moment from 'moment';

const EventBookingCancellation = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const tabBarPadding = useTabBarPadding();

  const fetchUtsavs = async ({ pageParam = 1 }) => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/utsav/booking',
        {
          cardno: user?.cardno,
          page: pageParam,
        },
        null,
        (res: any) => {
          resolve(Array.isArray(res.data) ? res.data : []);
        },
        () => reject(new Error('Failed to fetch utsavs'))
      );
    });
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch }: any =
    useInfiniteQuery({
      queryKey: ['utsavBooking', user?.cardno],
      queryFn: fetchUtsavs,
      initialPageParam: 1,
      staleTime: 1000 * 60 * 5,
      getNextPageParam: (lastPage: any, pages: any) => {
        if (!lastPage || lastPage.length === 0) return undefined;
        return pages.length + 1;
      },
      enabled: !!user?.cardno,
    });

  const cancelBookingMutation = useMutation<any, any, any>({
    mutationFn: ({ cardno, bookingid }) => {
      return new Promise((resolve, reject) => {
        handleAPICall(
          'DELETE',
          '/utsav/booking',
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
      queryClient.setQueryData(['utsavBooking', user?.cardno], (oldData: any) => {
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
          <Image source={icons.events} className="h-10 w-10 items-center" resizeMode="contain" />
          <View className="flex-col gap-y-2">
            <BookingStatusDisplay
              bookingStatus={item.status}
              transactionStatus={item.transaction_status}
            />
            <Text className="font-pmedium">{item.utsav_name}</Text>
            {item.bookedBy && user?.cardno == item.bookedBy && (
              <Text className="font-pmedium">
                Booked For: <Text className="font-pmedium text-secondary">{item.user_name}</Text>
              </Text>
            )}
          </View>
        </View>
      }
      containerStyles={'mt-3'}>
      <HorizontalSeparator />
      <View className="mt-3">
        <View className="mt-2 flex flex-row items-center gap-x-2 px-2">
          <Image source={icons.luggage} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Package: </Text>
          <Text className="font-pmedium text-black">{item.package_name}</Text>
        </View>
        {item.stay && (
          <View className="mt-2 flex flex-row items-center gap-x-2 px-2">
            <Image source={icons.room} className="h-4 w-4" resizeMode="contain" />
            <Text className="font-pregular text-gray-400">Stay: </Text>
            <Text className="font-pmedium text-black">₹ {item.stay}</Text>
          </View>
        )}
        <View className="mt-2 flex flex-row items-center gap-x-2 px-2">
          <Image source={icons.charge} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Charge: </Text>
          <Text className="font-pmedium text-black">₹ {item.amount}</Text>
        </View>
        <View>
          {moment(item.date).diff(moment().format('YYYY-MM-DD')) > 0 &&
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
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: tabBarPadding,
        }}
        showsVerticalScrollIndicator={false}
        data={data?.pages?.flatMap((page: any) => page) || []}
        estimatedItemSize={113}
        renderItem={renderItem}
        ListEmptyComponent={() => (
          <View className="h-full flex-1 items-center justify-center pt-40">
            {isError ? (
              <View className="items-center justify-center px-6">
                <Text className="mb-2 text-center text-lg font-semibold text-gray-800">
                  Oops! Something went wrong
                </Text>
                <Text className="mb-6 text-center text-gray-600">
                  Unable to load Event Bookings. Please check your connection and try again.
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
              <CustomEmptyMessage
                message={"No spiritual gatherings? Your soul's RSVP is missing."}
              />
            )}
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

export default EventBookingCancellation;
