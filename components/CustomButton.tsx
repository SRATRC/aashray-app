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
  variant?: 'solid' | 'outline';
}

const CustomButton: FC<CustomButtonProps> = ({
  text,
  handlePress,
  containerStyles = '',
  textStyles = '',
  isLoading = false,
  isDisabled = false,
  bgcolor = 'bg-secondary',
  variant = 'solid',
}) => {
  const getStyles = () => {
    if (variant === 'outline') {
      return {
        container: `border-2 border-secondary bg-white ${containerStyles}`,
        text: `text-secondary ${textStyles}`,
      };
    }
    return {
      container: `${bgcolor} ${containerStyles}`,
      text: `text-white ${textStyles}`,
    };
  };

  const styles = getStyles();

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className={`
        items-center justify-center rounded-xl 
        ${styles.container}
        ${isLoading || isDisabled ? 'opacity-50' : ''} 
        flex-row
      `}
      disabled={isLoading || isDisabled}>
      <Text className={`font-psemibold text-lg ${styles.text}`}>{text}</Text>
      {isLoading && (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? '#F97316' : 'white'}
          style={{ marginLeft: 10 }}
        />
      )}
    </TouchableOpacity>
  );
};

export default CustomButton;
