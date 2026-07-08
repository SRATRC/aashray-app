import { View, Text, Image } from 'react-native';
import { colors, icons } from '@/src/constants';
import { useBookingStore } from '@/src/stores';
import { Ionicons } from '@expo/vector-icons';
import HorizontalSeparator from '../HorizontalSeparator';
import PrimaryAddonBookingCard from '../PrimaryAddonBookingCard';
import CustomTag from '../CustomTag';
import TravelDateDisplay from '../TravelDateDisplay';
import TravelLegDetails from './TravelLegDetails';
import moment from 'moment';

const GuestTravelBookingDetails: React.FC<{ containerStyles: any }> = ({ containerStyles }) => {
  const guestData = useBookingStore((store) => store.guestData);
  const isRoundTrip = Boolean(guestData.travel?.return_date);

  return (
    <PrimaryAddonBookingCard containerStyles={containerStyles} title={'Raj Pravas Booking'}>
      <View className="flex flex-row items-center gap-x-4 p-4">
        <Image source={icons.travel} className="h-10 w-10" resizeMode="contain" />
        <View className="w-full flex-1 justify-center gap-y-1">
          {guestData.validationData?.travelDetails && (
            <CustomTag
              text={guestData.validationData.travelDetails.status}
              textStyles={'text-red-200'}
              containerStyles={'bg-red-100'}
            />
          )}
          <TravelDateDisplay
            date={guestData.travel?.date}
            returnDate={guestData.travel?.return_date}
            pickup={guestData.travel?.guestGroup?.[0]?.pickup}
            drop={guestData.travel?.guestGroup?.[0]?.drop}
          />
        </View>
      </View>

      <HorizontalSeparator otherStyles={'mb-4'} />

      <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
        <Ionicons name="people" size={16} color={colors.gray_400} />
        <Text className="font-pregular text-gray-400">Booked For:</Text>
        <Text className="font-pmedium text-black">
          {guestData?.travel?.guestGroup?.reduce(
            (acc: any, group: any) => acc + (group.guests?.length || 0),
            0
          )}{' '}
          guests
        </Text>
      </View>

      {isRoundTrip ? (
        <>
          <HorizontalSeparator otherStyles={'mb-4'} />
          <TravelLegDetails label="Onward" groups={guestData.travel?.guestGroup} />
          <HorizontalSeparator otherStyles={'mb-4'} />
          <TravelLegDetails label="Return" groups={guestData.travel?.returnGuestGroup} />
        </>
      ) : null}
    </PrimaryAddonBookingCard>
  );
};

export default GuestTravelBookingDetails;
