import { View, Text, Image, ScrollView } from 'react-native';
import { colors, icons } from '@/src/constants';
import { useBookingStore } from '@/src/stores';
import { countStatusesForField } from '@/src/utils/BookingValidationStatusCounter';
import { getStatusTagStyle } from '@/src/utils/statusTagStyle';
import { Ionicons } from '@expo/vector-icons';
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

  const flatDetails = guestData?.validationData?.flatDetails || [];
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
              {Object.entries(validationData).map(([key, value]) => {
                const { textStyles, containerStyles } = getStatusTagStyle(key, flatDetails);
                return (
                  <CustomTag
                    key={key}
                    text={`${key}: ${value}`}
                    textStyles={textStyles}
                    containerStyles={containerStyles}
                  />
                );
              })}
            </ScrollView>
          )}
          <Text className="text-md font-pmedium">
            {`${formattedStartDate} - ${formattedEndDate}`}
          </Text>
        </View>
      </View>

      <HorizontalSeparator otherStyles={'mb-4'} />

      <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
        <Ionicons name="people" size={16} color={colors.gray_400} />
        <Text className="font-pregular text-gray-400">Booked For:</Text>
        <Text className="font-pmedium text-black">
          {guestData?.flat?.guests?.length || 0} Guests
        </Text>
      </View>
      {/* {guestData.flat.charge && (
        <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
          <Image source={icons.charge} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Charges:</Text>
          <Text className="font-pmedium text-black">₹ {guestData.flat.charge}</Text>
        </View>
      )} */}
    </PrimaryAddonBookingCard>
  );
};

export default GuestFlatBookingDetails;
