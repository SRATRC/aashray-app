// src/features/events/components/EventHeroInfo.tsx
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import React from 'react';
import { Text, View } from 'react-native';

interface EventHeroInfoProps {
  name: string;
  location: string;
  /** Adhyayan speaker. Omit to skip the host card (e.g. for Utsav). */
  speaker?: string;
  /** Category icon shown next to `categoryLabel`. Defaults to the adhyayan icon. */
  icon?: ComponentProps<typeof Ionicons>['name'];
  /** Category label shown next to the location (e.g. "Adhyayan" / "Utsav"). */
  categoryLabel?: string;
}

// Title + optional host info block shown at the top of the event detail scroll view.
const EventHeroInfo: React.FC<EventHeroInfoProps> = ({
  name,
  location,
  speaker,
  icon = 'book-outline',
  categoryLabel = 'Adhyayan',
}) => (
  <View className="px-6">
    {/* Title Section */}
    <View className="my-6">
      <Text className="mb-2 font-pbold text-3xl leading-tight text-gray-900">{name}</Text>
      <View className="flex-row items-center gap-2">
        <Ionicons name={icon} size={16} color="#EA580C" />
        <Text className="font-pmedium text-base text-gray-900">{categoryLabel}</Text>
        <Text className="text-gray-400">·</Text>
        <Text className="font-pmedium text-base text-gray-900 underline">{location}</Text>
      </View>
    </View>

    {/* Host Info */}
    {speaker ? (
      <View className="mb-6 flex-row items-center justify-between rounded-xl border border-gray-200 p-4">
        <View className="flex-row items-center">
          <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Ionicons name="person" size={20} color="#EA580C" />
          </View>
          <View>
            <Text className="font-psemibold text-base text-gray-900">{speaker}</Text>
            <Text className="font-pregular text-sm text-gray-600">Speaker</Text>
          </View>
        </View>
      </View>
    ) : null}
  </View>
);

export default EventHeroInfo;
