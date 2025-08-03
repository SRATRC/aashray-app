import React, { useState, useCallback, useMemo } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5, Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { types } from '@/constants';
import { useQueryClient } from '@tanstack/react-query';
import AnimatedChipGroup from '@/components/AnimatedChipGroup';
import RoomBookingCancellation from '@/components/cancel booking/RoomBookingCancellation';
import FoodBookingCancellation from '@/components/cancel booking/FoodBookingCancellation';
import TravelBookingCancellation from '@/components/cancel booking/TravelBookingCancellation';
import AdhyayanBookingCancellation from '@/components/cancel booking/AdhyayanBookingCancellation';
import EventBookingCancellation from '@/components/cancel booking/EventBookingCancellation';

const BookingCategories = () => {
  const queryClient = useQueryClient();
  const [selectedChip, setSelectedChip] = useState<string>(types.booking_type_adhyayan);

  const CHIPS = useMemo(() => {
    const iconProps = { size: 20 };

    return [
      {
        title: types.booking_type_adhyayan,
        icon: <FontAwesome5 name="book-reader" {...iconProps} />,
      },
      {
        title: types.booking_type_room,
        icon: <MaterialIcons name="hotel" {...iconProps} />,
      },
      {
        title: types.booking_type_food,
        icon: <Ionicons name="fast-food" {...iconProps} />,
      },
      {
        title: types.booking_type_travel,
        icon: <FontAwesome6 name="car-side" {...iconProps} />,
      },
      {
        title: types.booking_type_event,
        icon: <MaterialIcons name="celebration" {...iconProps} />,
      },
    ];
  }, []);

  const handleChipClick = (chipTitle: string) => {
    setSelectedChip(chipTitle);
    invalidateSelectedData(chipTitle);
  };

  const invalidateSelectedData = useCallback(
    async (chip: string) => {
      try {
        switch (chip) {
          case types.booking_type_room:
            await queryClient.invalidateQueries({ queryKey: ['roomBooking'] });
            break;
          case types.booking_type_food:
            await queryClient.invalidateQueries({ queryKey: ['foodBooking'] });
            break;
          case types.booking_type_travel:
            await queryClient.invalidateQueries({ queryKey: ['travelBooking'] });
            break;
          case types.booking_type_adhyayan:
            await queryClient.invalidateQueries({ queryKey: ['adhyayanBooking'] });
            break;
          case types.booking_type_event:
            await queryClient.invalidateQueries({ queryKey: ['eventBooking'] });
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('Error invalidating queries:', error);
      }
    },
    [queryClient]
  );

  return (
    <View className="w-full flex-1">
      <View className="w-full px-4">
        <Text className="mt-6 font-psemibold text-2xl">{`${selectedChip} Booking`}</Text>

        <AnimatedChipGroup
          chips={CHIPS}
          selectedChip={selectedChip}
          handleChipPress={handleChipClick}
        />
      </View>

      {selectedChip === types.booking_type_room && <RoomBookingCancellation />}
      {selectedChip === types.booking_type_food && <FoodBookingCancellation />}
      {selectedChip === types.booking_type_travel && <TravelBookingCancellation />}
      {selectedChip === types.booking_type_adhyayan && <AdhyayanBookingCancellation />}
      {selectedChip === types.booking_type_event && <EventBookingCancellation />}
    </View>
  );
};

const Bookings: React.FC = () => {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-1">
        <BookingCategories />
      </View>
    </SafeAreaView>
  );
};

export default Bookings;
