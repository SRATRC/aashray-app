import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import moment from 'moment';
import { useState } from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';

import BookingStatusDisplay from './BookingStatusDisplay';
import OldBookingsTrigger from './OldBookingsTrigger';
import { cancelAdhyayan, getBookedAdhyayan } from '../../api';
import { splitActiveAndPastBookings } from '../../bookingHistoryFilter';

import CustomButton from '@/components/CustomButton';
import CustomEmptyMessage from '@/components/CustomEmptyMessage';
import CustomModal from '@/components/CustomModal';
import ExpandableItem from '@/components/ExpandableItem';
import HorizontalSeparator from '@/components/HorizontalSeparator';
import { icons, status } from '@/constants';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import { useAuthStore } from '@/stores';

const AdhyayanBookingCancellation = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showOldBookings, setShowOldBookings] = useState(false);
  const tabBarPadding = useTabBarPadding();

  const fetchAdhyayans = async ({ pageParam = 1 }) => {
    const res = await getBookedAdhyayan(user.cardno, pageParam);
    return Array.isArray(res.data) ? res.data : [];
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch }: any =
    useInfiniteQuery({
      queryKey: ['adhyayanBooking', user.cardno],
      queryFn: fetchAdhyayans,
      initialPageParam: 1,
      staleTime: 1000 * 60 * 5,
      getNextPageParam: (lastPage: any, pages: any) => {
        if (!lastPage || !Array.isArray(lastPage) || lastPage.length === 0) return undefined;
        return (pages?.length || 0) + 1;
      },
    });

  const cancelBookingMutation = useMutation<any, any, any>({
    mutationFn: ({ cardno, bookingid }) => cancelAdhyayan(cardno, bookingid),
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

  const allItems = data?.pages?.flatMap((page: any) => page) || [];
  const { activeItems, pastItems } = splitActiveAndPastBookings(
    allItems,
    (item: any) => item.end_date
  );

  const renderOldBookingsSection = (compact = false) => (
    <>
      <OldBookingsTrigger
        compact={compact}
        isExpanded={showOldBookings}
        onToggle={() => setShowOldBookings((v) => !v)}
      />
      {showOldBookings && (
        <View>
          <View className="flex-row items-center justify-between px-2 pb-2">
            <Text className="font-psemibold text-base text-gray-500">Past Bookings</Text>
            <TouchableOpacity onPress={() => setShowOldBookings(false)}>
              <Text className="font-pregular text-sm text-secondary">Hide old bookings</Text>
            </TouchableOpacity>
          </View>
          {pastItems.length === 0 ? (
            <View className="items-center py-6">
              <Text className="font-pregular text-gray-400">No past bookings</Text>
            </View>
          ) : (
            pastItems.map((item: any, index: number) => (
              <View key={item.bookingid ?? index}>{renderItem({ item } as any)}</View>
            ))
          )}
        </View>
      )}
    </>
  );

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
    const bookedForSomeone = item.bookedBy && user.cardno === item.bookedBy;
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
        containerStyles="mt-3">
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
            (item?.showFeedback && !item?.hasSubmittedFeedback)) && (
            <View className="mt-5 flex-row gap-x-3 px-1">
              {moment(item.start_date).diff(moment().format('YYYY-MM-DD')) > 0 &&
                ![status.STATUS_CANCELLED, status.STATUS_ADMIN_CANCELLED].includes(item.status) && (
                  <CustomButton
                    text="Cancel Booking"
                    containerStyles="py-3 flex-1"
                    textStyles="text-sm text-white"
                    handlePress={() => {
                      setSelectedBooking(item);
                      setShowCancelModal(true);
                    }}
                  />
                )}
              {item?.showFeedback && !item?.hasSubmittedFeedback && !bookedForSomeone && (
                <CustomButton
                  text="Give Feedback"
                  containerStyles="py-3 flex-1"
                  textStyles="text-sm text-white"
                  bgcolor="bg-secondary"
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
      {!hasNextPage && data?.pages?.[0]?.length > 0 && pastItems.length === 0 && (
        <Text>No more bookings at the moment</Text>
      )}
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
        data={activeItems}
        renderItem={renderItem}
        ListEmptyComponent={() => {
          if (isLoading) return null;
          if (isError)
            return (
              <View className="items-center justify-center px-6 pt-40">
                <Text className="mb-2 text-center text-lg font-semibold text-gray-800">
                  Oops! Something went wrong
                </Text>
                <Text className="mb-6 text-center text-gray-600">
                  Unable to load Adhyayan bookings. Please check your connection and try again.
                </Text>
                <TouchableOpacity
                  onPress={() => refetch()}
                  className="rounded-lg bg-secondary px-6 py-3"
                  activeOpacity={0.7}>
                  <Text className="font-semibold text-white">Try Again</Text>
                </TouchableOpacity>
              </View>
            );
          if (pastItems.length > 0)
            return <View className="w-full">{renderOldBookingsSection()}</View>;
          return (
            <View className="h-full flex-1 items-center justify-center pt-40">
              <CustomEmptyMessage message="Zero adhyayans. Impressive...ly empty." />
            </View>
          );
        }}
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
            {!isLoading &&
              !isError &&
              activeItems.length > 0 &&
              pastItems.length > 0 &&
              renderOldBookingsSection(true)}
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
        showActionButton
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
