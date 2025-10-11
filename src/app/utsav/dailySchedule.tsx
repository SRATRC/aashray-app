import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const DailySchedule = () => {
  const router = useRouter();

  const schedule = [
    { time: '6:00 AM', activity: 'Morning Prayers' },
    { time: '7:00 AM', activity: 'Breakfast' },
    { time: '9:00 AM', activity: 'Main Session 1' },
    { time: '12:30 PM', activity: 'Lunch' },
    { time: '3:00 PM', activity: 'Main Session 2' },
    { time: '6:00 PM', activity: 'Evening Prayers' },
    { time: '7:30 PM', activity: 'Dinner' },
    { time: '9:00 PM', activity: 'Cultural Program' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
        <Text className="font-psemibold text-lg text-gray-900">Daily Schedule</Text>
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="close" size={24} color="#222" />
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1 p-6">
        <View className="gap-y-4">
          {schedule.map((item, index) => (
            <View
              key={index}
              className="flex-row items-center rounded-lg border border-gray-100 bg-gray-50/50 p-4">
              <Text className="w-24 font-psemibold text-base text-secondary">{item.time}</Text>
              <Text className="flex-1 font-pregular text-base text-gray-800">{item.activity}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DailySchedule;
