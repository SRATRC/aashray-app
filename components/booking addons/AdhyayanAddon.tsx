import { View, Text, Image, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { icons, types } from '../../constants';
import { useQuery } from '@tanstack/react-query';
import { useGlobalContext } from '../../context/GlobalProvider';
import AddonItem from '../AddonItem';
import handleAPICall from '../../utils/HandleApiCall';
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
  const { user, data, setData } = useGlobalContext();

  const fetchAdhyayans = async () => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/adhyayan/getrange',
        {
          cardno: user.cardno,
          start_date: booking == types.ROOM_DETAILS_TYPE ? data.room.startDay : data.travel.date,
          end_date: booking == types.ROOM_DETAILS_TYPE ? data.room.endDay : '',
        },
        null,
        (res: any) => {
          resolve(Array.isArray(res.data) ? res.data : []);
        },
        () => reject(new Error('Failed to fetch rooms'))
      );
    });
  };

  const {
    isLoading,
    isError,
    error,
    data: adhyayanList,
  }: any = useQuery({
    queryKey: ['adhyayans', booking, data.room?.startDay, data.travel?.date],
    queryFn: fetchAdhyayans,
    staleTime: 1000 * 60 * 30,
  });

  const renderItem = ({ item }: any) => {
    const isSelected = adhyayanBookingList.some((selected: any) => selected.id === item.id);

    return (
      <View className="mb-2 w-full rounded-2xl bg-gray-50 p-2">
        <View className="flex flex-row items-center justify-between py-2">
          <Text className="font-pmedium text-base text-secondary">{`${moment(
            item.start_date
          ).format('Do MMMM')} - ${moment(item.end_date).format('Do MMMM, YYYY')}`}</Text>
        </View>
        <HorizontalSeparator />
        <View className="flex flex-row gap-x-2 pb-4 pt-2">
          <Image source={icons.description} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Name: </Text>
          <Text className="font-pmedium text-black" numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <View className="flex flex-row gap-x-2 pb-4">
          <Image source={icons.person} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Swadhyay Karta: </Text>
          <Text className="font-pmedium text-black" numberOfLines={1}>
            {item.speaker}
          </Text>
        </View>
        <View className="flex flex-row gap-x-2">
          <Image source={icons.charge} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Charges:</Text>
          <Text className="font-pmedium text-black">₹ {item.amount}</Text>
        </View>
        <TouchableOpacity
          className={`mt-4 w-full items-center justify-center rounded-lg border border-secondary p-2 ${
            isSelected ? 'bg-secondary' : ''
          }`}
          onPress={() => {
            const prevSelectedItems = [...adhyayanBookingList];
            const isSelected = prevSelectedItems.some((selected) => selected.id === item.id);
            if (isSelected) {
              const filteredList = prevSelectedItems.filter((selected) => selected.id !== item.id);
              setAdhyayanBookingList(filteredList);
              if (filteredList.length === 0) {
                setData((prev: any) => {
                  const { adhyayan, ...rest } = prev;
                  return rest;
                });
              }
            } else {
              setAdhyayanBookingList([...prevSelectedItems, item]);
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}>
          <Text
            className={`text-md font-pmedium ${isSelected ? 'text-white' : 'text-secondary-100'}`}>
            {isSelected ? 'Unregister' : 'Register'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFooter = () => (
    <View className="w-full items-center justify-center">
      {isLoading && <ActivityIndicator />}
      {isError && <Text>Error fetching data: {error.message}</Text>}
    </View>
  );

  return (
    <AddonItem
      onCollapse={() => {
        setAdhyayanBookingList([]);
        setData((prev: any) => {
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
      <FlatList
        className="mt-2 w-full py-2"
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled={true}
        data={adhyayanList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View className="mt-6 flex-1">
            <CustomEmptyMessage message={'No Adhyayans available on selected dates!'} />
          </View>
        }
        scrollEnabled={false}
      />
    </AddonItem>
  );
};

export default AdhyayanAddon;
