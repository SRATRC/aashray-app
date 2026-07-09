import { View, Text } from 'react-native';
import { colors } from '@/src/constants';
import { useBookingStore } from '@/src/stores';
import { Ionicons } from '@expo/vector-icons';
import HorizontalSeparator from '../HorizontalSeparator';
import PrimaryAddonBookingCard from '../PrimaryAddonBookingCard';
import CustomTag from '../CustomTag';
import TravelItinerary, { ItineraryLeg } from './TravelItinerary';

const MumukshuTravelBookingDetail: React.FC<{ containerStyles: any }> = ({ containerStyles }) => {
  const mumukshuData = useBookingStore((store) => store.mumukshuData);
  const isRoundTrip = Boolean(mumukshuData.travel?.return_date);

  const count =
    mumukshuData?.travel?.mumukshuGroup?.reduce(
      (acc: any, group: any) => acc + group.mumukshus.length,
      0
    ) || 0;

  const legs: ItineraryLeg[] = isRoundTrip
    ? [
        { label: 'Onward', date: mumukshuData.travel.date, groups: mumukshuData.travel.mumukshuGroup },
        {
          label: 'Return',
          date: mumukshuData.travel.return_date,
          groups: mumukshuData.travel.returnMumukshuGroup,
        },
      ]
    : [{ date: mumukshuData.travel.date, groups: mumukshuData.travel.mumukshuGroup }];

  return (
    <PrimaryAddonBookingCard containerStyles={containerStyles} title={'Raj Pravas Booking'}>
      <View className="p-4">
        {mumukshuData.validationData?.travelDetails && (
          <CustomTag
            text={mumukshuData.validationData.travelDetails.status}
            textStyles={'text-red-200'}
            containerStyles={'bg-red-100 mb-3'}
          />
        )}
        <TravelItinerary legs={legs} />
      </View>

      <HorizontalSeparator />
      <View className="flex-row items-center gap-x-2 px-4 py-3">
        <Ionicons name="people" size={15} color={colors.gray_400} />
        <Text className="font-pregular text-sm text-gray-500">Booked for</Text>
        <Text className="font-pmedium text-sm text-black">
          {count} {count === 1 ? 'mumukshu' : 'mumukshus'}
        </Text>
      </View>
    </PrimaryAddonBookingCard>
  );
};

export default MumukshuTravelBookingDetail;
