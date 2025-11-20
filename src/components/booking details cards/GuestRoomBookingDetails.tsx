import { View, Text, Image, ScrollView } from 'react-native';
import { useMemo } from 'react';
import { colors, icons, status } from '@/src/constants';
import { useBookingStore } from '@/src/stores';
import { Ionicons } from '@expo/vector-icons';
import HorizontalSeparator from '../HorizontalSeparator';
import PrimaryAddonBookingCard from '../PrimaryAddonBookingCard';
import CustomTag from '../CustomTag';
import moment from 'moment';

const GuestRoomBookingDetails: React.FC<{ containerStyles: any }> = ({ containerStyles }) => {
  const guestData = useBookingStore((store) => store.guestData);

  const groupedBookings = useMemo(() => {
    const roomDetails = guestData?.validationData?.roomDetails || [];
    const groups: { [key: string]: any } = {};

    roomDetails.forEach((booking: any) => {
      const key = `${booking.range.start}-${booking.range.end}`;
      if (!groups[key]) {
        groups[key] = {
          range: booking.range,
          bookings: [],
          statuses: {},
        };
      }
      groups[key].bookings.push(booking);
      groups[key].statuses[booking.status] = (groups[key].statuses[booking.status] || 0) + 1;
    });

    return Object.values(groups);
  }, [guestData]);

  const renderBookingItem = (group: any, index: number) => {
    const formattedStartDate = moment(group.range.start).format('Do MMMM');
    const formattedEndDate = moment(group.range.end).format('Do MMMM, YYYY');

    return (
      <>
        <View className="flex flex-row items-center gap-x-4 p-4">
          <Image source={icons.room} className="h-10 w-10" resizeMode="contain" />
          <View className="w-full flex-1 justify-center gap-y-1">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Object.entries(group.statuses).map(([statusKey, count]: [string, any]) => (
                <CustomTag
                  key={statusKey}
                  text={`${statusKey}${count > 1 ? `: ${count}` : ''}`}
                  textStyles={
                    statusKey == status.STATUS_AVAILABLE ? 'text-green-200' : 'text-red-200'
                  }
                  containerStyles={`${
                    statusKey == status.STATUS_AVAILABLE ? 'bg-green-100' : 'bg-red-100'
                  } mx-1`}
                />
              ))}
            </ScrollView>
            <Text className="text-md font-pmedium">
              {`${formattedStartDate} - ${formattedEndDate}`}
            </Text>
          </View>
        </View>

        <HorizontalSeparator otherStyles={'mb-4'} />

        <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
          <Ionicons name="people" size={16} color={colors.gray_400} />
          <Text className="font-pregular text-gray-400">Booked For:</Text>
          <Text className="font-pmedium text-black">{group.bookings.length} guests</Text>
        </View>
      </>
    );
  };

  return (
    <PrimaryAddonBookingCard
      containerStyles={containerStyles}
      title="Raj Sharan Booking"
      items={groupedBookings}
      renderItem={renderBookingItem}
    />
  );
};

export default GuestRoomBookingDetails;
