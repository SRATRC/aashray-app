import React from 'react';
import { View, Text, Platform, ViewStyle, TextStyle } from 'react-native';

interface FormDisplayFieldProps {
  text: string;
  value: string;
  backgroundColor?: string;
  otherStyles?: string;
  displayViewStyles?: string;
  [key: string]: any;
}

const FormDisplayField: React.FC<FormDisplayFieldProps> = ({
  text,
  value,
  backgroundColor,
  otherStyles,
  displayViewStyles,
  ...props
}) => {
  return (
    <View className={`gap-y-2 ${otherStyles}`} {...props}>
      <Text className="font-pmedium text-base text-gray-600">{text}</Text>
      <View
        className={`h-16 w-full flex-row items-center rounded-2xl px-4 focus:border-2 focus:border-secondary ${displayViewStyles} ${
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
    </View>
  );
};

export default FormDisplayField;
