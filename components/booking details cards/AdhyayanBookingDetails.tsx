import { View, Text, Image } from 'react-native';
import { icons, status } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import HorizontalSeparator from '../HorizontalSeparator';
import CustomTag from '../CustomTag';
import moment from 'moment';
import PrimaryAddonBookingCard from '../PrimaryAddonBookingCard';

const AdhyayanBookingDetails: React.FC<{ containerStyles: any }> = ({ containerStyles }) => {
  const { data } = useGlobalContext();

  const formattedStartDate = moment(data.adhyayan[0].start_date).format('Do MMMM');
  const formattedEndDate = moment(data.adhyayan[0].end_date).format('Do MMMM, YYYY');

  return (
    <PrimaryAddonBookingCard title={'Raj Adhyayan Booking'} containerStyles={containerStyles}>
      <View className="item-center flex flex-row gap-x-4 p-4">
        <Image source={icons.adhyayan} className="h-10 w-10" resizeMode="contain" />
        <View className="w-full flex-1 justify-center gap-y-1">
          {data.validationData?.adhyayanDetails[0] && (
            <CustomTag
              text={data.validationData?.adhyayanDetails[0]?.status}
              textStyles={
                data.validationData?.adhyayanDetails[0]?.status == status.STATUS_AVAILABLE
                  ? 'text-green-200'
                  : 'text-red-200'
              }
              containerStyles={
                data.validationData?.adhyayanDetails[0]?.status == status.STATUS_AVAILABLE
                  ? 'bg-green-100'
                  : 'bg-red-100'
              }
            />
          )}
          <Text className="text-md font-pmedium">
            {`${formattedStartDate} - ${formattedEndDate}`}
          </Text>
        </View>
      </View>

      <HorizontalSeparator otherStyles={'mb-4'} />

      <View className="flex flex-row gap-x-2 px-6 pb-4">
        <Image source={icons.description} className="h-4 w-4" resizeMode="contain" />
        <Text className="font-pregular text-gray-400">Name:</Text>
        <Text className="font-pmedium text-black">{data.adhyayan[0].name}</Text>
      </View>
      <View className="flex flex-row gap-x-2 px-6 pb-4">
        <Image source={icons.person} className="h-4 w-4" resizeMode="contain" />
        <Text className="font-pregular text-gray-400">Swadhyay Karta:</Text>
        <Text className="font-pmedium text-black">{data.adhyayan[0].speaker}</Text>
      </View>
    </PrimaryAddonBookingCard>
  );
};

export default AdhyayanBookingDetails;
