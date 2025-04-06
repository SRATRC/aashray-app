import { View, Text, Image, ScrollView } from 'react-native';
import { icons, status } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import { countStatusesForField } from '../../utils/BookingValidationStatusCounter';
import HorizontalSeparator from '../HorizontalSeparator';
import moment from 'moment';
import CustomTag from '../CustomTag';
import PrimaryAddonBookingCard from '../PrimaryAddonBookingCard';

const MumukshuRoomBookingDetails: React.FC<{ containerStyles: any }> = ({ containerStyles }) => {
  const { mumukshuData } = useGlobalContext();
  const formattedStartDate = moment(mumukshuData?.room?.startDay).format('Do MMMM');
  const formattedEndDate = mumukshuData?.room?.endDay
    ? moment(mumukshuData?.room?.endDay).format('Do MMMM, YYYY')
    : null;

  const validationData = mumukshuData?.validationData
    ? countStatusesForField(mumukshuData?.validationData, 'roomDetails')
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
        <Image source={icons.person} className="h-4 w-4" resizeMode="contain" />
        <Text className="font-pregular text-gray-400">Booked For:</Text>
        <Text className="font-pmedium text-black">
          {mumukshuData?.room?.mumukshuGroup?.reduce(
            (acc: any, group: any) => acc + group.mumukshus.length,
            0
          )}{' '}
          mumukshus
        </Text>
      </View>
      {mumukshuData.room.charge && (
        <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
          <Image source={icons.charge} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Charges:</Text>
          <Text className="font-pmedium text-black">₹ {mumukshuData.room.charge}</Text>
        </View>
      )}
    </PrimaryAddonBookingCard>
  );
};

export default MumukshuRoomBookingDetails;
