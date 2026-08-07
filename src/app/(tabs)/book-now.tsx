import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AdhyayanBooking from '@/src/components/booking/AdhyayanBooking';
import BookingTypeTabs from '@/src/components/booking/shared/BookingTypeTabs';
import EventsBooking from '@/src/components/booking/EventsBooking';
import FlatBooking from '@/src/components/booking/FlatBooking';
import FoodBooking from '@/src/components/booking/FoodBooking';
import RoomBooking from '@/src/components/booking/RoomBooking';
import TravelBooking from '@/src/components/booking/TravelBooking';
import { colors, types } from '@/src/constants';
import { useAuthStore } from '@/src/stores';

/**
 * Picks which booking to start. Each booking type owns its own screen from here
 * on, inside the shared BookingShell, so this host renders no header, no scroll
 * container and no action button — that used to be duplicated per type.
 */

/** Short keys so a deep link or a notification can open one booking type. */
const TYPE_BY_KEY: Record<string, string> = {
  adhyayan: types.booking_type_adhyayan,
  room: types.booking_type_room,
  food: types.booking_type_food,
  travel: types.booking_type_travel,
  utsav: types.booking_type_event,
  flat: types.booking_type_flat,
};

const BookNow: React.FC = () => {
  const user = useAuthStore((s: any) => s.user);
  const { type } = useLocalSearchParams<{ type?: string }>();

  const tabs = useMemo(() => {
    const base = [
      types.booking_type_adhyayan,
      types.booking_type_room,
      types.booking_type_food,
      types.booking_type_travel,
      types.booking_type_event,
    ];
    return user?.isFlatOwner ? [...base, types.booking_type_flat] : base;
  }, [user?.isFlatOwner]);

  const [active, setActive] = useState<string>(
    () => TYPE_BY_KEY[String(type ?? '')] ?? types.booking_type_adhyayan
  );

  // A later deep link should move the picker even if the tab is already mounted.
  useEffect(() => {
    const requested = TYPE_BY_KEY[String(type ?? '')];
    if (requested && tabs.includes(requested)) setActive(requested);
  }, [type, tabs]);

  if (tabs.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50" edges={['top']}>
        <Text className="font-psemibold text-lg">No booking categories available.</Text>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* The type picker rides above the shared shell so switching type feels
          like changing tabs, not restarting a flow. */}
      <SafeAreaView edges={['top']} className="bg-gray-50">
        <BookingTypeTabs types={tabs} selected={active} onSelect={setActive} />
      </SafeAreaView>

      <View className="flex-1">
        {active === types.booking_type_room ? <RoomBooking /> : null}
        {active === types.booking_type_flat ? <FlatBooking /> : null}
        {active === types.booking_type_food ? <FoodBooking /> : null}
        {active === types.booking_type_travel ? <TravelBooking /> : null}
        {active === types.booking_type_adhyayan ? <AdhyayanBooking /> : null}
        {active === types.booking_type_event ? <EventsBooking /> : null}
      </View>
    </View>
  );
};

export default BookNow;
