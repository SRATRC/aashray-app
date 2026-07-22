import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

type Variant = 'regular' | 'medium' | 'semibold' | 'bold' | 'light' | 'dmregular' | 'dmmedium';

const VARIANT_FONT: Record<Variant, string> = {
  regular: 'font-pregular',
  medium: 'font-pmedium',
  semibold: 'font-psemibold',
  bold: 'font-pbold',
  light: 'font-plight',
  dmregular: 'font-dmregular',
  dmmedium: 'font-dmmedium',
};

export interface TextProps extends RNTextProps {
  variant?: Variant;
  className?: string;
}

export function Text({ variant = 'regular', className = '', ...rest }: TextProps) {
  return <RNText className={`${VARIANT_FONT[variant]} ${className}`} {...rest} />;
}
