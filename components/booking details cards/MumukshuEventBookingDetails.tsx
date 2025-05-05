import { View, Text, Image, ScrollView } from 'react-native';
import { colors, icons, status } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons';
import PrimaryAddonBookingCard from '../PrimaryAddonBookingCard';
import HorizontalSeparator from '../HorizontalSeparator';
import CustomTag from '../CustomTag';
import moment from 'moment';

const MumukshuEventBookingDetails: React.FC<{ containerStyles: any }> = ({ containerStyles }) => {
  const { mumukshuData } = useGlobalContext();

  const formattedStartDate = moment(mumukshuData.utsav.utsav.start_date).format('Do MMMM');
  const formattedEndDate = moment(mumukshuData.utsav.utsav.end_date).format('Do MMMM, YYYY');

  return (
    <PrimaryAddonBookingCard title={'Raj Utsav Booking'} containerStyles={containerStyles}>
      <View className="item-center flex flex-row gap-x-4 p-4">
        <Image source={icons.events} className="h-10 w-10" resizeMode="contain" />
        <View className="w-full flex-1 justify-center gap-y-1">
          {/* {mumukshuData.validationData?.utsavDetails?.length > 0 && (
            <ScrollView horizontal>
              {mumukshuData.validationData &&
                Object.keys(mumukshuData.validationData).length > 0 &&
                mumukshuData.validationData.utsavDetails?.available !== 0 && (
                  <CustomTag
                    text={`available: ${mumukshuData.validationData.utsavDetails.available}`}
                    textStyles={'text-green-200'}
                    containerStyles={'bg-green-100'}
                  />
                )}

              {mumukshuData.validationData &&
                Object.keys(mumukshuData.validationData).length > 0 &&
                mumukshuData.validationData.utsavDetails?.waiting !== 0 && (
                  <CustomTag
                    text={`waiting: ${mumukshuData.validationData.utsavDetails.waiting}`}
                    textStyles={'text-red-200'}
                    containerStyles={'bg-red-100'}
                  />
                )}
            </ScrollView>
          )} */}
          <Text className="text-md font-pmedium">
            {`${formattedStartDate} - ${formattedEndDate}`}
          </Text>
        </View>
      </View>

      <HorizontalSeparator otherStyles={'mb-4'} />

      <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
        <FontAwesome5 name="clipboard-list" size={14} color={colors.gray_400} />
        <Text className="font-pregular text-gray-400">Name:</Text>
        <Text className="flex-1 font-pmedium text-black" numberOfLines={1} ellipsizeMode="tail">
          {mumukshuData.utsav.utsav.utsav_name}
        </Text>
      </View>
      <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
        <FontAwesome5 name="map-marker-alt" size={14} color={colors.gray_400} />
        <Text className="font-pregular text-gray-400">Location:</Text>
        <Text className="flex-1 font-pmedium text-black" numberOfLines={1} ellipsizeMode="tail">
          {mumukshuData.utsav.utsav.location || 'Research Centre'}
        </Text>
      </View>
      <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
        <FontAwesome name="user" size={14} color={colors.gray_400} />
        <Text className="font-pregular text-gray-400">Booked For:</Text>
        <Text className="font-pmedium text-black">
          {mumukshuData.utsav.mumukshuGroup?.length || mumukshuData.utsav.mumukshus?.length}{' '}
          Mumukshus
        </Text>
      </View>
    </PrimaryAddonBookingCard>
  );
};

export default MumukshuEventBookingDetails;
