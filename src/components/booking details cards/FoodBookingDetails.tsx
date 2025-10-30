import { View, Text, Image, Platform } from 'react-native';
import { colors, icons } from '@/src/constants';
import { useBookingStore } from '@/src/stores';
import HorizontalSeparator from '../HorizontalSeparator';
import moment from 'moment';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const FoodBookingDetails: React.FC<{ containerStyles: any }> = ({ containerStyles }) => {
  const data = useBookingStore((state) => state.mumukshuData);

  const formattedStartDate = moment(data.food.startDay).format('Do MMMM');
  const formattedEndDate = moment(data.food.endDay).format('Do MMMM, YYYY');

  const meals = data.food.mumukshuGroup[0].meals.map((meal: any) => meal).join(', ');

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

        <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
          <Ionicons name="fast-food" size={14} color={colors.gray_400} />
          <Text className="font-pregular text-gray-400">Meals:</Text>
          <Text className="font-pmedium text-black">{meals}</Text>
        </View>
        <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
          <MaterialCommunityIcons name="chili-mild" size={14} color={colors.gray_400} />
          <Text className="font-pregular text-gray-400">Spice Level:</Text>
          <Text className="font-pmedium text-black">
            {data.food.spicy ? 'Regular' : 'Non Spicy'}
          </Text>
        </View>
        <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
          <MaterialCommunityIcons name="kettle-steam" size={14} color={colors.gray_400} />
          <Text className="font-pregular text-gray-400">High Tea:</Text>
          <Text className="font-pmedium text-black">{data.food.mumukshuGroup[0].hightea}</Text>
        </View>
      </View>
    </View>
  );
};

export default FoodBookingDetails;
