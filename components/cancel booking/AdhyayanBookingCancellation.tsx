import { View, Text, Image, ActivityIndicator } from 'react-native';
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
    mutationFn: ({ shibir_id, bookedFor }) => {
      return new Promise((resolve, reject) => {
        handleAPICall(
          'DELETE',
          '/adhyayan/cancel',
          null,
          {
            cardno: user.cardno,
            shibir_id: shibir_id,
            bookedFor: bookedFor,
          },
          (res: any) => resolve(res),
          () => reject(new Error('Failed to cancel booking'))
        );
      });
    },
    onSuccess: (_, { shibir_id, bookedFor }) => {
      queryClient.setQueryData(['adhyayanBooking', user.cardno], (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) =>
            page.map((booking: any) => {
              const isMatchingBooking =
                booking.shibir_id === shibir_id &&
                (booking.bookedFor !== null ? booking.bookedFor == bookedFor : true);

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
                    : item.status == status.STATUS_WAITING
                      ? 'text-secondary-200'
                      : 'text-green-200'
                }
                containerStyles={
                  item.status == status.STATUS_CANCELLED ||
                  item.status == status.STATUS_ADMIN_CANCELLED
                    ? 'bg-red-100'
                    : item.status == status.STATUS_WAITING
                      ? 'bg-secondary-50'
                      : 'bg-green-100'
                }
              />
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
            </View>
            <View className="flex-col">
              <Text className="font-pmedium text-gray-700">{item.shibir_name}</Text>
              <Text className="font-pmedium text-secondary-100">
                {moment(item.start_date).format('Do MMMM')} -{' '}
                {moment(item.end_date).format('Do MMMM, YYYY')}
              </Text>
            </View>
          </View>
        </View>
      }
      containerStyles={'mt-3'}>
      <HorizontalSeparator />
      <View className="mt-3">
        <View className="flex flex-row gap-x-2 px-2">
          <Image source={icons.person} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Swadhyay Karta: </Text>
          <Text className="font-pmedium text-black">{item.speaker}</Text>
        </View>
        <View className="mt-2 flex flex-row gap-x-2 px-2">
          <Image source={icons.charge} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Charge: </Text>
          <Text className="font-pmedium text-black">₹ {item.amount}</Text>
        </View>
        <View className="mt-2 flex flex-row gap-x-2 px-2">
          <Image source={icons.person} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Booked For: </Text>
          <Text className="font-pmedium text-black">{item.name ? item.name : 'Self'}</Text>
        </View>
        {moment(item.start_date).diff(moment().format('YYYY-MM-DD')) > 6 &&
          item.status !== status.STATUS_CANCELLED &&
          item.status !== status.STATUS_ADMIN_CANCELLED && (
            <View className="flex-row gap-x-2">
              {(item.transaction_status == status.STATUS_PAYMENT_PENDING ||
                item.transaction_status == status.STATUS_CASH_PENDING) && (
                <CustomButton
                  text="Pay Now"
                  containerStyles={'mt-5 py-3 mx-1 flex-1'}
                  textStyles={'text-sm text-white'}
                  handlePress={async () => {}}
                />
              )}

              <CustomButton
                text="Cancel Booking"
                containerStyles={'mt-5 py-3 mx-1 flex-1'}
                textStyles={'text-sm text-white'}
                handlePress={() => {
                  cancelBookingMutation.mutate({
                    shibir_id: item.shibir_id,
                    bookedFor: item.bookedFor,
                  });
                }}
              />
            </View>
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

  if (isError)
    return (
      <Text className="items-center justify-center font-pregular text-lg text-red-500">
        An error occurred
      </Text>
    );

  return (
    <View className="w-full">
      <FlashList
        className="flex-grow-1"
        contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        data={data?.pages?.flatMap((page: any) => page) || []}
        estimatedItemSize={109}
        renderItem={renderItem}
        ListFooterComponent={renderFooter}
        onEndReachedThreshold={0.1}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
      />
      {!isFetchingNextPage && data?.pages?.[0]?.length == 0 && (
        <CustomEmptyMessage
          lottiePath={require('../../assets/lottie/empty.json')}
          message={'No Adhyayans to show!'}
        />
      )}
    </View>
  );
};

export default AdhyayanBookingCancellation;
