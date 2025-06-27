import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { icons, status } from '@/constants';
import { useGlobalContext } from '@/context/GlobalProvider';
import CustomButton from '../CustomButton';
import handleAPICall from '@/utils/HandleApiCall';
import ExpandableItem from '../ExpandableItem';
import HorizontalSeparator from '../HorizontalSeparator';
import CustomEmptyMessage from '../CustomEmptyMessage';
import BookingStatusDisplay from '../BookingStatusDisplay';
import moment from 'moment';

const RoomBookingCancellation: React.FC = () => {
  const { user } = useGlobalContext();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRooms = async ({ pageParam = 1 }: { pageParam?: number }) => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/stay/bookings',
        { cardno: user.cardno, page: pageParam },
        null,
        (res: any) => {
          resolve(Array.isArray(res) ? res : []);
        },
        () => reject(new Error('Failed to fetch rooms'))
      );
    });
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch }: any =
    useInfiniteQuery({
      queryKey: ['roomBooking', user.cardno],
      queryFn: fetchRooms,
      initialPageParam: 1,
      staleTime: 1000 * 60 * 5,
      getNextPageParam: (lastPage: any, pages: any) => {
        if (!lastPage || lastPage.length === 0) return undefined;
        return pages.length + 1;
      },
    });

  const cancelBookingMutation = useMutation<any, any, any>({
    mutationFn: ({ bookingid, bookedFor }) => {
      return new Promise<void>((resolve, reject) => {
        handleAPICall(
          'POST',
          '/stay/cancel',
          null,
          { cardno: user.cardno, bookingid, bookedFor: bookedFor == 'NA' ? undefined : bookedFor },
          () => resolve(),
          () => reject(new Error('Failed to cancel booking'))
        );
      });
    },
    onSuccess: (_, { bookingid, bookedFor }) => {
      queryClient.setQueryData(['roomBooking', user.cardno], (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) =>
            page.map((booking: any) => {
              if (
                booking.bookingid !== bookingid ||
                (booking.bookedFor !== null && booking.bookedFor !== bookedFor)
              ) {
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

  const renderItem: ListRenderItem<any> = ({ item }) => (
    <ExpandableItem
      visibleContent={
        <View className="flex flex-row items-center gap-x-4">
          <Image source={icons.room} className="h-10 w-10" resizeMode="contain" />
          <View className="flex-col gap-y-2">
            <BookingStatusDisplay
              bookingStatus={item.status}
              transactionStatus={item.transaction_status}
            />
            <Text className="font-pmedium">
              {moment(item.checkin).format('Do MMMM')} -{' '}
              {moment(item.checkout).format('Do MMMM, YYYY')}
            </Text>
            {item.bookedBy && user.cardno == item.bookedBy && (
              <Text className="font-pmedium">
                Booked For: <Text className="text-secondary">{item.name}</Text>
              </Text>
            )}
          </View>
        </View>
      }
      containerStyles="mt-3">
      <HorizontalSeparator />
      <View className="mt-2 flex flex-row items-center gap-x-2 px-2">
        <Image source={icons.ac} className="h-4 w-4" resizeMode="contain" />
        <Text className="font-pregular text-gray-400">Room Type:</Text>
        <Text className="font-pmedium text-black">
          {item.roomtype === 'ac'
            ? 'AC Room'
            : item.roomtype === 'nac'
              ? 'Non AC Room'
              : item.roomtype === 'NA'
                ? 'Single Day'
                : 'Flat'}
        </Text>
      </View>
      {item.gender && (
        <View className="mt-2 flex flex-row items-center gap-x-2 px-2">
          <Image source={icons.elder} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Ground Floor Booking:</Text>
          <Text className="font-pmedium text-black">
            {item.gender.includes('SC') ? 'Yes' : 'No'}
          </Text>
        </View>
      )}

      <View className="mt-2 flex flex-row items-center gap-x-2 px-2">
        <Image source={icons.roomNumber} className="h-4 w-4" resizeMode="contain" />
        <Text className="font-pregular text-gray-400">
          {item.roomtype == 'flat' ? 'Flat Number:' : 'Room Number:'}
        </Text>
        <Text className="font-pmedium text-black">
          {item.transaction_status === status.STATUS_CASH_COMPLETED ||
          item.transaction_status === status.STATUS_PAYMENT_COMPLETED ||
          item.roomtype == 'flat'
            ? item.roomno
            : 'Will be shared later'}
        </Text>
      </View>

      <View className="mt-2 flex flex-row items-center gap-x-2 px-2">
        <Image source={icons.charge} className="h-4 w-4" resizeMode="contain" />
        <Text className="font-pregular text-gray-400">Charge:</Text>
        <Text className="font-pmedium text-black">₹ {item.amount}</Text>
      </View>

      {moment(item.checkin).diff(moment().format('YYYY-MM-DD')) > 0 &&
        ![status.STATUS_CANCELLED, status.STATUS_ADMIN_CANCELLED].includes(item.status) && (
          <CustomButton
            text="Cancel Booking"
            containerStyles="mt-5 py-3 mx-1 flex-1"
            textStyles="text-sm text-white"
            handlePress={() =>
              cancelBookingMutation.mutate({
                bookingid: item.bookingid,
                bookedFor: item.bookedFor,
              })
            }
          />
        )}
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
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        data={data?.pages?.flatMap((page: any) => page) || []}
        estimatedItemSize={99}
        renderItem={renderItem}
        ListEmptyComponent={() => (
          <View className="h-full flex-1 items-center justify-center pt-40">
            {isError ? (
              <View className="items-center justify-center px-6">
                <Text className="mb-2 text-center text-lg font-semibold text-gray-800">
                  Oops! Something went wrong
                </Text>
                <Text className="mb-6 text-center text-gray-600">
                  Unable to load Room Bookings. Please check your connection and try again.
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
                message={'Your room bookings are currently in a state of nirvana...empty'}
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

export default RoomBookingCancellation;
