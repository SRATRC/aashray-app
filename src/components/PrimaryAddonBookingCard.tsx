import { View, Text, Platform } from 'react-native';
import React from 'react';

interface PrimaryAddonBookingCardProps {
  containerStyles: any;
  title: any;
  children: any;
}

const PrimaryAddonBookingCard: React.FC<PrimaryAddonBookingCardProps> = ({
  containerStyles,
  title,
  children,
}) => {
  return (
    <View className={`w-full px-4 ${containerStyles}`}>
      <Text className="font-psemibold text-xl text-secondary">{title}</Text>
      <View
        className={`mt-4 flex flex-col rounded-2xl bg-white ${
          Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'
        }`}>
        {children}
      </View>
    </View>
  );
};

export default PrimaryAddonBookingCard;
