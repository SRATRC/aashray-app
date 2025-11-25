import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CustomErrorMessage = ({
  errorTitle,
  errorMessage,
}: {
  errorTitle: string;
  errorMessage: string;
}) => {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Ionicons name="warning-outline" size={48} color="#DC2626" />
      <Text className="mb-2 mt-4 text-center font-psemibold text-xl text-gray-900">
        {errorTitle}
      </Text>
      <Text className="mb-6 text-center text-base text-gray-600">{errorMessage}</Text>
    </View>
  );
};

export default CustomErrorMessage;
