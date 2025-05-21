import React, { useState, useMemo } from 'react';
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-virtualized-view';
import { status, types } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import CustomChipGroup from '../../components/CustomChipGroup';
import RoomBooking from '../../components/booking/RoomBooking';
import FoodBooking from '../../components/booking/FoodBooking';
import TravelBooking from '../../components/booking/TravelBooking';
import AdhyayanBooking from '../../components/booking/AdhyayanBooking';
import EventsBooking from '../../components/booking/EventsBooking';
import FlatBooking from '../../components/booking/FlatBooking';

const BookingCategoriesInternal = () => {
  const { user } = useGlobalContext();

  const availableChips = useMemo(() => {
    const baseChips = [
      types.booking_type_adhyayan,
      types.booking_type_room,
      types.booking_type_food,
      types.booking_type_travel,
      types.booking_type_event,
    ];
    if (
      user.res_status === status.STATUS_RESIDENT &&
      !baseChips.includes(types.booking_type_flat)
    ) {
      return [...baseChips, types.booking_type_flat];
    }
    return baseChips;
  }, [user.res_status]);

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
    // Handle the case where there are no available chips, or a default cannot be determined.
    // This could be rendering an error message or a loading state.
    return (
      <View className="my-6 w-full items-center justify-center px-4">
        <Text className="font-psemibold text-lg">No booking categories available.</Text>
      </View>
    );
  }

  return (
    <View className="my-6 w-full px-4">
      <Text className="font-psemibold text-2xl">{`${selectedChip} Booking`}</Text>

      <CustomChipGroup
        chips={availableChips}
        selectedChip={selectedChip}
        handleChipPress={handleChipClick}
      />

      {selectedChip === types.booking_type_room && <RoomBooking />}
      {selectedChip === types.booking_type_flat && <FlatBooking />}
      {selectedChip === types.booking_type_food && <FoodBooking />}
      {selectedChip === types.booking_type_travel && <TravelBooking />}
      {selectedChip === types.booking_type_adhyayan && <AdhyayanBooking />}
      {selectedChip === types.booking_type_event && <EventsBooking />}
    </View>
  );
};

const BookingCategories = React.memo(BookingCategoriesInternal);

const BookNowInternal = () => {
  return (
    <SafeAreaView className="h-full bg-white" edges={['right', 'top', 'left']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView alwaysBounceVertical={false} showsVerticalScrollIndicator={false}>
          <BookingCategories />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const BookNow = React.memo(BookNowInternal);

export default BookNow;
