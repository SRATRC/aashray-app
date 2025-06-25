import { View, Text, Image } from 'react-native';
import { colors, icons, status } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import HorizontalSeparator from '../HorizontalSeparator';
import moment from 'moment';
import CustomTag from '../CustomTag';
import PrimaryAddonBookingCard from '../PrimaryAddonBookingCard';
import { Ionicons } from '@expo/vector-icons';

const TravelBookingDetails: React.FC<{ containerStyles?: any }> = ({ containerStyles }) => {
  const { data } = useGlobalContext();

  return (
    <PrimaryAddonBookingCard containerStyles={containerStyles} title={'Raj Pravas Booking'}>
      <View className="flex flex-row items-center gap-x-4 p-4">
        <Image source={icons.travel} className="h-10 w-10" resizeMode="contain" />
        <View className="w-full flex-1 justify-center gap-y-1">
          {data.validationData?.travelDetails?.status && (
            <CustomTag
              text={data.validationData?.travelDetails?.status}
              textStyles={
                data.validationData?.travelDetails?.status == status.STATUS_AVAILABLE
                  ? 'text-green-200'
                  : 'text-red-200'
              }
              containerStyles={
                data.validationData?.travelDetails?.status == status.STATUS_AVAILABLE
                  ? 'bg-green-100'
                  : 'bg-red-100'
              }
            />
          )}
          <Text className="text-md font-pmedium">
            {moment(data.travel.date).format('Do MMMM, YYYY')}
          </Text>
        </View>
      </View>

      <HorizontalSeparator otherStyles={'mb-4'} />

      <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
        <Image source={icons.car} className="h-4 w-4" resizeMode="contain" />
        <Text className="font-pregular text-gray-400">Booking Type:</Text>
        <Text className="font-pmedium text-black">{data.travel.type}</Text>
      </View>
      <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
        <Image source={icons.marker} className="h-4 w-4" resizeMode="contain" />
        <Text className="font-pregular text-gray-400">
          {data.travel.pickup == 'Research Centre' ? 'Drop Point' : 'Pickup Point'}
        </Text>
        <Text className="flex-1 font-pmedium text-black" numberOfLines={1}>
          {data.travel.pickup == 'Research Centre'
            ? `${data.travel.drop}`
            : `${data.travel.pickup}`}
        </Text>
      </View>
      <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
        <Image source={icons.luggage} className="h-4 w-4" resizeMode="contain" />
        <Text className="font-pregular text-gray-400">Luggage:</Text>
        <Text className="font-pmedium text-black">
          {data.travel.luggage.length > 0 ? data.travel.luggage.join(', ') : 'No luggage selected'}
        </Text>
      </View>
      <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
        <Image source={icons.request} className="h-4 w-4" resizeMode="contain" />
        <Text className="font-pregular text-gray-400">Special Request:</Text>
        <Text className="flex-1 font-pmedium text-black" numberOfLines={1}>
          {data.travel.special_request ? data.travel.special_request : 'None'}
        </Text>
      </View>
      {data.travel.arrival_time && (
        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <Ionicons name="time" size={16} color={colors.gray_400} />
          <Text className="font-pregular text-gray-400">Arrival Time:</Text>
          <Text className="font-pmedium text-black">
            {moment(data.travel.arrival_time).format('hh:mm A')}
          </Text>
        </View>
      )}
      {/* {data.travel.charge && (
        <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
          <Image source={icons.charge} className="h-4 w-4" resizeMode="contain" />
          <Text className="font-pregular text-gray-400">Charges:</Text>
          <Text className="font-pmedium text-black">₹ {data.travel.charge}</Text>
        </View>
      )} */}
    </PrimaryAddonBookingCard>
  );
};

export default TravelBookingDetails;
