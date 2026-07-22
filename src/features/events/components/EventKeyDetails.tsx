// src/features/events/components/EventKeyDetails.tsx
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import React from 'react';
import { Text, View } from 'react-native';

export interface AvailabilityInfo {
  text: string;
  shortText: string;
  color: string;
  isWaitlist: boolean;
}

interface EventKeyDetailsProps {
  /** Section heading, e.g. "Adhyayan details" / "Utsav details". */
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  /** Raw status string; the "Open" badge shows when this equals 'open'. */
  status?: string;
  availableSeats?: number;
  /** Adhyayan-only food card; omit to skip it (e.g. for Utsav). */
  foodAllowed?: boolean;
  availabilityInfo: AvailabilityInfo;
}

// Date/location/food/availability cards shown under the event details heading.
const EventKeyDetails: React.FC<EventKeyDetailsProps> = ({
  title,
  startDate,
  endDate,
  location,
  status,
  availableSeats,
  foodAllowed,
  availabilityInfo,
}) => (
  <View className="px-6 pb-6">
    <Text className="mb-4 font-psemibold text-xl text-gray-900">{title}</Text>

    {/* Date & Time Card */}
    <View className="mb-4 rounded-xl border border-gray-200 p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name="calendar-clear-outline" size={20} color="#222" />
          <Text className="ml-2 font-psemibold text-base text-gray-900">
            {moment(startDate).format('MMM D')} - {moment(endDate).format('D, YYYY')}
          </Text>
        </View>
        <View className="rounded-full bg-orange-100 px-3 py-1">
          <Text className="font-pmedium text-xs text-orange-700">
            {moment(endDate).diff(moment(startDate), 'days') + 1} days
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
          <Text className="font-psemibold text-base text-gray-900">{location}</Text>
          <Text className="mt-1 font-pregular text-sm text-gray-600">
            {location === 'Research Centre'
              ? 'Accommodation available at venue'
              : 'Accommodation not available at venue'}
          </Text>
        </View>
      </View>
    </View>

    {/* Food Information if available */}
    {foodAllowed && (
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
        availabilityInfo.isWaitlist || (availableSeats && availableSeats <= 10)
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
        {status === 'open' && !availabilityInfo.isWaitlist && (
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
