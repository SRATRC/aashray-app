// src/design/primitives/Text.tsx
import React from 'react';
import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { typography, TextVariant } from '../tokens';
import { useTheme } from '../theme/useTheme';

type Props = TextProps & {
  variant?: TextVariant;
  color?: keyof ReturnType<typeof useTheme>['color']['text'];
  align?: TextStyle['textAlign'];
};

export function Text({ variant = 'body', color = 'primary', align, style, ...rest }: Props) {
  const t = useTheme();
  const v = typography[variant];
  const base: TextStyle = {
    fontFamily: v.family,
    fontSize: v.size,
    lineHeight: v.lineHeight,
    letterSpacing: v.tracking,
    textTransform: v.transform,
    textAlign: align,
    color: t.color.text[color],
  };
  return <RNText allowFontScaling maxFontSizeMultiplier={1.6} style={[base, style]} {...rest} />;
}
