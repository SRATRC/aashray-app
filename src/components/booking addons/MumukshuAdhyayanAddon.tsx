import { View, Text, Image, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { icons } from '@/src/constants';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore, useBookingStore } from '@/src/stores';
import handleAPICall from '@/src/utils/HandleApiCall';
import HorizontalSeparator from '../HorizontalSeparator';
import CustomEmptyMessage from '../CustomEmptyMessage';
import CustomSelectBottomSheet from '../CustomSelectBottomSheet';
import AddonItem from '../AddonItem';
import moment from 'moment';
import * as Haptics from 'expo-haptics';

interface MumukshuAdhyayanAddonProps {
  adhyayanForm: any;
  setAdhyayanForm: any;
  updateAdhyayanForm: any;
  INITIAL_ADHYAYAN_FORM: any;
  mumukshu_dropdown: any;
}

const MumukshuAdhyayanAddon: React.FC<MumukshuAdhyayanAddonProps> = ({
  adhyayanForm,
  setAdhyayanForm,
  updateAdhyayanForm,
  INITIAL_ADHYAYAN_FORM,
  mumukshu_dropdown,
}) => {
  const user = useAuthStore((store) => store.user);
  const mumukshuData = useBookingStore((store) => store.mumukshuData);
  const setMumukshuData = useBookingStore((store) => store.setMumukshuData);

  const fetchAdhyayans = async () => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/adhyayan/getrange',
        {
          cardno: user.cardno,
          start_date: mumukshuData.room?.startDay || mumukshuData.travel?.date,
          end_date: mumukshuData.room?.endDay,
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
    queryKey: ['adhyayans', mumukshuData.room?.startDay && mumukshuData.room?.endDay],
    queryFn: fetchAdhyayans,
    staleTime: 1000 * 60 * 30,
    retry: false,
  });

  const renderItem = ({ item }: any) => {
    const isSelected = adhyayanForm.adhyayan?.id == item.id;

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
            if (isSelected) {
              setAdhyayanForm((prev: any) => ({
                ...prev,
                adhyayan: null,
              }));
              setMumukshuData((prev: any) => {
                const { adhyayan, ...rest } = prev;
                return rest;
              });
            } else {
              setAdhyayanForm((prev: any) => ({
                ...prev,
                adhyayan: item,
              }));
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
        setAdhyayanForm(INITIAL_ADHYAYAN_FORM);
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
      {(adhyayanList?.length > 0 || isError) && (
        <View className="w-full flex-col items-center justify-center">
          <CustomSelectBottomSheet
            className="mt-5 w-full"
            label="Select Mumukshus"
            placeholder="Select Mumukshus"
            options={mumukshu_dropdown}
            selectedValues={adhyayanForm.mumukshuIndices}
            onValuesChange={(val) => updateAdhyayanForm('mumukshuIndices', val)}
            multiSelect={true}
            confirmButtonText="Select"
          />
        </View>
      )}
      <FlatList
        className="flex-grow-1 mt-2 w-full py-2"
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

export default MumukshuAdhyayanAddon;
