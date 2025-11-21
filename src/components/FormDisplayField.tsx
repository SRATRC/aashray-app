import React from 'react';
import { View, Text, Platform, TouchableOpacity, StyleSheet } from 'react-native';

interface FormDisplayFieldProps {
  text: string;
  value?: string;
  placeholder?: string;
  backgroundColor?: string;
  otherStyles?: string;
  inputStyles?: string;
  displayViewStyles?: string;
  onPress?: () => void;
}

const FormDisplayField: React.FC<FormDisplayFieldProps> = ({
  text,
  value,
  placeholder,
  backgroundColor,
  otherStyles = '',
  inputStyles = '',
  displayViewStyles = '',
  onPress,
}) => {
  const shadowStyle = !backgroundColor
    ? Platform.OS === 'ios'
      ? styles.iosShadow
      : styles.androidShadow
    : {};

  const bgStyle = backgroundColor || 'bg-white';

  return (
    <View className={`gap-y-2 ${otherStyles}`}>
      <Text className="font-pmedium text-base text-gray-600">{text}</Text>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={shadowStyle}
        className={`h-16 w-full flex-row items-center rounded-2xl px-4 ${bgStyle} ${displayViewStyles}`}>
        <Text
          className={`font-pmedium text-base ${
            !value && placeholder ? 'text-gray-400' : 'text-black'
          } ${inputStyles}`}
          numberOfLines={1}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  iosShadow: {
    shadowColor: '#d1d5db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 0,
  },
  androidShadow: {
    elevation: 8,
    shadowColor: 'transparent',
  },
});

export default FormDisplayField;
