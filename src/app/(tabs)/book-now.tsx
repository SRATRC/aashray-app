import React, { useState, useMemo } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { types } from '@/src/constants';
import { useAuthStore } from '@/src/stores';
import RoomBooking from '@/src/components/booking/RoomBooking';
import FoodBooking from '@/src/components/booking/FoodBooking';
import TravelBooking from '@/src/components/booking/TravelBooking';
import AdhyayanBooking from '@/src/components/booking/AdhyayanBooking';
import EventsBooking from '@/src/components/booking/EventsBooking';
import FlatBooking from '@/src/components/booking/FlatBooking';
import CustomChipGroup from '@/src/components/CustomChipGroup';

const BookingCategories = () => {
  const { user } = useAuthStore();

  const availableChips = useMemo(() => {
    const baseChips = [
      types.booking_type_adhyayan,
      types.booking_type_room,
      types.booking_type_food,
      types.booking_type_travel,
      types.booking_type_event,
    ];
    if (user?.isFlatOwner && !baseChips.includes(types.booking_type_flat)) {
      return [...baseChips, types.booking_type_flat];
    }
    return baseChips;
  }, [user?.isFlatOwner]);

  const [selectedChip, setSelectedChip] = useState(() => {
    if (availableChips.includes(types.booking_type_adhyayan)) {
      return types.booking_type_adhyayan;
    }
    return availableChips.length > 0 ? availableChips[0] : undefined;
  });

  const handleChipClick = (chip: any) => {
    setSelectedChip(chip);
  };

  if (selectedChip === undefined) {
    return (
      <View className="my-6 w-full items-center justify-center px-4">
        <Text className="font-psemibold text-lg">No booking categories available.</Text>
      </View>
    );
  }

  return (
    <View className="w-full flex-1">
      <View className="w-full px-4">
        <Text className="mt-6 font-psemibold text-2xl">{`${selectedChip} Booking`}</Text>

        <CustomChipGroup
          chips={availableChips}
          selectedChip={selectedChip}
          handleChipPress={handleChipClick}
        />
      </View>

      <View className="flex-1">
        {selectedChip === types.booking_type_room && <RoomBooking />}
        {selectedChip === types.booking_type_flat && <FlatBooking />}
        {selectedChip === types.booking_type_food && <FoodBooking />}
        {selectedChip === types.booking_type_travel && <TravelBooking />}
        {selectedChip === types.booking_type_adhyayan && <AdhyayanBooking />}
        {selectedChip === types.booking_type_event && <EventsBooking />}
      </View>
    </View>
  );
};

const BookNow: React.FC = () => {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-1">
        <BookingCategories />
      </View>
    </SafeAreaView>
  );
};

export default BookNow;
