import { View, Text, Image } from 'react-native';
import { icons } from '@/src/constants';
import { useBookingStore } from '@/src/stores';
import HorizontalSeparator from '../HorizontalSeparator';
import PrimaryAddonBookingCard from '../PrimaryAddonBookingCard';
import CustomTag from '../CustomTag';
import moment from 'moment';

const MumukshuTravelBookingDetail: React.FC<{ containerStyles: any }> = ({ containerStyles }) => {
  const mumukshuData = useBookingStore((store) => store.mumukshuData);

  return (
    <PrimaryAddonBookingCard containerStyles={containerStyles} title={'Raj Pravas Booking'}>
      <View className="flex flex-row items-center gap-x-4 p-4">
        <Image source={icons.travel} className="h-10 w-10" resizeMode="contain" />
        <View className="w-full flex-1 justify-center gap-y-1">
          {mumukshuData.validationData?.travelDetails && (
            <CustomTag
              text={mumukshuData.validationData.travelDetails.status}
              textStyles={'text-red-200'}
              containerStyles={'bg-red-100'}
            />
          )}
          <Text className="text-md font-pmedium">
            {moment(mumukshuData.travel.date).format('Do MMMM, YYYY')}
          </Text>
        </View>
      </View>

      <HorizontalSeparator otherStyles={'mb-4'} />

      <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
        <Image source={icons.person} className="h-4 w-4" resizeMode="contain" />
        <Text className="font-pregular text-gray-400">Booked For:</Text>
        <Text className="font-pmedium text-black">
          {mumukshuData?.travel?.mumukshuGroup?.reduce(
            (acc: any, group: any) => acc + group.mumukshus.length,
            0
          )}{' '}
          mumukshus
        </Text>
      </View>
    </PrimaryAddonBookingCard>
  );
};

export default MumukshuTravelBookingDetail;
