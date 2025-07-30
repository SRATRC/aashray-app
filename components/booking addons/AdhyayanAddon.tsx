import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { icons, types } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore, useBookingStore } from '@/stores';
import AddonItem from '../AddonItem';
import handleAPICall from '@/utils/HandleApiCall';
import HorizontalSeparator from '../HorizontalSeparator';
import CustomEmptyMessage from '../CustomEmptyMessage';
import moment from 'moment';
import * as Haptics from 'expo-haptics';

interface AdhyayanAddonProps {
  adhyayanBookingList: any;
  setAdhyayanBookingList: any;
  booking: any;
}

const AdhyayanAddon: React.FC<AdhyayanAddonProps> = ({
  adhyayanBookingList,
  setAdhyayanBookingList,
  booking,
}) => {
  const user = useAuthStore((state) => state.user);
  const mumukshuData = useBookingStore((state) => state.mumukshuData);
  const setMumukshuData = useBookingStore((state) => state.setMumukshuData);

  // Extract dates safely with fallbacks
  const startDate =
    booking === types.ROOM_DETAILS_TYPE ? mumukshuData.room?.startDay : mumukshuData.travel?.date;

  const endDate = booking === types.ROOM_DETAILS_TYPE ? mumukshuData.room?.endDay : '';

  const fetchAdhyayans = async () => {
    // Add validation to prevent API calls with invalid data
    if (!user?.cardno || !startDate) {
      throw new Error('Missing required data for fetching adhyayans');
    }

    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/adhyayan/getrange',
        {
          cardno: user.cardno,
          start_date: startDate,
          end_date: endDate || '',
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
    isLoading,
    isError,
    error,
    data: adhyayanList,
  }: any = useQuery({
    queryKey: ['adhyayans', booking, startDate, endDate, user?.cardno],
    queryFn: fetchAdhyayans,
    staleTime: 1000 * 60 * 30,
    // Only enable query when we have valid data
    enabled: !!(user?.cardno && startDate),
    // Add retry configuration to handle temporary errors
    retry: (failureCount, error) => {
      // Don't retry if it's a validation error
      if (error.message.includes('Missing required data')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const handleToggleSelection = (item: any) => {
    const prevSelectedItems = [...adhyayanBookingList];
    const isSelected = prevSelectedItems.some((selected) => selected.id === item.id);

    if (isSelected) {
      const filteredList = prevSelectedItems.filter((selected) => selected.id !== item.id);
      setAdhyayanBookingList(filteredList);
      if (filteredList.length === 0) {
        setMumukshuData((prev: any) => {
          const { adhyayan, ...rest } = prev;
          return rest;
        });
      }
    } else {
      setAdhyayanBookingList([...prevSelectedItems, item]);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderItem = (item: any) => {
    const isSelected = adhyayanBookingList.some((selected: any) => selected.id === item.id);

    return (
      <View key={item.id} style={{ marginBottom: 8, width: '100%' }}>
        <View className="rounded-2xl bg-gray-50 p-2">
          <View className="flex flex-row items-center justify-between py-2">
            <Text className="font-pmedium text-base text-secondary">{`${moment(
              item.start_date
            ).format('Do MMMM')} - ${moment(item.end_date).format('Do MMMM, YYYY')}`}</Text>
          </View>
          <HorizontalSeparator />
          <View className="flex flex-row gap-x-2 pb-4 pt-2">
            <Image source={icons.description} className="h-4 w-4" resizeMode="contain" />
            <Text className="font-pregular text-gray-400">Name: </Text>
            <Text className="font-pmedium text-black" numberOfLines={1} style={{ flex: 1 }}>
              {item.name}
            </Text>
          </View>
          <View className="flex flex-row gap-x-2 pb-4">
            <Image source={icons.person} className="h-4 w-4" resizeMode="contain" />
            <Text className="font-pregular text-gray-400">Swadhyay Karta: </Text>
            <Text className="font-pmedium text-black" numberOfLines={1} style={{ flex: 1 }}>
              {item.speaker}
            </Text>
          </View>
          <View className="flex flex-row gap-x-2">
            <Image source={icons.charge} className="h-4 w-4" resizeMode="contain" />
            <Text className="font-pregular text-gray-400">Charges:</Text>
            <Text className="font-pmedium text-black">₹ {item.amount}</Text>
          </View>
          <TouchableOpacity
            style={{
              marginTop: 16,
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#your-secondary-color', // Replace with actual color
              backgroundColor: isSelected ? '#your-secondary-color' : 'transparent',
            }}
            onPress={() => handleToggleSelection(item)}
            activeOpacity={0.8}>
            <Text
              className={`text-md font-pmedium ${isSelected ? 'text-white' : 'text-secondary-100'}`}>
              {isSelected ? 'Unregister' : 'Register'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    // Show empty state if required data is missing
    if (!user?.cardno || !startDate) {
      return (
        <View style={{ marginTop: 24, flex: 1 }}>
          <CustomEmptyMessage message={'Please select dates to view available Adhyayans!'} />
        </View>
      );
    }

    if (isLoading) {
      return (
        <View
          style={{
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 32,
          }}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    if (isError) {
      return (
        <View
          style={{
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 32,
          }}>
          <Text className="text-red-500">
            Error fetching data: {error?.message || 'Unknown error'}
          </Text>
        </View>
      );
    }

    if (!adhyayanList || adhyayanList.length === 0) {
      return (
        <View style={{ marginTop: 24, flex: 1 }}>
          <CustomEmptyMessage message={'No Adhyayans available on selected dates!'} />
        </View>
      );
    }

    return (
      <View style={{ marginTop: 8, width: '100%', paddingVertical: 8 }}>
        {adhyayanList.map((item: any) => renderItem(item))}
      </View>
    );
  };

  return (
    <AddonItem
      onCollapse={() => {
        setAdhyayanBookingList([]);
        setMumukshuData((prev: any) => {
          const { adhyayan, ...rest } = prev;
          return rest;
        });
      }}
      visibleContent={
        <View className="flex flex-row items-center gap-x-4">
          <Image source={icons.adhyayan} className="h-10 w-10" resizeMode="contain" />
          <Text className="font-pmedium">Raj Adhyayan Booking</Text>
        </View>
      }
      containerStyles={'mt-3'}>
      {renderContent()}
    </AddonItem>
  );
};

export default AdhyayanAddon;
