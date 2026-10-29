import { View, Text } from 'react-native';
import { colors } from '@/src/constants';
import { useBookingStore } from '@/src/stores';
import { Ionicons } from '@expo/vector-icons';
import HorizontalSeparator from '../HorizontalSeparator';
import PrimaryAddonBookingCard from '../PrimaryAddonBookingCard';
import CustomTag from '../CustomTag';
import TravelItinerary, { ItineraryLeg } from './TravelItinerary';

const GuestTravelBookingDetails: React.FC<{ containerStyles: any }> = ({ containerStyles }) => {
  const guestData = useBookingStore((store) => store.guestData);
  const isRoundTrip = Boolean(guestData.travel?.return_date);

  const count =
    guestData?.travel?.guestGroup?.reduce(
      (acc: any, group: any) => acc + (group.guests?.length || 0),
      0
    ) || 0;

  const legs: ItineraryLeg[] = isRoundTrip
    ? [
        { label: 'Onward', date: guestData.travel?.date, groups: guestData.travel?.guestGroup },
        {
          label: 'Return',
          date: guestData.travel?.return_date,
          groups: guestData.travel?.returnGuestGroup,
        },
      ]
    : [{ date: guestData.travel?.date, groups: guestData.travel?.guestGroup }];

  return (
    <PrimaryAddonBookingCard containerStyles={containerStyles} title={'Raj Pravas Booking'}>
      <View className="p-4">
        {guestData.validationData?.travelDetails && (
          <CustomTag
            text={guestData.validationData.travelDetails.status}
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
          {count} {count === 1 ? 'guest' : 'guests'}
        </Text>
      </View>
    </PrimaryAddonBookingCard>
  );
};

export default GuestTravelBookingDetails;
