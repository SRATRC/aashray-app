import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const UtsavGuidelines = () => {
  const router = useRouter();

  const guidelines = [
    'Maintain silence and discipline at all times.',
    'Respect the speakers and fellow attendees.',
    'Follow the dress code as specified.',
    'Keep your mobile phones on silent mode.',
    'Do not bring outside food or drinks.',
    'Cooperate with the volunteers and staff.',
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
        <Text className="font-psemibold text-lg text-gray-900">Utsav Guidelines</Text>
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="close" size={24} color="#222" />
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1 p-6">
        <View className="gap-y-4">
          {guidelines.map((item, index) => (
            <View key={index} className="flex-row items-start">
              <Text className="mr-3 font-pbold text-lg text-secondary">•</Text>
              <Text className="flex-1 font-pregular text-base text-gray-800">{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UtsavGuidelines;
