import { View, Text, Image, Platform } from 'react-native';
import { icons } from '@/constants';
import HorizontalSeparator from '../HorizontalSeparator';
import moment from 'moment';

const FoodBookingDetails: React.FC<{ containerStyles: any; data: any }> = ({
  containerStyles,
  data,
}) => {
  const formattedStartDate = moment(data.food.startDay).format('Do MMMM');
  const formattedEndDate = moment(data.food.endDay).format('Do MMMM, YYYY');

  const meals = data.food.meals.map((meal: any) => meal).join(', ');

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
          <Image source={icons.meal} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Meals:</Text>
          <Text className="font-pmedium text-black">{meals}</Text>
        </View>
        <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
          <Image source={icons.spice} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Spice Level:</Text>
          <Text className="font-pmedium text-black">
            {data.food.spicy ? 'Regular' : 'Non Spicy'}
          </Text>
        </View>
        <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
          <Image source={icons.hightea} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">High Tea:</Text>
          <Text className="font-pmedium text-black">{data.food.hightea}</Text>
        </View>
      </View>
    </View>
  );
};

export default FoodBookingDetails;
