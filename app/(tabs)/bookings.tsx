import React, { useState, useCallback, useRef, MutableRefObject } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-virtualized-view';
import { types } from '../../constants';
import { useQueryClient } from '@tanstack/react-query';
import CustomChipGroup from '../../components/CustomChipGroup';
import RoomBookingCancellation from '../../components/cancel booking/RoomBookingCancellation';
import FoodBookingCancellation from '../../components/cancel booking/FoodBookingCancellation';
import TravelBookingCancellation from '../../components/cancel booking/TravelBookingCancellation';
import AdhyayanBookingCancellation from '../../components/cancel booking/AdhyayanBookingCancellation';
import EventBookingCancellation from '../../components/cancel booking/EventBookingCancellation';

const CHIPS = [
  types.booking_type_adhyayan,
  types.booking_type_room,
  types.booking_type_food,
  types.booking_type_travel,
  // types.booking_type_event,
];

interface BookingCategoriesProps {
  onRefresh: MutableRefObject<() => void>;
}

const BookingCategories: React.FC<BookingCategoriesProps> = ({ onRefresh }) => {
  const queryClient = useQueryClient();
  const [selectedChip, setSelectedChip] = useState<string>(types.booking_type_adhyayan);

  const handleChipClick = (chip: string) => {
    setSelectedChip(chip);
    invalidateSelectedData(chip);
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

  const handleRefresh = () => {
    invalidateSelectedData(selectedChip);
  };

  // Passing the handleRefresh function to parent
  onRefresh.current = handleRefresh;

  return (
    <View className="w-full">
      <View className="w-full px-4">
        <Text className="mt-6 font-psemibold text-2xl">{`${selectedChip} Booking`}</Text>

        <CustomChipGroup
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
  const refreshControlRef = useRef<() => void>(() => {});

  return (
    <SafeAreaView className="h-full bg-white" edges={['right', 'top', 'left']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          className="h-full"
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => refreshControlRef.current && refreshControlRef.current()}
            />
          }>
          <BookingCategories onRefresh={refreshControlRef} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Bookings;
