import React, { useState, useMemo } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome6, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { types } from '@/constants';
import { useAuthStore } from '@/stores';
import AnimatedChipGroup from '@/components/AnimatedChipGroup';
import RoomBooking from '@/components/booking/RoomBooking';
import FoodBooking from '@/components/booking/FoodBooking';
import TravelBooking from '@/components/booking/TravelBooking';
import AdhyayanBooking from '@/components/booking/AdhyayanBooking';
import EventsBooking from '@/components/booking/EventsBooking';
import FlatBooking from '@/components/booking/FlatBooking';

const BookingCategories = () => {
  const { user } = useAuthStore();

  const availableChips = useMemo(() => {
    const iconProps = { size: 20 };

    const baseBookingTypes = [
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
        icon: <MaterialIcons name="festival" {...iconProps} />,
      },
    ];

    if (
      user?.isFlatOwner &&
      !baseBookingTypes.some((chip) => chip.title === types.booking_type_flat)
    ) {
      baseBookingTypes.push({
        title: types.booking_type_flat,
        icon: <MaterialIcons name="apartment" {...iconProps} />,
      });
    }

    return baseBookingTypes;
  }, [user?.isFlatOwner]);

  const [selectedChip, setSelectedChip] = useState(() => {
    const adhyayanChip = availableChips.find((chip) => chip.title === types.booking_type_adhyayan);
    if (adhyayanChip) {
      return adhyayanChip.title;
    }
    return availableChips.length > 0 ? availableChips[0].title : undefined;
  });

  const handleChipClick = (chipTitle: string) => {
    setSelectedChip(chipTitle);
  };

  if (selectedChip === undefined) {
    // Handle the case where there are no available chips, or a default cannot be determined.
    // This could be rendering an error message or a loading state.
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

        <AnimatedChipGroup
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
