import { useState } from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { icons, status } from '@/src/constants';
import { useAuthStore } from '@/src/stores';
import { useTabBarPadding } from '@/src/hooks/useTabBarPadding';
import handleAPICall from '@/src/utils/HandleApiCall';
import CustomButton from '../CustomButton';
import ExpandableItem from '../ExpandableItem';
import BookingStatusDisplay from '../BookingStatusDisplay';
import HorizontalSeparator from '../HorizontalSeparator';
import CustomEmptyMessage from '../CustomEmptyMessage';
import CustomModal from '../CustomModal';
import moment from 'moment';

const AdhyayanBookingCancellation = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const tabBarPadding = useTabBarPadding();

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

              const newTransactionStatus = isPending
                ? status.STATUS_CANCELLED
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

  const renderItem = ({ item }: any) => {
    const bookedForSomeone = item.bookedBy && user.cardno == item.bookedBy;
    return (
      <ExpandableItem
        visibleContent={
          <View className="flex-1 flex-shrink flex-row items-center gap-x-4">
            <Image
              source={icons.adhyayan}
              className="h-10 w-10 items-center"
              resizeMode="contain"
            />
            <View className="flex-col gap-y-2">
              <BookingStatusDisplay
                bookingStatus={item.status}
                transactionStatus={item.transaction_status}
              />

              <View className="flex-col">
                <Text className="font-pmedium text-gray-700">{item.shibir_name}</Text>
                <Text className="font-pmedium text-secondary-100">
                  {moment(item.start_date).format('Do MMMM')} -{' '}
                  {moment(item.end_date).format('Do MMMM, YYYY')}
                </Text>
                {bookedForSomeone && (
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
          {/* Actions Row */}
          {((moment(item.start_date).diff(moment().format('YYYY-MM-DD')) > 0 &&
            ![status.STATUS_CANCELLED, status.STATUS_ADMIN_CANCELLED].includes(item.status)) ||
            item?.showFeedback) && (
            <View className="mt-5 flex-row gap-x-3 px-1">
              {moment(item.start_date).diff(moment().format('YYYY-MM-DD')) > 0 &&
                ![status.STATUS_CANCELLED, status.STATUS_ADMIN_CANCELLED].includes(item.status) && (
                  <CustomButton
                    text="Cancel Booking"
                    containerStyles={'py-3 flex-1'}
                    textStyles={'text-sm text-white'}
                    handlePress={() => {
                      setSelectedBooking(item);
                      setShowCancelModal(true);
                    }}
                  />
                )}
              {item?.showFeedback && !bookedForSomeone && (
                <CustomButton
                  text="Give Feedback"
                  containerStyles={'py-3 flex-1'}
                  textStyles={'text-sm text-white'}
                  bgcolor={'bg-secondary'}
                  handlePress={() => {
                    const shibirId = item.shibir_id ?? item.id;
                    router.push(`/adhyayan/feedback/${shibirId}`);
                  }}
                />
              )}
            </View>
          )}
        </View>
      </ExpandableItem>
    );
  };

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
        renderItem={renderItem}
        ListEmptyComponent={() => (
          <View className="h-full flex-1 items-center justify-center pt-40">
            {isError ? (
              <View className="items-center justify-center px-6">
                <Text className="mb-2 text-center text-lg font-semibold text-gray-800">
                  Oops! Something went wrong
                </Text>
                <Text className="mb-6 text-center text-gray-600">
                  Unable to load Adhyayan bookings. Please check your connection and try again.
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
              <CustomEmptyMessage message={'Zero adhyayans. Impressive...ly empty.'} />
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
      <CustomModal
        visible={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedBooking(null);
        }}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking?"
        btnText="Yes, Cancel"
        showActionButton={true}
        btnOnPress={() => {
          if (selectedBooking) {
            cancelBookingMutation.mutate({
              cardno: selectedBooking.cardno,
              bookingid: selectedBooking.bookingid,
            });
            setShowCancelModal(false);
            setSelectedBooking(null);
          }
        }}
      />
    </View>
  );
};

export default AdhyayanBookingCancellation;
