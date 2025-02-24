import React from 'react';
import { View, Text, Platform, TouchableOpacity } from 'react-native';

interface FormDisplayFieldProps {
  text: any;
  value: any;
  backgroundColor?: any;
  otherStyles?: any;
  displayViewStyles?: any;
  onPress?: any;
}

const FormDisplayField: React.FC<FormDisplayFieldProps> = ({
  text,
  value,
  backgroundColor,
  otherStyles,
  displayViewStyles,
  onPress,
}) => {
  return (
    <TouchableOpacity className={`gap-y-2 ${otherStyles}`} onPress={onPress} activeOpacity={0.7}>
      <Text className="font-pmedium text-base text-gray-600">{text}</Text>
      <View
        pointerEvents="none" // Allows TouchableOpacity to capture press events
        className={`h-16 w-full flex-1 flex-row items-center rounded-2xl px-4 focus:border-2 focus:border-secondary ${displayViewStyles} ${
          backgroundColor
            ? backgroundColor
            : Platform.OS === 'ios'
              ? 'bg-white shadow-lg shadow-gray-200'
              : 'bg-white shadow-2xl shadow-gray-400'
        }`}>
        <Text className="font-pmedium text-base text-gray-400" numberOfLines={1}>
          {value}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default FormDisplayField;
