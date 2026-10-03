import { View } from 'react-native';
import { useBookingStore } from '@/src/stores';
import CustomTag from '../CustomTag';
import PrimaryAddonBookingCard from '../PrimaryAddonBookingCard';
import TravelItinerary, { ItineraryLeg } from './TravelItinerary';

const TravelBookingDetails: React.FC<{ containerStyles?: any }> = ({ containerStyles }) => {
  const data = useBookingStore((state) => state.mumukshuData);
  const isRoundTrip = Boolean(data.travel?.return_date);

  const legs: ItineraryLeg[] = isRoundTrip
    ? [
        { label: 'Onward', date: data.travel.date, groups: data.travel.mumukshuGroup },
        { label: 'Return', date: data.travel.return_date, groups: data.travel.returnMumukshuGroup },
      ]
    : [{ date: data.travel.date, groups: data.travel.mumukshuGroup }];

  return (
    <PrimaryAddonBookingCard containerStyles={containerStyles} title={'Raj Pravas Booking'}>
      <View className="p-4">
        {data.validationData?.travelDetails && (
          <CustomTag
            text={data.validationData.travelDetails.status}
            textStyles={'text-red-200'}
            containerStyles={'bg-red-100 mb-3'}
          />
        )}
        <TravelItinerary legs={legs} />
      </View>
    </PrimaryAddonBookingCard>
  );
};

export default TravelBookingDetails;
