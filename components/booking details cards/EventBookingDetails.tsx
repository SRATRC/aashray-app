import { View, Text, Image } from 'react-native';
import { colors, icons, status } from '@/constants';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import PrimaryAddonBookingCard from '../PrimaryAddonBookingCard';
import HorizontalSeparator from '../HorizontalSeparator';
import CustomTag from '../CustomTag';
import moment from 'moment';

const EventBookingDetails: React.FC<{ containerStyles: any; data: any }> = ({
  containerStyles,
  data,
}) => {
  const startDate = moment(data.utsav.utsav.utsav_start);
  const endDate = moment(data.utsav.utsav.utsav_end);

  const sameDay = startDate.isSame(endDate, 'day');
  const formattedDate = sameDay
    ? startDate.format('Do MMMM, YYYY')
    : `${startDate.format('Do MMMM')} - ${endDate.format('Do MMMM, YYYY')}`;

  return (
    <PrimaryAddonBookingCard title={'Raj Utsav Booking'} containerStyles={containerStyles}>
      <View className="item-center flex flex-row gap-x-4 p-4">
        <Image source={icons.events} className="h-10 w-10" resizeMode="contain" />
        <View className="w-full flex-1 justify-center gap-y-1">
          {data.validationData?.utsavDetails && (
            <CustomTag
              text={data.validationData?.utsavDetails[0].status}
              textStyles={
                data.validationData?.utsavDetails[0].status == status.STATUS_AVAILABLE
                  ? 'text-green-200'
                  : 'text-red-200'
              }
              containerStyles={
                data.validationData?.utsavDetails[0].status == status.STATUS_AVAILABLE
                  ? 'bg-green-100'
                  : 'bg-red-100'
              }
            />
          )}
          <Text className="text-md font-pmedium">{formattedDate}</Text>
        </View>
      </View>

      <HorizontalSeparator otherStyles={'mb-4'} />

      <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
        <FontAwesome5 name="clipboard-list" size={14} color={colors.gray_400} />
        <Text className="font-pregular text-gray-400">Name:</Text>
        <Text className="flex-1 font-pmedium text-black" numberOfLines={1} ellipsizeMode="tail">
          {data.utsav.utsav.utsav_name}
        </Text>
      </View>
      <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
        <FontAwesome5 name="ticket-alt" size={14} color={colors.gray_400} />
        <Text className="font-pregular text-gray-400">Package:</Text>
        <Text className="flex-1 font-pmedium text-black" numberOfLines={1} ellipsizeMode="tail">
          {data.utsav.package_name}
        </Text>
      </View>
      <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
        <FontAwesome5 name="map-marker-alt" size={14} color={colors.gray_400} />
        <Text className="font-pregular text-gray-400">Location:</Text>
        <Text className="flex-1 font-pmedium text-black" numberOfLines={1} ellipsizeMode="tail">
          {data.utsav.utsav.utsav_location || 'Not Available'}
        </Text>
      </View>
      <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
        <MaterialIcons name="volunteer-activism" size={14} color={colors.gray_400} />
        <Text className="font-pregular text-gray-400">Volunteer:</Text>
        <Text className="flex-1 font-pmedium text-black" numberOfLines={1} ellipsizeMode="tail">
          {data.utsav.volunteer || 'Unable to Volunteer'}
        </Text>
      </View>
    </PrimaryAddonBookingCard>
  );
};

export default EventBookingDetails;
