// src/features/events/components/EventKeyDetails.tsx
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import React from 'react';
import { Text, View } from 'react-native';

import type { Adhyayan } from '../types';

export interface AvailabilityInfo {
  text: string;
  shortText: string;
  color: string;
  isWaitlist: boolean;
}

interface EventKeyDetailsProps {
  adhyayan: Adhyayan;
  availabilityInfo: AvailabilityInfo;
}

// Date/location/food/availability cards shown under "Adhyayan details".
const EventKeyDetails: React.FC<EventKeyDetailsProps> = ({ adhyayan, availabilityInfo }) => (
  <View className="px-6 pb-6">
    <Text className="mb-4 font-psemibold text-xl text-gray-900">Adhyayan details</Text>

    {/* Date & Time Card */}
    <View className="mb-4 rounded-xl border border-gray-200 p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name="calendar-clear-outline" size={20} color="#222" />
          <Text className="ml-2 font-psemibold text-base text-gray-900">
            {moment(adhyayan.start_date).format('MMM D')} -{' '}
            {moment(adhyayan.end_date).format('D, YYYY')}
          </Text>
        </View>
        <View className="rounded-full bg-orange-100 px-3 py-1">
          <Text className="font-pmedium text-xs text-orange-700">
            {moment(adhyayan.end_date).diff(moment(adhyayan.start_date), 'days') + 1} days
          </Text>
        </View>
      </View>
      <Text className="font-pregular text-sm text-gray-600">
        Full schedule will be shared after registration
      </Text>
    </View>

    {/* Location Card */}
    <View className="mb-4 rounded-xl border border-gray-200 p-4">
      <View className="flex-row items-start">
        <Ionicons name="location-outline" size={20} color="#222" />
        <View className="ml-2 flex-1">
          <Text className="font-psemibold text-base text-gray-900">{adhyayan.location}</Text>
          <Text className="mt-1 font-pregular text-sm text-gray-600">
            {adhyayan.location === 'Research Centre'
              ? 'Accommodation available at venue'
              : 'Accommodation not available at venue'}
          </Text>
        </View>
      </View>
    </View>

    {/* Food Information if available */}
    {adhyayan.food_allowed && (
      <View className="mb-4 rounded-xl border border-gray-200 p-4">
        <View className="flex-row items-center">
          <Ionicons name="restaurant-outline" size={20} color="#222" />
          <View className="ml-2 flex-1">
            <Text className="font-psemibold text-base text-gray-900">Food arrangements</Text>
            <Text className="mt-1 font-pregular text-sm text-gray-600">
              Meals will be provided during the adhyayan
            </Text>
          </View>
        </View>
      </View>
    )}

    {/* Availability Status */}
    <View
      className={`mb-4 rounded-xl border p-4 ${
        availabilityInfo.isWaitlist || (adhyayan.available_seats && adhyayan.available_seats <= 10)
          ? 'border-red-200 bg-red-50'
          : 'border-green-200 bg-green-50'
      }`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons
            name={availabilityInfo.isWaitlist ? 'time-outline' : 'checkmark-circle-outline'}
            size={20}
            color={availabilityInfo.color}
          />
          <Text className="ml-2 font-psemibold text-base" style={{ color: availabilityInfo.color }}>
            {availabilityInfo.text}
          </Text>
        </View>
        {adhyayan.status === 'open' && !availabilityInfo.isWaitlist && (
          <View className="flex-row items-center">
            <View className="mr-1 h-2 w-2 rounded-full bg-green-500" />
            <Text className="font-pregular text-sm text-gray-600">Open</Text>
          </View>
        )}
      </View>
      {availabilityInfo.isWaitlist && (
        <Text className="mt-2 font-pregular text-sm text-gray-600">
          Join the waitlist to be notified if spots become available
        </Text>
      )}
    </View>
  </View>
);

export default EventKeyDetails;
