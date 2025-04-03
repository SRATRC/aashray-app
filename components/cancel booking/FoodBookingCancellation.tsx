import {
  View,
  Text,
  Image,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  SectionList,
  ScrollView,
} from 'react-native';
import { useState, useCallback, useRef } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { icons } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useBottomSheetModal } from '@gorhom/bottom-sheet';
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

const FoodBookingCancellation = () => {
  const { user } = useGlobalContext();
  const queryClient = useQueryClient();

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

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError }: any =
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

  const renderItem = ({ item, section }: { item: any; section: any }) => {
    const itemKey = `${item.date}-${item.mealType}-${item.bookedFor}`;

    const isSelected = selectedItems.some(
      (selected: any) => `${selected.date}-${selected.mealType}-${selected.bookedFor}` === itemKey
    );

    const shakeTranslateX = useSharedValue(0);

    const shake = useCallback(() => {
      shakeTranslateX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }, [shakeTranslateX]);

    const rShakeStyle = useAnimatedStyle(() => {
      return {
        transform: [{ translateX: shakeTranslateX.value }],
      };
    }, [shakeTranslateX]);

    return (
      <Animated.View
        style={[rShakeStyle]}
        className={`mb-5 rounded-2xl bg-white p-3 ${
          Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'
        } ${isSelected && 'border border-secondary'}`}>
        <TouchableOpacity
          onPress={() => {
            if (section.title === 'upcoming') {
              const prevSelectedItems = [...selectedItems];
              const itemKey = `${item.date}-${item.mealType}-${item.bookedFor}`;
              console.log(itemKey);

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
            } else {
              shake();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          }}
          className="flex-row justify-between overflow-hidden">
          <View className="flex-1 flex-row items-center gap-x-4">
            <View
              className={`flex-col items-center justify-center rounded-full px-3 py-1.5 ${
                section.title === 'upcoming'
                  ? isSelected
                    ? 'bg-secondary'
                    : 'bg-secondary-50'
                  : 'bg-gray-100'
              }`}>
              <Text
                className={`${
                  section.title === 'upcoming'
                    ? isSelected
                      ? 'text-white'
                      : 'text-secondary'
                    : 'text-gray-400'
                } font-psemibold text-base`}>
                {moment(item.date).date()}
              </Text>
              <Text
                className={`${
                  section.title === 'upcoming'
                    ? isSelected
                      ? 'text-white'
                      : 'text-secondary'
                    : 'text-gray-400'
                } font-psemibold text-xs`}>
                {moment(item.date).format('MMM')}
              </Text>
            </View>

            <View className="flex-col gap-y-2">
              <CustomTag
                icon={icons.spice}
                iconStyles={'w-4 h-4 items-center justify-center'}
                text={item.spicy ? 'Regular' : 'Non-Spicy'}
                textStyles={
                  section.title === 'upcoming'
                    ? item.spicy
                      ? 'text-red-200'
                      : 'text-green-200'
                    : 'text-gray-400'
                }
                containerStyles={
                  section.title === 'upcoming'
                    ? item.spicy
                      ? 'bg-red-100'
                      : 'bg-green-100'
                    : 'bg-gray-100'
                }
                tintColor={
                  section.title === 'upcoming' ? (item.spicy ? '#EB5757' : '#05B617') : null
                }
              />
              <View className="flex-row items-center">
                <Image source={icons.meal} resizeMode="contain" className="h-4 w-4" />
                <Text className="ml-1 text-gray-400">{'Meal Type'}</Text>
                <Text className="ml-1 font-pmedium text-black">{item.mealType}</Text>
              </View>
              {item.bookedFor && (
                <View className="flex-row items-center">
                  <Image source={icons.person} resizeMode="contain" className="h-4 w-4" />
                  <Text className="ml-1 text-gray-400">{'Booked For'}</Text>
                  <Text className="ml-1 font-pmedium text-black">{item.name}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderSectionHeader = ({
    section: { title, data },
  }: {
    section: { title: any; data: any };
  }) => {
    const allSelected = data.every((item: any) =>
      selectedItems.some(
        (selected: any) => selected.date === item.date && selected.mealType === item.mealType
      )
    );

    const handleSelectAll = () => {
      if (allSelected) {
        setSelectedItems(
          selectedItems.filter(
            (selected: any) =>
              !data.some(
                (item: any) =>
                  item.date === selected.date &&
                  item.mealType === selected.mealType &&
                  item.bookedFor === selected.bookedFor
              )
          )
        );
      } else {
        const newSelections = data.map((item: any) => ({
          date: item.date,
          mealType: item.mealType,
          bookedFor: item.bookedFor,
        }));
        setSelectedItems([...selectedItems, ...newSelections]);
      }
    };

    const handleDelete = () => {
      cancelBookingMutation.mutate();
    };

    return (
      <View className="flex-row items-center justify-between">
        <Text className="mx-1 mb-2 font-psemibold text-lg">{title}</Text>
        {title === 'upcoming' && (
          <View className="flex-row gap-x-2">
            <TouchableOpacity activeOpacity={1} onPress={handleSelectAll}>
              <Text className="mx-1 mb-2 font-plight text-xs text-gray-500">
                {allSelected ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
            {selectedItems.length > 0 && (
              <TouchableOpacity activeOpacity={1} onPress={handleDelete}>
                <Text className="mx-1 mb-2 font-pregular text-xs text-red-500">Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
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

  if (isError)
    return (
      <Text className="items-center justify-center font-pregular text-lg text-red-500">
        An error occurred
      </Text>
    );

  return (
    <View className="w-full">
      <SectionList
        className="flex-grow-1 mt-2 px-4 py-2"
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        nestedScrollEnabled={true}
        sections={data?.pages?.flatMap((page: any) => page) || []}
        renderItem={({ item, section }) => renderItem({ item, section })}
        keyExtractor={(item) => `${item.date}-${item.mealType}-${item.bookedFor}`}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReachedThreshold={0.1}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
      />
      {!isFetchingNextPage && data?.pages?.[0]?.length == 0 && (
        <CustomEmptyMessage
          lottiePath={require('../../assets/lottie/empty.json')}
          message={"No food bookings? Your stomach's inner peace is disturbed."}
        />
      )}
      <BottomSheetFilter
        ref={sheetRef}
        title={activeFilter ? `Filter ${activeFilter}` : 'Filter'}
        data={getFilterData(activeFilter)}
        onSelect={handleFilterSelect}
      />
    </View>
  );
};

export default FoodBookingCancellation;
