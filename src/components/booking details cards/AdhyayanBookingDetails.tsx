import { View, Text, Image, ScrollView } from 'react-native';
import { colors, icons } from '@/src/constants';
import { useBookingStore } from '@/src/stores';
import { FontAwesome5, MaterialIcons, FontAwesome6 } from '@expo/vector-icons';
import HorizontalSeparator from '../HorizontalSeparator';
import CustomTag from '../CustomTag';
import PrimaryAddonBookingCard from '../PrimaryAddonBookingCard';
import moment from 'moment';

const AdhyayanBookingDetails: React.FC<{ containerStyles: any }> = ({ containerStyles }) => {
  const data = useBookingStore((state) => state.mumukshuData);

  const formattedStartDate = moment(data.adhyayan?.adhyayan?.start_date).format('Do MMMM');
  const formattedEndDate = moment(data.adhyayan?.adhyayan?.end_date).format('Do MMMM, YYYY');

  return (
    <PrimaryAddonBookingCard title={'Raj Adhyayan Booking'} containerStyles={containerStyles}>
      <View className="item-center flex flex-row gap-x-4 p-4">
        <Image source={icons.adhyayan} className="h-10 w-10" resizeMode="contain" />
        <View className="w-full flex-1 justify-center gap-y-1">
          {data.validationData?.adhyayanDetails?.length > 0 && (
            <ScrollView horizontal>
              {data.validationData &&
                Object.keys(data.validationData).length > 0 &&
                data.validationData.adhyayanDetails[0]?.available !== 0 && (
                  <CustomTag
                    text={`available: ${data.validationData.adhyayanDetails[0].available}`}
                    textStyles={'text-green-200'}
                    containerStyles={'bg-green-100'}
                  />
                )}

              {data.validationData &&
                Object.keys(data.validationData).length > 0 &&
                data.validationData.adhyayanDetails[0]?.waiting !== 0 && (
                  <CustomTag
                    text={`waiting: ${data.validationData.adhyayanDetails[0].waiting}`}
                    textStyles={'text-red-200'}
                    containerStyles={'bg-red-100'}
                  />
                )}
            </ScrollView>
          )}

          <Text className="text-md font-pmedium">
            {`${formattedStartDate} - ${formattedEndDate}`}
          </Text>
        </View>
      </View>

      <HorizontalSeparator otherStyles={'mb-4'} />

      <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
        <FontAwesome6 name="book-bookmark" size={14} color={colors.gray_400} />
        <Text className="font-pregular text-gray-400">Name:</Text>
        <Text className="flex-1 font-pmedium text-black" numberOfLines={1} ellipsizeMode="tail">
          {data.adhyayan.adhyayan.name}
        </Text>
      </View>
      <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
        <FontAwesome5 name="chalkboard-teacher" size={14} color={colors.gray_400} />
        <Text className="font-pregular text-gray-400">Swadhyay Karta:</Text>
        <Text className="font-pmedium text-black">{data.adhyayan.adhyayan.speaker}</Text>
      </View>
      <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
        <MaterialIcons name="location-on" size={14} color={colors.gray_400} />
        <Text className="font-pregular text-gray-400">Location:</Text>
        <Text className="flex-1 font-pmedium text-black" numberOfLines={1} ellipsizeMode="tail">
          {data.adhyayan.adhyayan.location}
        </Text>
      </View>
    </PrimaryAddonBookingCard>
  );
};

export default AdhyayanBookingDetails;
