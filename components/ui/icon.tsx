import colors from '@/constants/colors';
import { LucideProps } from 'lucide-react-native';
import React from 'react';

export type Props = LucideProps & {
  name: React.ComponentType<LucideProps>;
};

export function Icon({ name: IconComponent, color, size = 24, strokeWidth = 1.8, ...rest }: Props) {
  // Use provided color prop if available, otherwise use default icon color
  const iconColor = color || colors.gray_700;

  return (
    <IconComponent
      color={iconColor}
      size={size}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      {...rest}
    />
  );
}
