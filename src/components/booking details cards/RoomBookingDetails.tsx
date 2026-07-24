import { View, Text, Image, ScrollView } from 'react-native';
import { useMemo } from 'react';
import { colors, icons, status } from '@/src/constants';
import { useBookingStore } from '@/src/stores';
import HorizontalSeparator from '../HorizontalSeparator';
import CustomTag from '../CustomTag';
import PrimaryAddonBookingCard from '../PrimaryAddonBookingCard';
import moment from 'moment';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';

const RoomBookingDetails: React.FC<{ containerStyles: any }> = ({ containerStyles }) => {
  const data = useBookingStore((state) => state.mumukshuData);

  const groupedBookings = useMemo(() => {
    const roomDetails = data?.validationData?.roomDetails || [];
    const groups: { [key: string]: any } = {};

    roomDetails.forEach((booking: any) => {
      const range = booking.range || {
        start: booking.checkin || booking.start || (booking.dates ? booking.dates.split(' to ')[0] : data?.room?.startDay),
        end: booking.checkout || booking.end || (booking.dates ? booking.dates.split(' to ')[1] : data?.room?.endDay),
      };

      const key = `${range.start}-${range.end}`;
      if (!groups[key]) {
        groups[key] = {
          range,
          bookings: [],
          statuses: {},
        };
      }
      groups[key].bookings.push(booking);
      groups[key].statuses[booking.status] = (groups[key].statuses[booking.status] || 0) + 1;
    });

    return Object.values(groups);
  }, [data]);

  // Fallback: if no validationData yet, show the original single card
  const hasSplitData = groupedBookings.length > 0;
  const isSplitBooking = groupedBookings.length > 1;

  const roomType = data?.room?.mumukshuGroup?.[0]?.roomType;
  const floorType = data?.room?.mumukshuGroup?.[0]?.floorType;

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

        {roomType && (
          <View className="flex flex-row items-center gap-x-2 px-6 pb-2">
            <MaterialCommunityIcons name="air-conditioner" size={14} color={colors.gray_400} />
            <Text className="font-pregular text-gray-400">Room Type: </Text>
            <Text className="font-pmedium text-black">
              {roomType === 'ac' ? 'AC ROOM' : 'Non AC ROOM'}
            </Text>
          </View>
        )}
        {floorType && (
          <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
            <MaterialIcons name="elderly" size={14} color={colors.gray_400} />
            <Text className="font-pregular text-gray-400">Ground Floor Booking:</Text>
            <Text className="font-pmedium text-black">
              {floorType === 'SC' ? 'Ground Floor' : 'Any Floor'}
            </Text>
          </View>
        )}
        {group.bookings.length > 0 && group.bookings[0]?.mumukshu && (
          <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
            <Ionicons name="people" size={16} color={colors.gray_400} />
            <Text className="font-pregular text-gray-400">Booked For:</Text>
            <Text className="font-pmedium text-black">{group.bookings.length} mumukshus</Text>
          </View>
        )}
      </>
    );
  };

  if (hasSplitData) {
    return (
      <View className={containerStyles}>
        {isSplitBooking && (
          <View className="mx-4 mb-2 rounded-lg bg-blue-50 p-3 border border-blue-200">
            <Text className="font-pmedium text-xs text-blue-800">
              ℹ️ Booking split into {groupedBookings.length} segments due to Utsav event dates.
            </Text>
          </View>
        )}
        <PrimaryAddonBookingCard
          containerStyles=""
          title="Raj Sharan Booking"
          items={groupedBookings}
          renderItem={renderBookingItem}
        />
      </View>
    );
  }

  // Fallback if no validationData (e.g. old bookings or data not loaded)
  const formattedStartDate = moment(data?.room?.startDay).format('Do MMMM');
  const formattedEndDate = data?.room?.endDay
    ? moment(data?.room?.endDay).format('Do MMMM, YYYY')
    : null;

  return (
    <PrimaryAddonBookingCard containerStyles={containerStyles} title="Raj Sharan Booking">
      <View className="flex flex-row items-center gap-x-4 p-4">
        <Image source={icons.room} className="h-10 w-10" resizeMode="contain" />
        <View className="w-full flex-1 justify-center gap-y-1">
          <Text className="text-md font-pmedium">
            {`${formattedStartDate} - ${formattedEndDate}`}
          </Text>
        </View>
      </View>

      <HorizontalSeparator otherStyles={'mb-4'} />

      {roomType && (
        <View className="flex flex-row items-center gap-x-2 px-6 pb-2">
          <MaterialCommunityIcons name="air-conditioner" size={14} color={colors.gray_400} />
          <Text className="font-pregular text-gray-400">Room Type: </Text>
          <Text className="font-pmedium text-black">
            {roomType === 'ac' ? 'AC ROOM' : 'Non AC ROOM'}
          </Text>
        </View>
      )}
      {floorType && (
        <View className="flex flex-row items-center gap-x-2 px-6 pb-4">
          <MaterialIcons name="elderly" size={14} color={colors.gray_400} />
          <Text className="font-pregular text-gray-400">Ground Floor Booking:</Text>
          <Text className="font-pmedium text-black">
            {floorType === 'SC' ? 'Ground Floor' : 'Any Floor'}
          </Text>
        </View>
      )}
    </PrimaryAddonBookingCard>
  );
};

export default RoomBookingDetails;
