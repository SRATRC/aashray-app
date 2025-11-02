import { View, Text } from 'react-native';
import { ShadowBox } from './ShadowBox';
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
      <ShadowBox className="mt-4 flex flex-col rounded-2xl bg-white">{children}</ShadowBox>
    </View>
  );
};

export default PrimaryAddonBookingCard;
