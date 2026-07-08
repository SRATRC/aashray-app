// src/features/events/components/EventHeroInfo.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

interface EventHeroInfoProps {
  name: string;
  location: string;
  speaker: string;
}

// Title + host info block shown at the top of the adhyayan detail scroll view.
const EventHeroInfo: React.FC<EventHeroInfoProps> = ({ name, location, speaker }) => (
  <View className="px-6">
    {/* Title Section */}
    <View className="my-6">
      <Text className="mb-2 font-pbold text-3xl leading-tight text-gray-900">{name}</Text>
      <View className="flex-row items-center gap-2">
        <Ionicons name="book-outline" size={16} color="#EA580C" />
        <Text className="font-pmedium text-base text-gray-900">Adhyayan</Text>
        <Text className="text-gray-400">·</Text>
        <Text className="font-pmedium text-base text-gray-900 underline">{location}</Text>
      </View>
    </View>

    {/* Host Info */}
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
  </View>
);

export default EventHeroInfo;
