import { View, Text, Image, ScrollView } from 'react-native';
import { icons } from '@/src/constants';
import { useBookingStore } from '@/src/stores';
import HorizontalSeparator from '../HorizontalSeparator';
import CustomTag from '../CustomTag';
import PrimaryAddonBookingCard from '../PrimaryAddonBookingCard';
import moment from 'moment';

const GuestAdhyayanBookingDetails: React.FC<{ containerStyles: any }> = ({ containerStyles }) => {
  const guestData = useBookingStore((store) => store.guestData);

  const formattedStartDate = moment(guestData.adhyayan?.adhyayan?.start_date).format('Do MMMM');
  const formattedEndDate = moment(guestData.adhyayan?.adhyayan?.end_date).format('Do MMMM, YYYY');

  return (
    <PrimaryAddonBookingCard title={'Raj Adhyayan Booking'} containerStyles={containerStyles}>
      <View className="item-center flex flex-row gap-x-4 p-4">
        <Image source={icons.adhyayan} className="h-10 w-10" resizeMode="contain" />
        <View className="w-full flex-1 justify-center gap-y-1">
          {guestData.validationData?.adhyayanDetails?.length > 0 && (
            <ScrollView horizontal>
              {guestData.validationData &&
                Object.keys(guestData.validationData).length > 0 &&
                guestData.validationData.adhyayanDetails[0]?.available !== 0 && (
                  <CustomTag
                    text={`available: ${guestData.validationData.adhyayanDetails[0].available}`}
                    textStyles={'text-green-200'}
                    containerStyles={'bg-green-100'}
                  />
                )}

              {guestData.validationData &&
                Object.keys(guestData.validationData).length > 0 &&
                guestData.validationData.adhyayanDetails[0]?.waiting !== 0 && (
                  <CustomTag
                    text={`waiting: ${guestData.validationData.adhyayanDetails[0].waiting}`}
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
        <Image source={icons.description} className="h-4 w-4" resizeMode="contain" />
        <Text className="font-pregular text-gray-400">Name:</Text>
        <View className="flex-1">
          <Text className="font-pmedium text-black" numberOfLines={1} ellipsizeMode="tail">
            {guestData.adhyayan.adhyayan.name}
          </Text>
        </View>
      </View>
      <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
        <Image source={icons.person} className="h-4 w-4" resizeMode="contain" />
        <Text className="font-pregular text-gray-400">Swadhyay Karta:</Text>
        <View className="flex-1">
          <Text className="font-pmedium text-black" numberOfLines={1} ellipsizeMode="tail">
            {guestData.adhyayan.adhyayan.speaker}
          </Text>
        </View>
      </View>
      <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
        <Image source={icons.marker} className="h-4 w-4" resizeMode="contain" />
        <Text className="font-pregular text-gray-400">Location:</Text>
        <View className="flex-1">
          <Text className="font-pmedium text-black" numberOfLines={1} ellipsizeMode="tail">
            {guestData.adhyayan.adhyayan.location}
          </Text>
        </View>
      </View>
      <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
        <Image source={icons.charge} className="h-4 w-4" resizeMode="contain" />
        <Text className="font-pregular text-gray-400">Charges:</Text>
        <View className="flex-1">
          <Text className="font-pmedium text-black" numberOfLines={1} ellipsizeMode="tail">
            ₹ {guestData.adhyayan.adhyayan.amount}/person
          </Text>
        </View>
      </View>
      <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
        <Image source={icons.person} className="h-4 w-4" resizeMode="contain" />
        <Text className="font-pregular text-gray-400">Booked For:</Text>
        <View className="flex-1">
          <Text className="font-pmedium text-black" numberOfLines={1} ellipsizeMode="tail">
            {guestData.adhyayan.guestGroup?.length || guestData.adhyayan.guests?.length} Guests
          </Text>
        </View>
      </View>
    </PrimaryAddonBookingCard>
  );
};

export default GuestAdhyayanBookingDetails;
