import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BookingTypeTabs from '@/src/components/booking/shared/BookingTypeTabs';
import AdhyayanBookingCancellation from '@/src/components/cancel booking/AdhyayanBookingCancellation';
import EventBookingCancellation from '@/src/components/cancel booking/EventBookingCancellation';
import FoodBookingCancellation from '@/src/components/cancel booking/FoodBookingCancellation';
import RoomBookingCancellation from '@/src/components/cancel booking/RoomBookingCancellation';
import TravelBookingCancellation from '@/src/components/cancel booking/TravelBookingCancellation';
import { types } from '@/src/constants';

const typeFromParam = (param: string | string[] | undefined) => {
  if (typeof param !== 'string') return null;
  switch (param.toLowerCase()) {
    case 'room':
      return types.booking_type_room;
    case 'food':
      return types.booking_type_food;
    case 'adhyayan':
    case 'shibir':
      return types.booking_type_adhyayan;
    case 'travel':
      return types.booking_type_travel;
    case 'event':
    case 'utsav':
      return types.booking_type_event;
    default:
      return null;
  }
};

const BookingCategories = () => {
  const queryClient = useQueryClient();
  // `ts` changes on every deep link, so tapping the same card twice still reapplies
  // the tab after the member has switched chips by hand.
  const { type, ts } = useLocalSearchParams();

  const CHIPS = useMemo(
    () => [
      types.booking_type_adhyayan,
      types.booking_type_room,
      types.booking_type_food,
      types.booking_type_travel,
      types.booking_type_event,
    ],
    []
  );

  const [selectedChip, setSelectedChip] = useState<string>(
    typeFromParam(type) ?? types.booking_type_adhyayan
  );

  useEffect(() => {
    const next = typeFromParam(type);
    if (next) setSelectedChip(next);
  }, [type, ts]);

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
            await queryClient.invalidateQueries({ queryKey: ['utsavBooking'] });
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
      <BookingTypeTabs types={CHIPS} selected={selectedChip} onSelect={handleChipClick} />

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
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="flex-1">
        <BookingCategories />
      </View>
    </SafeAreaView>
  );
};

export default Bookings;
