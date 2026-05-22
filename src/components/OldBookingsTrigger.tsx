import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Svg, { Polygon, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants';

interface Props {
  isExpanded: boolean;
  onToggle: () => void;
  compact?: boolean;
}

const CheckmarkIllustration = () => (
  <Svg width={160} height={112} viewBox="10 8 180 127">
    <Defs>
      <LinearGradient id="leftArmLight" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#FDE68A" />
        <Stop offset="1" stopColor="#F59E0B" />
      </LinearGradient>
      <LinearGradient id="leftArmDark" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#D97706" />
        <Stop offset="1" stopColor="#78350F" />
      </LinearGradient>
      <LinearGradient id="rightArmLight" x1="1" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FB923C" />
        <Stop offset="1" stopColor="#EA580C" />
      </LinearGradient>
      <LinearGradient id="rightArmDark" x1="1" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#9A3412" />
        <Stop offset="1" stopColor="#431407" />
      </LinearGradient>
    </Defs>
    <Polygon points="29,57 86,105 87,120 22,65" fill="url(#leftArmLight)" />
    <Polygon points="22,65 87,120 88,135 15,73" fill="url(#leftArmDark)" />
    <Polygon points="87,120 86,105 169,8 177,15" fill="url(#rightArmLight)" />
    <Polygon points="87,120 177,15 185,22 88,135" fill="url(#rightArmDark)" />
  </Svg>
);

const OldBookingsTrigger: React.FC<Props> = ({ isExpanded, onToggle, compact }) => {
  if (isExpanded) return null;

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        className="mt-4 flex-row items-center gap-x-3 px-2">
        <View className="flex-1 border-t border-dashed border-gray-200" />
        <View className="flex-row items-center gap-x-1">
          <Text className="font-pregular text-sm text-gray-400">Past Bookings</Text>
          <Ionicons name="chevron-down" size={14} color={colors.orange} />
        </View>
        <View className="flex-1 border-t border-dashed border-gray-200" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      className="mx-1 mt-4 items-center rounded-2xl border border-gray-100 px-6 py-8">
      <CheckmarkIllustration />
      <Text className="mt-4 font-psemibold text-lg text-gray-700">You're all caught up</Text>
      <View className="mt-1 flex-row items-center gap-x-1">
        <Text className="font-pregular text-sm text-secondary">View past bookings</Text>
        <Ionicons name="chevron-down" size={14} color={colors.orange} />
      </View>
    </TouchableOpacity>
  );
};

export default OldBookingsTrigger;
