import { View, Text, Image, ScrollView } from 'react-native';
import { icons, status } from '@/constants';
import { countStatusesForField } from '@/utils/BookingValidationStatusCounter';
import HorizontalSeparator from '../HorizontalSeparator';
import moment from 'moment';
import CustomTag from '../CustomTag';
import PrimaryAddonBookingCard from '../PrimaryAddonBookingCard';
import { useBookingStore } from '@/stores';

const RoomBookingDetails: React.FC<{ containerStyles: any }> = ({ containerStyles }) => {
  const data = useBookingStore((state) => state.data);

  const formattedStartDate = moment(data.room.startDay).format('Do MMMM');
  const formattedEndDate = moment(data.room.endDay).format('Do MMMM, YYYY');

  const validationData = data?.validationData
    ? countStatusesForField(data?.validationData, 'roomDetails')
    : {};

  return (
    <PrimaryAddonBookingCard containerStyles={containerStyles} title="Raj Sharan Booking">
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
        <Image source={icons.ac} className="h-4 w-4" resizeMode="contain" />
        <Text className="font-pregular text-gray-400">Room Type: </Text>
        <Text className="font-pmedium text-black">
          {data.room.roomType === 'ac' ? 'AC ROOM' : 'Non AC ROOM'}
        </Text>
      </View>
      <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
        <Image source={icons.elder} className="h-4 w-4" resizeMode="contain" />
        <Text className="font-pregular text-gray-400">Ground Floor Booking:</Text>
        <Text className="font-pmedium text-black">
          {data.room.floorType === 'SC' ? 'Ground Floor' : 'Any Floor'}
        </Text>
      </View>
      {data.room.charge && (
        <View className="flex flex-row gap-x-2 px-6 pb-4">
          <Image source={icons.charge} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Charges:</Text>
          <Text className="font-pmedium text-black">₹ {data.room.charge}</Text>
        </View>
      )}
    </PrimaryAddonBookingCard>
  );
};

export default RoomBookingDetails;
