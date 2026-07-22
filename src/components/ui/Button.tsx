import React, { type FC } from 'react';
import { ActivityIndicator, TouchableOpacity } from 'react-native';

import { Text } from './Text';

import { palette } from '@/theme/tokens';

interface ButtonProps {
  text: string;
  handlePress: () => void;
  containerStyles?: string;
  textStyles?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  bgcolor?: string;
  variant?: 'solid' | 'outline' | 'pill';
}

export const Button: FC<ButtonProps> = ({
  text,
  handlePress,
  containerStyles = '',
  textStyles = '',
  isLoading = false,
  isDisabled = false,
  bgcolor = 'bg-secondary',
  variant = 'solid',
}) => {
  const disabled = isLoading || isDisabled;

  if (variant === 'pill') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        disabled={disabled}
        className={`h-14 flex-row items-center justify-center rounded-full ${bgcolor} ${containerStyles} ${
          disabled ? 'opacity-45' : ''
        }`}>
        <Text variant="dmmedium" className={`text-base text-white ${textStyles}`}>
          {text}
        </Text>
        {isLoading && (
          <ActivityIndicator
            size="small"
            color={palette.white.DEFAULT}
            style={{ marginLeft: 10 }}
          />
        )}
      </TouchableOpacity>
    );
  }

  const container =
    variant === 'outline'
      ? `border-2 border-secondary bg-white ${containerStyles}`
      : `${bgcolor} ${containerStyles}`;
  const textColor = variant === 'outline' ? 'text-secondary' : 'text-white';

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled}
      className={`flex-row items-center justify-center rounded-xl ${container} ${
        disabled ? 'opacity-50' : ''
      }`}>
      <Text variant="semibold" className={`text-lg ${textColor} ${textStyles}`}>
        {text}
      </Text>
      {isLoading && (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? palette.secondary.DEFAULT : palette.white.DEFAULT}
          style={{ marginLeft: 10 }}
        />
      )}
    </TouchableOpacity>
  );
};
