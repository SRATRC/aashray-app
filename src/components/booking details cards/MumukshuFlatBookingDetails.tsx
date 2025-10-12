import { View, Text, Image, ScrollView } from 'react-native';
import { colors, icons, status } from '@/src/constants';
import { countStatusesForField } from '@/src/utils/BookingValidationStatusCounter';
import { useBookingStore } from '@/src/stores';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import HorizontalSeparator from '../HorizontalSeparator';
import CustomTag from '../CustomTag';
import PrimaryAddonBookingCard from '../PrimaryAddonBookingCard';
import moment from 'moment';

const MumukshuFlatBookingDetails: React.FC<{ containerStyles: any }> = ({ containerStyles }) => {
  const data = useBookingStore((state) => state.mumukshuData);

  const formattedStartDate = moment(data?.flat?.startDay).format('Do MMMM');
  const formattedEndDate = data?.flat?.endDay
    ? moment(data?.flat?.endDay).format('Do MMMM, YYYY')
    : null;

  const validationData = data?.validationData?.flatDetails;
  const statuses = data?.validationData
    ? countStatusesForField(data?.validationData, 'flatDetails')
    : {};

  return (
    <PrimaryAddonBookingCard containerStyles={containerStyles} title="Flat Booking">
      <View className="flex flex-row items-center gap-x-4 p-4">
        <Image source={icons.room} className="h-10 w-10" resizeMode="contain" />
        <View className="w-full flex-1 justify-center gap-y-1">
          {statuses && Object.keys(statuses).length > 0 && (
            <ScrollView horizontal>
              {Object.entries(statuses).map(([key, value]) => (
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

      <View className="mb-4 gap-y-2">
        <View className="flex flex-row items-center gap-x-2 px-6">
          <Ionicons name="people" size={16} color={colors.gray_400} />
          <Text className="font-pregular text-gray-400">Booked For:</Text>
          <Text className="font-pmedium text-black">
            {data?.flat?.mumukshuGroup?.length || 0} Mumukshus
          </Text>
        </View>
        {validationData && validationData.length > 0 && (
          <View className="flex flex-row items-center gap-x-2 px-6">
            <MaterialIcons name="meeting-room" size={16} color={colors.gray_400} />
            <Text className="font-pregular text-gray-400">Flat Number:</Text>
            <Text className="font-pmedium text-black">{validationData[0]?.flatno || 'N/A'}</Text>
          </View>
        )}
      </View>
    </PrimaryAddonBookingCard>
  );
};

export default MumukshuFlatBookingDetails;
