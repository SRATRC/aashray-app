import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

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
  const bgStyle = backgroundColor || 'bg-white';
  const border = backgroundColor ? '' : 'border-2 border-gray-200';

  return (
    <View className={`gap-y-2 ${otherStyles}`}>
      <Text className="font-pmedium text-base text-gray-600">{text}</Text>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className={`h-16 w-full flex-row items-center rounded-2xl px-4 ${bgStyle} ${border} ${displayViewStyles}`}>
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

export default FormDisplayField;
