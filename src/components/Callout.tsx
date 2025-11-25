import React from 'react';
import { View, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

type CalloutVariant = 'default' | 'warning' | 'error' | 'success';

interface CalloutProps {
  message: string;
  overrideStyle?: string;
  variant?: CalloutVariant;
}

const VARIANT_STYLES: Record<
  CalloutVariant,
  {
    container: string;
    iconColor: string;
    iconName: keyof typeof FontAwesome.glyphMap;
    textColor: string;
  }
> = {
  default: {
    container: 'bg-gray-50 border border-gray-300',
    iconColor: '#6B7280',
    iconName: 'info-circle',
    textColor: 'text-gray-800',
  },
  warning: {
    container: 'bg-amber-50 border border-amber-300',
    iconColor: '#b45309',
    iconName: 'info-circle',
    textColor: 'text-amber-800',
  },
  error: {
    container: 'bg-red-50 border border-red-300',
    iconColor: '#b91c1c',
    iconName: 'exclamation-triangle',
    textColor: 'text-red-800',
  },
  success: {
    container: 'bg-green-50 border border-green-300',
    iconColor: '#15803d',
    iconName: 'check-circle',
    textColor: 'text-green-800',
  },
};

const Callout = ({ message, overrideStyle, variant = 'default' }: CalloutProps) => {
  const styles = VARIANT_STYLES[variant];

  return (
    <View
      className={`flex-row items-center gap-x-3 rounded-xl p-4 ${styles.container} ${overrideStyle}`}>
      <FontAwesome
        name={styles.iconName}
        size={18}
        color={styles.iconColor}
        style={{ marginTop: 2 }}
      />
      <Text className={`flex-1 font-pregular text-sm leading-5 ${styles.textColor}`}>
        {message}
      </Text>
    </View>
  );
};

export default Callout;
