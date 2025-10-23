import { View, Text, Image, ScrollView } from 'react-native';
import { icons, status } from '@/src/constants';
import { useBookingStore } from '@/src/stores';
import { countStatusesForField } from '@/src/utils/BookingValidationStatusCounter';
import HorizontalSeparator from '../HorizontalSeparator';
import PrimaryAddonBookingCard from '../PrimaryAddonBookingCard';
import CustomTag from '../CustomTag';
import moment from 'moment';

const GuestFlatBookingDetails: React.FC<{ containerStyles: any }> = ({ containerStyles }) => {
  const guestData = useBookingStore((store) => store.guestData);
  const formattedStartDate = moment(guestData?.flat?.startDay).format('Do MMMM');
  const formattedEndDate = guestData?.flat?.endDay
    ? moment(guestData?.flat?.endDay).format('Do MMMM, YYYY')
    : null;

  const validationData = guestData?.validationData
    ? countStatusesForField(guestData?.validationData, 'flatDetails')
    : {};

  return (
    <PrimaryAddonBookingCard containerStyles={containerStyles} title="Flat Booking">
      <View className="flex flex-row items-center gap-x-4 p-4">
        <Image source={icons.room} className="h-10 w-10" resizeMode="contain" />
        <View className="w-full flex-1 justify-center gap-y-1">
          {validationData && Object.keys(validationData).length > 0 && (
            <ScrollView horizontal>
              {Object.entries(validationData).map(([key, value]) => (
                <CustomTag
                  key={key}
                  text={`${key}: ${value}`}
                  textStyles={key == status.STATUS_AVAILABLE ? 'text-green-200' : 'text-red-200'}
                  containerStyles={`${
                    key == status.STATUS_AVAILABLE ? 'bg-green-100' : 'bg-red-100'
                  } mx-1`}
                />
              ))}
            </ScrollView>
          )}
          <Text className="text-md font-pmedium">
            {`${formattedStartDate} - ${formattedEndDate}`}
          </Text>
        </View>
      </View>

      <HorizontalSeparator otherStyles={'mb-4'} />

      <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
        <Image source={icons.person} className="h-4 w-4" resizeMode="contain" />
        <Text className="font-pregular text-gray-400">Booked For:</Text>
        <Text className="font-pmedium text-black">
          {guestData?.flat?.guests?.length || 0} Guests
        </Text>
      </View>
      {guestData.flat.charge && (
        <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
          <Image source={icons.charge} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Charges:</Text>
          <Text className="font-pmedium text-black">₹ {guestData.flat.charge}</Text>
        </View>
      )}
    </PrimaryAddonBookingCard>
  );
};

export default GuestFlatBookingDetails;
