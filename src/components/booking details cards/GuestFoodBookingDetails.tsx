import { View, Text, Image, Platform } from 'react-native';
import { icons } from '@/src/constants';
import { useBookingStore } from '@/src/stores';
import HorizontalSeparator from '../HorizontalSeparator';
import moment from 'moment';

const GuestFoodBookingDetails: React.FC<{ containerStyles: any }> = ({ containerStyles }) => {
  const guestData = useBookingStore((store) => store.guestData);

  const formattedStartDate = moment(guestData.food.startDay).format('Do MMMM');
  const formattedEndDate = moment(guestData.food.endDay).format('Do MMMM, YYYY');

  // const mealEntries = guestData.food.guestGroup.map((group, index) => {
  //   const mealNames = group.meals.join(', ');
  //   const guestNames = group.guests.map((guest) => guest.name).join(', ');
  //   return (
  //     <Text key={index} className="text-black font-pmedium text-xs">
  //       {`${mealNames} for ${guestNames}`}
  //     </Text>
  //   );
  // });

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

        <View className="flex flex-row items-center gap-x-1 px-6 pb-4">
          <Image source={icons.person} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Booked For:</Text>
          <Text className="font-pmedium text-black">
            {guestData.food.guestGroup.reduce(
              (acc: any, group: any) => acc + group.guests.length,
              0
            )}{' '}
            Guests
          </Text>
        </View>
        {/* <View className="flex px-6 pb-4 flex-row gap-x-2">
          <Image source={icons.meal} className="w-4 h-4" resizeMode="contain" />
          <Text className="text-gray-400 font-pregular">Meals: </Text>
          <View>{mealEntries}</View>
        </View> */}
      </View>
    </View>
  );
};

export default GuestFoodBookingDetails;
