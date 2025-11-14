import { View, Text, Image, ScrollView } from 'react-native';
import { colors, icons, status } from '@/src/constants';
import { useBookingStore } from '@/src/stores';
import { countStatusesForField } from '@/src/utils/BookingValidationStatusCounter';
import { Ionicons } from '@expo/vector-icons';
import HorizontalSeparator from '../HorizontalSeparator';
import PrimaryAddonBookingCard from '../PrimaryAddonBookingCard';
import CustomTag from '../CustomTag';
import moment from 'moment';

const GuestRoomBookingDetails: React.FC<{ containerStyles: any }> = ({ containerStyles }) => {
  const guestData = useBookingStore((store) => store.guestData);
  const validationData = guestData?.validationData
    ? countStatusesForField(guestData?.validationData, 'roomDetails')
    : {};

  const renderBookingItem = (booking: any, index: number) => {
    const formattedStartDate = moment(booking.range.start).format('Do MMMM');
    const formattedEndDate = moment(booking.range.end).format('Do MMMM, YYYY');

    return (
      <>
        <View className="flex flex-row items-center gap-x-4 p-4">
          <Image source={icons.room} className="h-10 w-10" resizeMode="contain" />
          <View className="w-full flex-1 justify-center gap-y-1">
            {validationData && Object.keys(validationData).length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {Object.entries(validationData).map(([key, value]) => (
                  <CustomTag
                    key={key}
                    text={`${key}: ${value}`}
                    textStyles={key == status.STATUS_AVAILABLE ? 'text-green-200' : 'text-red-200'}
                    containerStyles={`${
                      key == status.STATUS_AVAILABLE ? 'bg-green-100' : 'bg-red-100'
                    } mx-1`}
                  />
                ))}
              </ScrollView>
            )}
            <Text className="text-md font-pmedium">
              {`${formattedStartDate} - ${formattedEndDate}`}
            </Text>
          </View>
        </View>

        <HorizontalSeparator otherStyles={'mb-4'} />

        <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
          <Ionicons name="people" size={16} color={colors.gray_400} />
          <Text className="font-pregular text-gray-400">Booked For:</Text>
          <Text className="font-pmedium text-black">
            {guestData?.room?.guestGroup?.reduce(
              (acc: any, group: any) => acc + group.guests.length,
              0
            )}{' '}
            guests
          </Text>
        </View>
        {/* {booking.charge && (
          <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
            <FontAwesome5 name="rupee-sign" size={14} color={colors.gray_400} />
            <Text className="font-pregular text-gray-400">Charges:</Text>
            <Text className="font-pmedium text-black">₹ {booking.charge}</Text>
          </View>
        )} */}
      </>
    );
  };

  return (
    <PrimaryAddonBookingCard
      containerStyles={containerStyles}
      title="Raj Sharan Booking"
      items={guestData?.validationData?.roomDetails}
      renderItem={renderBookingItem}
    />
  );
};

export default GuestRoomBookingDetails;
