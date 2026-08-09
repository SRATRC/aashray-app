import { View, Text, Image, ActivityIndicator } from 'react-native';
import { icons, types } from '@/src/constants';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore, useBookingStore } from '@/src/stores';
import AddonItem from '../AddonItem';
import AddonHeader from '../booking/shared/AddonHeader';
import handleAPICall from '@/src/utils/HandleApiCall';
import CustomEmptyMessage from '../CustomEmptyMessage';
import CatalogueCard from '../booking/shared/CatalogueCard';
import { isShibirFull, waitlistCountOf } from '../booking/shared/catalogueStatus';
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
      setAdhyayanBookingList([item]);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // The same card the main Adhyayan screen uses, so a shibir reads identically
  // in both places — including whether it is full.
  const renderItem = (item: any) => (
    <CatalogueCard
      key={item.id}
      title={item.name}
      startDate={item.start_date}
      endDate={item.end_date}
      isWaitlist={isShibirFull(item)}
      waitlistCount={waitlistCountOf(item)}
      selectable
      selected={adhyayanBookingList.some((selected: any) => selected.id === item.id)}
      meta={[
        { icon: 'person-outline', label: 'Swadhyay Karta', value: item.speaker },
        ...(item.location
          ? [{ icon: 'location-outline' as const, label: 'Location', value: item.location }]
          : []),
        { icon: 'card-outline', label: 'Charges', value: `₹${item.amount}` },
      ]}
      onPress={() => handleToggleSelection(item)}
    />
  );

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
        <AddonHeader icon={icons.adhyayan} title="Raj Adhyayan" subtitle="Join a shibir" />
      }
      containerStyles={'mt-3'}>
      {renderContent()}
    </AddonItem>
  );
};

export default AdhyayanAddon;
