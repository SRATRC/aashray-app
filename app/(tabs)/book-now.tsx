import React, { useState } from 'react';
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

let CHIPS = [
  types.booking_type_adhyayan,
  types.booking_type_room,
  types.booking_type_food,
  types.booking_type_travel,
  // types.booking_type_event,
];

const BookingCategories = () => {
  const { user } = useGlobalContext();

  if (user.res_status == status.STATUS_RESIDENT) CHIPS.push(types.booking_type_flat);

  const [selectedChip, setSelectedChip] = useState(types.booking_type_adhyayan);
  const handleChipClick = (chip: any) => {
    setSelectedChip(chip);
  };

  return (
    <View className="my-6 w-full px-4">
      <Text className="font-psemibold text-2xl">{`${selectedChip} Booking`}</Text>

      <CustomChipGroup
        chips={CHIPS}
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

const BookNow = () => {
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

export default BookNow;
