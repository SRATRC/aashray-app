import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import React, { FC } from 'react';

interface CustomButtonProps {
  text: string;
  handlePress: any;
  containerStyles?: string;
  textStyles?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  bgcolor?: string;
}

const CustomButton: FC<CustomButtonProps> = ({
  text,
  handlePress,
  containerStyles = '',
  textStyles = 'text-white',
  isLoading = false,
  isDisabled = false,
  bgcolor = 'bg-secondary',
}) => {
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className={`
        ${bgcolor} 
        items-center justify-center rounded-xl 
        ${containerStyles} 
        ${isLoading || isDisabled ? 'opacity-50' : ''} 
        flex-row
      `}
      disabled={isLoading || isDisabled}>
      <Text className={`font-psemibold text-lg ${textStyles}`}>{text}</Text>
      {isLoading && <ActivityIndicator size="small" color="white" style={{ marginLeft: 10 }} />}
    </TouchableOpacity>
  );
};

export default CustomButton;
