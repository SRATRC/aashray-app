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
import { icons } from '@/constants';
import { FlashList } from '@shopify/flash-list';
import { useAuthStore } from '@/stores';
import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { FontAwesome } from '@expo/vector-icons';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import { useBottomTabOverflow } from '../TabBarBackground';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import handleAPICall from '@/utils/HandleApiCall';
import CustomEmptyMessage from '../CustomEmptyMessage';
import BottomSheetFilter from '../BottomSheetFilter';
import moment from 'moment';
import * as Haptics from 'expo-haptics';

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
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const tabBarPadding = useTabBarPadding();
  const tabBarHeight = useBottomTabOverflow();

  const CancellationNote = () => (
    <View className="mb-2 flex-row items-start gap-x-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
      <FontAwesome name="info-circle" size={16} color="#b45309" style={{ alignSelf: 'center' }} />
      <Text className="flex-1 font-pregular text-sm text-amber-800">
        Bookings can be cancelled before 8 PM of each day for the next day's meals.
      </Text>
    </View>
  );

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
    const cutoffTime = mealMoment.clone().subtract(1, 'day').hour(20).minute(0).second(0);

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

  const handleDeselectAll = () => {
    setSelectedItems([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

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
        activeOpacity={isCancellable ? 0.98 : 1}
        className={`mb-3 rounded-xl ${!isCancellable ? 'border border-neutral-200 bg-neutral-50' : 'border border-neutral-200 bg-white'} ${
          Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'
        }`}>
        {/* Main content */}
        <View className="p-4">
          <View className="flex-row items-center justify-between">
            {/* Left side - Date badge */}
            <View
              className={`rounded-lg px-3 py-2 ${
                !isCancellable ? 'bg-neutral-100' : 'bg-neutral-50'
              }`}>
              <Text
                className={`font-pmedium text-xs uppercase tracking-wider ${
                  !isCancellable ? 'text-neutral-400' : 'text-neutral-600'
                }`}>
                {moment(item.date).format('MMM DD')}
              </Text>
              <Text
                className={`font-psemibold text-lg ${
                  !isCancellable ? 'text-neutral-400' : 'text-neutral-900'
                }`}>
                {moment(item.date).format('ddd')}
              </Text>
            </View>

            {/* Center - Meal info */}
            <View className="flex-1 px-4">
              <Text
                className={`font-psemibold text-lg ${
                  !isCancellable ? 'text-neutral-400' : 'text-neutral-900'
                }`}>
                {item.mealType}
              </Text>

              <View className="mt-1 flex-row items-center space-x-3">
                <View className="flex-row items-center">
                  <View
                    className={`mr-1.5 h-2 w-2 rounded-full ${
                      !isCancellable
                        ? 'bg-neutral-300'
                        : item.spicy
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                    }`}
                  />
                  <Text
                    className={`font-pregular text-sm ${
                      !isCancellable ? 'text-neutral-400' : 'text-neutral-600'
                    }`}>
                    {item.spicy ? 'Spicy' : 'Mild'}
                  </Text>
                </View>

                {item.bookedBy && (
                  <Text
                    className={`font-pregular text-sm ${
                      !isCancellable ? 'text-neutral-400' : 'text-neutral-500'
                    }`}>
                    • {item.name}
                  </Text>
                )}
              </View>
            </View>

            {/* Right side - Selection */}
            <View className="items-center justify-center">
              {!isCancellable ? (
                <View className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
                  <FontAwesome name="clock-o" size={14} color="#A3A3A3" />
                </View>
              ) : (
                <View
                  className={`h-6 w-6 items-center justify-center rounded-full ${
                    isSelected ? 'bg-secondary' : 'border-2 border-neutral-200 bg-neutral-100'
                  }`}>
                  {isSelected && <FontAwesome name="check" size={12} color="white" />}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Selection indicator strip */}
        {isSelected && (
          <View className="absolute bottom-0 left-0 top-0 w-1 rounded-l-xl bg-secondary" />
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
      <CancellationNote />
      <View className="mb-2 gap-y-1">
        <Text className="font-pregular text-black">Filter By:</Text>
        <ScrollView className="flex w-full" horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex w-full flex-row items-center gap-x-2">
            <View className="flex-row items-center justify-center gap-x-2 rounded-xl border border-gray-200 p-2">
              <TouchableOpacity onPress={() => setDatePickerVisibility(true)}>
                <Text className={`${filter.date ? 'text-black' : 'text-gray-400'} font-pregular`}>
                  {filter.date ? moment(filter.date).format('Do MMMM YYYY') : 'Date'}
                </Text>
              </TouchableOpacity>

              {filter.date && (
                <TouchableOpacity
                  onPress={() => setFilter((prev: any) => ({ ...prev, date: null }))}>
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

            <View className="flex-row items-center justify-center gap-x-2 rounded-xl border border-gray-200 p-2">
              <TouchableOpacity onPress={() => handlePresentModalPress('meal')}>
                <Text className={`${filter.meal ? 'text-black' : 'text-gray-400'} font-pregular`}>
                  {filter.meal ? filter.meal.value : 'Meal Type'}
                </Text>
              </TouchableOpacity>

              {filter.meal && (
                <TouchableOpacity
                  onPress={() => setFilter((prev: any) => ({ ...prev, meal: null }))}>
                  <Image source={icons.cross} className="h-2.5 w-2.5" resizeMode="contain" />
                </TouchableOpacity>
              )}
            </View>

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
    </View>
  );

  const renderFooter = () => (
    <View className="items-center">
      {(isFetchingNextPage || isLoading) && <ActivityIndicator />}
      {!hasNextPage && data?.pages?.[0]?.length > 0 && <Text>No more bookings at the moment</Text>}
      {selectedItems.length > 0 && <View style={{ height: 104 }} />}
    </View>
  );

  const renderActionButtons = () => {
    if (selectedItems.length === 0) return null;

    return (
      <View
        className={`absolute bottom-0 left-0 right-0 ${Platform.OS === 'ios' ? 'pb-8' : 'pb-4'} px-4`}
        style={{ paddingBottom: Platform.OS === 'ios' ? tabBarHeight + 20 : 20 }}>
        <View
          className={`flex-row gap-x-3 rounded-2xl bg-white p-4 ${
            Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'
          }`}>
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
          paddingBottom: tabBarPadding,
          paddingTop: 8,
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
              <CustomEmptyMessage
                message={"No food bookings?\nYour stomach's inner peace is disturbed."}
              />
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
