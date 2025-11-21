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
  }
> = {
  default: {
    container: 'bg-transparent',
    iconColor: '#6B7280',
    iconName: 'info-circle',
  },
  warning: {
    container: 'bg-secondary-50 border-secondary',
    iconColor: '#F1AC09',
    iconName: 'info-circle',
  },
  error: {
    container: 'bg-red-100 border-red-500',
    iconColor: '#EF4444',
    iconName: 'exclamation-triangle',
  },
  success: {
    container: 'bg-green-100 border-green-500',
    iconColor: '#22C55E',
    iconName: 'check-circle',
  },
};

const Callout = ({ message, overrideStyle, variant = 'default' }: CalloutProps) => {
  const styles = VARIANT_STYLES[variant];

  return (
    <View
      className={`flex-row items-start gap-x-3 rounded-xl p-4 ${styles.container} ${overrideStyle}`}>
      <FontAwesome
        name={styles.iconName}
        size={18}
        color={styles.iconColor}
        style={{ marginTop: 2 }}
      />
      <Text className="flex-1 font-pregular text-sm leading-5 text-gray-800">{message}</Text>
    </View>
  );
};

export default Callout;
