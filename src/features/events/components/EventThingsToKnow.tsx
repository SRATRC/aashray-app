// src/features/events/components/EventThingsToKnow.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface EventThingsToKnowProps {
  /** Lowercase entity name used in the schedule row copy, e.g. "adhyayan" / "utsav". */
  entityLabel?: string;
  /** Heading for the guidelines row, e.g. "Adhyayan guidelines" / "Utsav guidelines". */
  guidelinesLabel?: string;
  onSchedulePress?: () => void;
  onGuidelinesPress?: () => void;
  onContactPress: () => void;
}

// Static "Things to know" info rows (schedule, guidelines, contact support).
const EventThingsToKnow: React.FC<EventThingsToKnowProps> = ({
  entityLabel = 'adhyayan',
  guidelinesLabel = 'Adhyayan guidelines',
  onSchedulePress,
  onGuidelinesPress,
  onContactPress,
}) => (
  <View className="mb-32 px-6 pb-6">
    <Text className="mb-4 font-psemibold text-xl text-gray-900">Things to know</Text>

    <View className="gap-4">
      {/* Timings */}
      <TouchableOpacity className="flex-row items-center justify-between" onPress={onSchedulePress}>
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={20} color="#666" />
          <View className="ml-3">
            <Text className="font-psemibold text-base text-gray-900">Daily schedule</Text>
            <Text className="font-pregular text-sm text-gray-600">
              Timings will be shared before {entityLabel}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>

      {/* Guidelines */}
      <TouchableOpacity
        className="flex-row items-center justify-between"
        onPress={onGuidelinesPress}>
        <View className="flex-row items-center">
          <Ionicons name="list-outline" size={20} color="#666" />
          <View className="ml-3">
            <Text className="font-psemibold text-base text-gray-900">{guidelinesLabel}</Text>
            <Text className="font-pregular text-sm text-gray-600">
              Discipline and conduct rules
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>

      {/* Contact */}
      <TouchableOpacity className="flex-row items-center justify-between" onPress={onContactPress}>
        <View className="flex-row items-center">
          <Ionicons name="call-outline" size={20} color="#666" />
          <View className="ml-3">
            <Text className="font-psemibold text-base text-gray-900">Contact support</Text>
            <Text className="font-pregular text-sm text-gray-600">Get help with your booking</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  </View>
);

export default EventThingsToKnow;
