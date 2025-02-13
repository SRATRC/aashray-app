import { View, Text, Image, Platform } from 'react-native';
import { icons } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import HorizontalSeparator from '../HorizontalSeparator';
import moment from 'moment';

const MumukshuFoodBookingDetails: React.FC<{ containerStyles: any }> = ({ containerStyles }) => {
  const { mumukshuData } = useGlobalContext();

  const formattedStartDate = moment(mumukshuData.food.startDay).format('Do MMMM');
  const formattedEndDate = moment(mumukshuData.food.endDay).format('Do MMMM, YYYY');

  return (
    <View className={`w-full px-4 ${containerStyles}`}>
      <Text className="font-psemibold text-xl text-secondary">Raj Prasad Booking</Text>
      <View
        className={`mt-4 flex flex-col rounded-2xl bg-white ${
          Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'
        }`}>
        <View className="flex flex-row items-center gap-x-4 p-4">
          <Image source={icons.food} className="h-10 w-10" resizeMode="contain" />
          <View className="w-full flex-1">
            <Text className="text-md font-pmedium">
              {`${formattedStartDate} ${formattedEndDate && '-'} ${
                formattedEndDate && formattedEndDate
              }`}
            </Text>
          </View>
        </View>

        <HorizontalSeparator otherStyles={'mb-4'} />

        <View className="flex flex-row gap-x-1 px-6 pb-4">
          <Image source={icons.person} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Booked For: </Text>
          <Text className="font-pmedium text-black">
            {mumukshuData.food.mumukshuGroup.reduce(
              (acc: any, group: any) => acc + group.mumukshus.length,
              0
            )}{' '}
            Mumukshus
          </Text>
        </View>
      </View>
    </View>
  );
};

export default MumukshuFoodBookingDetails;
