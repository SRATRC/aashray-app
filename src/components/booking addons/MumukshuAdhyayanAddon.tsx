import { View, Text, Image, FlatList, ActivityIndicator } from 'react-native';
import { icons } from '@/src/constants';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore, useBookingStore } from '@/src/stores';
import handleAPICall from '@/src/utils/HandleApiCall';
import CustomEmptyMessage from '../CustomEmptyMessage';
import CustomSelectBottomSheet from '../CustomSelectBottomSheet';
import AddonItem from '../AddonItem';
import AddonHeader from '../booking/shared/AddonHeader';
import CatalogueCard from '../booking/shared/CatalogueCard';
import { isShibirFull, seatsLeftLabel, waitlistCountOf } from '../booking/shared/catalogueStatus';
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
          start_date:
            mumukshuData.room?.startDay || mumukshuData.travel?.date || mumukshuData.flat?.startDay,
          end_date: mumukshuData.room?.endDay || mumukshuData.flat?.endDay,
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

  // The same card the main Adhyayan screen uses, so a shibir reads identically
  // in both places — including whether it is full.
  const renderItem = ({ item }: any) => {
    const isSelected = adhyayanForm.adhyayan?.id == item.id;

    return (
      <CatalogueCard
        title={item.name}
        startDate={item.start_date}
        endDate={item.end_date}
        isWaitlist={isShibirFull(item)}
        waitlistCount={waitlistCountOf(item)}
        note={seatsLeftLabel(item)}
        selectable
        selected={isSelected}
        meta={[
          { icon: 'person-outline', label: 'Swadhyay Karta', value: item.speaker },
          ...(item.location
            ? [{ icon: 'location-outline' as const, label: 'Location', value: item.location }]
            : []),
          { icon: 'card-outline', label: 'Charges', value: `₹${item.amount}` },
        ]}
        onPress={() => {
          if (isSelected) {
            setAdhyayanForm((prev: any) => ({ ...prev, adhyayan: null }));
            setMumukshuData((prev: any) => {
              const { adhyayan, ...rest } = prev;
              return rest;
            });
          } else {
            setAdhyayanForm((prev: any) => ({ ...prev, adhyayan: item }));
          }
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      />
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
        <AddonHeader icon={icons.adhyayan} title="Raj Adhyayan" subtitle="Join a shibir" />
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
