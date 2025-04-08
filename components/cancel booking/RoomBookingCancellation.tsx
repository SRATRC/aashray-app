import React from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { useInfiniteQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { icons, status } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import CustomButton from '../CustomButton';
import handleAPICall from '../../utils/HandleApiCall';
import ExpandableItem from '../ExpandableItem';
import HorizontalSeparator from '../HorizontalSeparator';
import moment from 'moment';
import CustomTag from '../CustomTag';
import CustomEmptyMessage from '../CustomEmptyMessage';

const RoomBookingCancellation: React.FC = () => {
  const { user } = useGlobalContext();
  const queryClient = useQueryClient();

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

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError }: any =
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

  const renderItem: ListRenderItem<any> = ({ item }) => (
    <ExpandableItem
      visibleContent={
        <View className="flex flex-row items-center gap-x-4">
          <Image source={icons.room} className="h-10 w-10" resizeMode="contain" />
          <View className="flex-col gap-y-2">
            <View className="flex flex-row">
              <CustomTag
                text={item.status}
                textStyles={
                  item.status === status.STATUS_CANCELLED ||
                  item.status === status.STATUS_ADMIN_CANCELLED
                    ? 'text-red-200'
                    : item.status === status.STATUS_WAITING
                      ? 'text-secondary-200'
                      : 'text-green-200'
                }
                containerStyles={
                  item.status === status.STATUS_CANCELLED ||
                  item.status === status.STATUS_ADMIN_CANCELLED
                    ? 'bg-red-100'
                    : item.status === status.STATUS_WAITING
                      ? 'bg-secondary-50'
                      : 'bg-green-100'
                }
              />
              {item.transaction_status && (
                <CustomTag
                  text={
                    item.transaction_status === status.STATUS_CANCELLED ||
                    item.transaction_status === status.STATUS_ADMIN_CANCELLED
                      ? 'Payment Cancelled'
                      : item.transaction_status === status.STATUS_PAYMENT_PENDING ||
                          item.transaction_status === status.STATUS_CASH_PENDING
                        ? 'Payment Due'
                        : item.transaction_status === status.STATUS_CREDITED
                          ? 'Credited'
                          : 'Paid'
                  }
                  textStyles={
                    item.transaction_status === status.STATUS_CANCELLED ||
                    item.transaction_status === status.STATUS_ADMIN_CANCELLED
                      ? 'text-red-200'
                      : item.transaction_status === status.STATUS_PAYMENT_PENDING ||
                          item.transaction_status === status.STATUS_CASH_PENDING
                        ? 'text-secondary-200'
                        : 'text-green-200'
                  }
                  containerStyles={`${
                    item.transaction_status === status.STATUS_CANCELLED ||
                    item.transaction_status === status.STATUS_ADMIN_CANCELLED
                      ? 'bg-red-100'
                      : item.transaction_status === status.STATUS_PAYMENT_PENDING ||
                          item.transaction_status === status.STATUS_CASH_PENDING
                        ? 'bg-secondary-50'
                        : 'bg-green-100'
                  } mx-1`}
                />
              )}
            </View>
            <Text className="font-pmedium">
              {moment(item.checkin).format('Do MMMM')} -{' '}
              {moment(item.checkout).format('Do MMMM, YYYY')}
            </Text>
            {item.bookedBy && (
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
      {(item.transaction_status === status.STATUS_CASH_COMPLETED ||
        item.transaction_status === status.STATUS_PAYMENT_COMPLETED ||
        (['ac', 'nac'].includes(item.roomtype) &&
          moment(item.checkin).diff(moment(), 'hours') <= 20 &&
          moment(item.checkin).isAfter(moment()))) && (
        <View className="mt-2 flex flex-row items-center gap-x-2 px-2">
          <Image source={icons.roomNumber} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Room Number:</Text>
          <Text className="font-pmedium text-black">{item.roomno}</Text>
        </View>
      )}

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

  if (isError) {
    return (
      <Text className="items-center justify-center font-pregular text-lg text-red-500">
        An error occurred
      </Text>
    );
  }

  return (
    <View className="w-full">
      <FlashList
        className="flex-grow-1"
        contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        data={data?.pages?.flatMap((page: any) => page) || []}
        estimatedItemSize={99}
        renderItem={renderItem}
        ListFooterComponent={renderFooter}
        onEndReachedThreshold={0.1}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
      />
      {!isFetchingNextPage && data?.pages?.[0]?.length === 0 && (
        <CustomEmptyMessage message="Your room bookings are currently in a state of nirvana...empty" />
      )}
    </View>
  );
};

export default RoomBookingCancellation;
