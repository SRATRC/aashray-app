import {
  View,
  Text,
  Image,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useState, useCallback, useRef } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { icons } from '../../constants';
import { FlashList } from '@shopify/flash-list';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { FontAwesome } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import handleAPICall from '../../utils/HandleApiCall';
import CustomTag from '../CustomTag';
import moment from 'moment';
import * as Haptics from 'expo-haptics';
import CustomEmptyMessage from '../CustomEmptyMessage';
import BottomSheetFilter from '../BottomSheetFilter';

const FOOD_TYPE_LIST = [
  { key: 'breakfast', value: 'Breakfast' },
  { key: 'lunch', value: 'Lunch' },
  { key: 'dinner', value: 'Dinner' },
];
const SPICE_LIST = [
  { key: 'true', value: 'Regular' },
  { key: 'false', value: 'Non Spicy' },
];

export default function FoodBookingCancellation() {
  const { user } = useGlobalContext();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [filter, setFilter] = useState<any>({
    date: null,
    meal: null,
    spice: null,
    bookedFor: null,
  });

  const { dismiss } = useBottomSheetModal();
  const sheetRef: any = useRef(null);
  const handlePresentModalPress = useCallback((filterType: any) => {
    setActiveFilter(filterType);
    sheetRef.current?.present();
  }, []);
  const [activeFilter, setActiveFilter] = useState<any>(null);

  const canCancelMeal = (mealDate: string) => {
    const now = moment();
    const mealMoment = moment(mealDate);
    const cutoffTime = mealMoment.clone().subtract(1, 'day').hour(11).minute(0).second(0);

    return now.isBefore(cutoffTime);
  };

  const getFilterData = (filterType: any) => {
    switch (filterType) {
      case 'meal':
        return FOOD_TYPE_LIST;
      case 'spice':
        return SPICE_LIST;
      case 'bookedFor':
        return guestList;
      default:
        return [];
    }
  };
  const handleFilterSelect = (selectedItem: any) => {
    setFilter((prev: any) => ({
      ...prev,
      [activeFilter]: selectedItem,
    }));
    dismiss();
  };

  const [selectedItems, setSelectedItems] = useState<any>([]);
  const [datePickerVisibility, setDatePickerVisibility] = useState(false);

  const fetchFoods = async ({ pageParam = 1 }) => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/food/get',
        {
          cardno: user.cardno,
          page: pageParam,
          date: filter.date,
          meal: filter.meal?.key,
          spice: filter.spice?.key,
          bookedFor: filter.bookedFor?.key,
        },
        null,
        (res: any) => {
          resolve(Array.isArray(res.data) ? res.data : []);
        },
        () => reject(new Error('Failed to fetch foods'))
      );
    });
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch }: any =
    useInfiniteQuery({
      queryKey: [
        'foodBooking',
        user.cardno,
        filter.date,
        filter.meal?.key,
        filter.spice?.key,
        filter.bookedFor?.key,
      ],
      queryFn: fetchFoods,
      initialPageParam: 1,
      staleTime: 1000 * 60 * 5,
      getNextPageParam: (lastPage: any, pages: any) =>
        lastPage?.length ? pages.length + 1 : undefined,
    });

  // Fetching guest list for filters
  const fetchGuests = async () => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/food/getGuestsForFilter',
        { cardno: user.cardno },
        null,
        (res: any) => resolve(Array.isArray(res.data) ? res.data : []),
        () => reject(new Error('Failed to fetch guests'))
      );
    });
  };

  const { data: guestList, isLoading: isLoadingGuest } = useQuery({
    queryKey: ['foodGuestList', user.cardno],
    queryFn: fetchGuests,
    staleTime: 1000 * 60 * 60 * 2,
  });

  // Mutation to cancel booking
  const cancelBookingMutation = useMutation({
    mutationFn: () => {
      return new Promise((resolve, reject) => {
        handleAPICall(
          'PATCH',
          '/food/cancel',
          null,
          { cardno: user.cardno, food_data: selectedItems },
          resolve,
          () => reject(new Error('Failed to cancel booking'))
        );
      });
    },
    onSuccess: () => {
      setSelectedItems([]);
      queryClient.invalidateQueries({
        queryKey: [
          'foodBooking',
          user.cardno,
          filter.date,
          filter.meal?.key,
          filter.spice?.key,
          filter.bookedFor?.key,
        ],
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

  // Select all function - only cancellable items
  const handleSelectAll = () => {
    const allItems = data?.pages?.flat() || [];
    const cancellableItems = allItems.filter((item: any) => canCancelMeal(item.date));
    const allItemsFormatted = cancellableItems.map((item: any) => ({
      date: item.date,
      mealType: item.mealType,
      bookedFor: item.bookedFor,
    }));
    setSelectedItems(allItemsFormatted);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Deselect all function
  const handleDeselectAll = () => {
    setSelectedItems([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Check if all cancellable items are selected
  const allItems = data?.pages?.flat() || [];
  const cancellableItems = allItems.filter((item: any) => canCancelMeal(item.date));
  const isAllSelected =
    cancellableItems.length > 0 && selectedItems.length === cancellableItems.length;

  const renderItem = ({ item }: { item: any }) => {
    const itemKey = `${item.date}-${item.mealType}-${item.bookedFor}`;
    const isCancellable = canCancelMeal(item.date);

    const isSelected = selectedItems.some(
      (selected: any) => `${selected.date}-${selected.mealType}-${selected.bookedFor}` === itemKey
    );

    return (
      <Animated.View
        className={`mb-5 rounded-2xl p-3 ${
          Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'
        } ${
          isCancellable
            ? `bg-white ${isSelected ? 'border border-secondary' : ''}`
            : 'bg-gray-100 opacity-60'
        }`}>
        <TouchableOpacity
          disabled={!isCancellable}
          onPress={() => {
            if (!isCancellable) return;

            const prevSelectedItems = [...selectedItems];
            const itemKey = `${item.date}-${item.mealType}-${item.bookedFor}`;

            const itemExists = prevSelectedItems.some(
              (selected: any) =>
                `${selected.date}-${selected.mealType}-${selected.bookedFor}` === itemKey
            );

            if (itemExists) {
              setSelectedItems(
                prevSelectedItems.filter(
                  (selected: any) =>
                    `${selected.date}-${selected.mealType}-${selected.bookedFor}` !== itemKey
                )
              );
            } else {
              setSelectedItems([
                ...prevSelectedItems,
                {
                  date: item.date,
                  mealType: item.mealType,
                  bookedFor: item.bookedFor,
                },
              ]);
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          className="flex-row justify-between overflow-hidden">
          <View className="flex-1 flex-row items-center gap-x-4">
            <View
              className={`flex-col items-center justify-center rounded-full px-3 py-1.5 ${
                !isCancellable ? 'bg-gray-200' : isSelected ? 'bg-secondary' : 'bg-secondary-50'
              }`}>
              <Text
                className={`font-psemibold text-base ${
                  !isCancellable ? 'text-gray-400' : isSelected ? 'text-white' : 'text-secondary'
                }`}>
                {moment(item.date).date()}
              </Text>
              <Text
                className={`font-psemibold text-xs ${
                  !isCancellable ? 'text-gray-400' : isSelected ? 'text-white' : 'text-secondary'
                }`}>
                {moment(item.date).format('MMM')}
              </Text>
            </View>

            <View className="flex-col gap-y-2">
              {!isCancellable && (
                <View className="mb-1">
                  <Text className="font-pmedium text-xs text-red-500">
                    Cannot cancel (deadline passed)
                  </Text>
                </View>
              )}

              <CustomTag
                icon={icons.spice}
                iconStyles={'w-4 h-4 items-center justify-center'}
                text={item.spicy ? 'Regular' : 'Non-Spicy'}
                textStyles={
                  !isCancellable ? 'text-gray-400' : item.spicy ? 'text-red-200' : 'text-green-200'
                }
                containerStyles={
                  !isCancellable ? 'bg-gray-100' : item.spicy ? 'bg-red-100' : 'bg-green-100'
                }
                tintColor={!isCancellable ? '#9CA3AF' : item.spicy ? '#EB5757' : '#05B617'}
              />
              <View className="flex-row items-center">
                <Image
                  source={icons.meal}
                  resizeMode="contain"
                  className="h-4 w-4"
                  style={!isCancellable ? { opacity: 0.5 } : {}}
                />
                <Text className={`ml-1 ${!isCancellable ? 'text-gray-400' : 'text-gray-400'}`}>
                  Meal Type
                </Text>
                <Text
                  className={`ml-1 font-pmedium ${!isCancellable ? 'text-gray-500' : 'text-black'}`}>
                  {item.mealType}
                </Text>
              </View>
              {item.bookedBy && (
                <View className="flex-row items-center">
                  <Image
                    source={icons.person}
                    resizeMode="contain"
                    className="h-4 w-4"
                    style={!isCancellable ? { opacity: 0.5 } : {}}
                  />
                  <Text className={`ml-1 ${!isCancellable ? 'text-gray-400' : 'text-gray-400'}`}>
                    Booked For
                  </Text>
                  <Text
                    className={`ml-1 font-pmedium ${!isCancellable ? 'text-gray-500' : 'text-black'}`}>
                    {item.name}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <View className="mb-2 gap-y-1">
      <Text className="font-pregular text-black">Filter By:</Text>
      <ScrollView className="flex w-full" horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex w-full flex-row items-center gap-x-2">
          {/* Date Filter */}
          <View className="flex-row items-center justify-center gap-x-2 rounded-xl border border-gray-200 p-2">
            <TouchableOpacity onPress={() => setDatePickerVisibility(true)}>
              <Text className={`${filter.date ? 'text-black' : 'text-gray-400'} font-pregular`}>
                {filter.date ? moment(filter.date).format('Do MMMM YYYY') : 'Date'}
              </Text>
            </TouchableOpacity>

            {filter.date && (
              <TouchableOpacity onPress={() => setFilter((prev: any) => ({ ...prev, date: null }))}>
                <Image source={icons.cross} className="h-2.5 w-2.5" resizeMode="contain" />
              </TouchableOpacity>
            )}
          </View>

          <DateTimePickerModal
            isVisible={datePickerVisibility}
            mode="date"
            onConfirm={(date) => {
              setFilter((prev: any) => ({
                ...prev,
                date: moment(date).format('YYYY-MM-DD'),
              }));
              setDatePickerVisibility(false);
            }}
            onCancel={() => setDatePickerVisibility(false)}
          />

          {/* Meal Type Filter */}
          <View className="flex-row items-center justify-center gap-x-2 rounded-xl border border-gray-200 p-2">
            <TouchableOpacity onPress={() => handlePresentModalPress('meal')}>
              <Text className={`${filter.meal ? 'text-black' : 'text-gray-400'} font-pregular`}>
                {filter.meal ? filter.meal.value : 'Meal Type'}
              </Text>
            </TouchableOpacity>

            {filter.meal && (
              <TouchableOpacity onPress={() => setFilter((prev: any) => ({ ...prev, meal: null }))}>
                <Image source={icons.cross} className="h-2.5 w-2.5" resizeMode="contain" />
              </TouchableOpacity>
            )}
          </View>

          {/* Spice Level Filter */}
          <View className="flex-row items-center justify-center gap-x-2 rounded-xl border border-gray-200 p-2">
            <TouchableOpacity onPress={() => handlePresentModalPress('spice')}>
              <Text className={`${filter.spice ? 'text-black' : 'text-gray-400'} font-pregular`}>
                {filter.spice ? filter.spice.value : 'Spice Level'}
              </Text>
            </TouchableOpacity>

            {filter.spice && (
              <TouchableOpacity
                onPress={() => setFilter((prev: any) => ({ ...prev, spice: null }))}>
                <Image source={icons.cross} className="h-2.5 w-2.5" resizeMode="contain" />
              </TouchableOpacity>
            )}
          </View>

          {/* Booked For Filter */}
          {guestList && (
            <View className="flex-row items-center justify-center gap-x-2 rounded-xl border border-gray-200 p-2">
              <TouchableOpacity onPress={() => handlePresentModalPress('bookedFor')}>
                <Text
                  className={`${filter.bookedFor ? 'text-black' : 'text-gray-400'} font-pregular`}>
                  {filter.bookedFor ? filter.bookedFor.value : 'Booked For'}
                </Text>
              </TouchableOpacity>

              {filter.bookedFor && (
                <TouchableOpacity
                  onPress={() => setFilter((prev: any) => ({ ...prev, bookedFor: null }))}>
                  <Image source={icons.cross} className="h-2.5 w-2.5" resizeMode="contain" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );

  const renderFooter = () => (
    <View className="items-center">
      {(isFetchingNextPage || isLoading) && <ActivityIndicator />}
      {!hasNextPage && data?.pages?.[0]?.length > 0 && <Text>No more bookings at the moment</Text>}
    </View>
  );

  // Action buttons component
  const renderActionButtons = () => {
    if (selectedItems.length === 0) return null;

    return (
      <View
        className={`absolute bottom-0 left-0 right-0 ${Platform.OS === 'ios' ? 'pb-8' : 'pb-4'} px-4`}>
        <View
          className={`flex-row gap-x-3 rounded-2xl bg-white p-4 ${
            Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'
          }`}>
          {/* Selection info and Select/Deselect All button */}
          <View className="flex-1">
            <Text className="font-pmedium text-sm text-gray-600">
              {selectedItems.length} of {cancellableItems.length} selected
            </Text>
            {cancellableItems.length > 0 && (
              <TouchableOpacity
                onPress={isAllSelected ? handleDeselectAll : handleSelectAll}
                className="mt-1">
                <Text className="font-psemibold text-sm text-secondary">
                  {isAllSelected ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Cancel Bookings button */}
          <TouchableOpacity
            onPress={() => cancelBookingMutation.mutate()}
            disabled={cancelBookingMutation.isPending}
            className={`flex-row items-center justify-center rounded-xl px-6 py-3 ${
              cancelBookingMutation.isPending ? 'bg-gray-300' : 'bg-red-500'
            }`}>
            {cancelBookingMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <View className="flex-row items-center justify-center gap-x-2">
                <FontAwesome size={16} name="trash" color={'white'} />
                <Text className="font-psemibold text-white">
                  Cancel ({selectedItems.length}) Booking{selectedItems.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View className="mt-3 w-full flex-1">
      <FlashList
        className="flex-grow"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: selectedItems.length > 0 ? 120 : 16,
        }}
        data={data?.pages?.flat()}
        estimatedItemSize={150}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
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
        ListEmptyComponent={() => (
          <View className="h-full flex-1 items-center justify-center pt-40">
            {isError ? (
              <View className="items-center justify-center px-6">
                <Text className="mb-2 text-center text-lg font-semibold text-gray-800">
                  Oops! Something went wrong
                </Text>
                <Text className="mb-6 text-center text-gray-600">
                  Unable to load Food Bookings. Please check your connection and try again.
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
              <CustomEmptyMessage message={'No upcoming Food Bookings at this moment!'} />
            )}
          </View>
        )}
        keyExtractor={(item) => `${item.date}-${item.mealType}-${item.bookedFor}`}
        onEndReachedThreshold={0.1}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      />

      {/* Action Buttons */}
      {renderActionButtons()}

      <BottomSheetFilter
        ref={sheetRef}
        title={activeFilter ? `Filter ${activeFilter}` : 'Filter'}
        data={getFilterData(activeFilter)}
        onSelect={handleFilterSelect}
      />
    </View>
  );
}
