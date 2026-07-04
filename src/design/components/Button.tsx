// src/design/components/Button.tsx
import React from 'react';
import { ActivityIndicator, View, ViewStyle } from 'react-native';

import type { IconName } from '../icons/registry';
import { Icon } from '../primitives/Icon';
import { Text } from '../primitives/Text';
import { Touchable } from '../primitives/Touchable';
import { useTheme } from '../theme/useTheme';
import { spacing, radius } from '../tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

type Props = {
  text: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  onPress?: () => void;
};

const HEIGHT: Record<ButtonSize, number> = { sm: 44, md: 48, lg: 52 };
const H_PADDING: Record<ButtonSize, number> = { sm: spacing[4], md: spacing[5], lg: spacing[6] };

export function Button({
  text,
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading,
  disabled,
  leadingIcon,
  trailingIcon,
  onPress,
}: Props) {
  const t = useTheme();

  // `color` prop on <Text> only reaches `text/*` tokens; `accent.on` (used for the
  // primary label) is a distinct accent-namespace token, so it's applied via style.
  const VARIANTS: Record<
    ButtonVariant,
    {
      backgroundColor: string;
      borderWidth: number;
      borderColor?: string;
      contentColor: string;
      labelColorProp?: React.ComponentProps<typeof Text>['color'];
    }
  > = {
    primary: {
      backgroundColor: t.color.accent.default,
      borderWidth: 0,
      contentColor: t.color.accent.on,
    },
    secondary: {
      backgroundColor: t.color.bg.surface,
      borderWidth: 1,
      borderColor: t.color.line.default,
      contentColor: t.color.text.primary,
      labelColorProp: 'primary',
    },
    tertiary: {
      backgroundColor: 'transparent',
      borderWidth: 0,
      contentColor: t.color.text.accent,
      labelColorProp: 'accent',
    },
    destructive: {
      backgroundColor: t.color.status.error,
      borderWidth: 0,
      contentColor: t.color.text.inverse,
      labelColorProp: 'inverse',
    },
  };
  const variantStyle = VARIANTS[variant];
  const contentColor = variantStyle.contentColor;

  const containerStyle: ViewStyle = {
    height: HEIGHT[size],
    borderRadius: radius.md,
    paddingHorizontal: H_PADDING[size],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    width: fullWidth ? '100%' : undefined,
    backgroundColor: variantStyle.backgroundColor,
    borderWidth: variantStyle.borderWidth,
    borderColor: variantStyle.borderColor,
  };

  return (
    <Touchable
      testID="button-root"
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={text}
      style={containerStyle}>
      {/*
        The label row stays mounted (and keeps its layout width) even while loading, so the
        button never collapses/resizes when it flips into the loading state. It's only made
        invisible + hidden from the accessibility tree, and the spinner is overlaid on top —
        this is why `queryByText` correctly returns null while loading.
      */}
      <View
        style={{ flexDirection: 'row', alignItems: 'center', opacity: loading ? 0 : 1 }}
        accessibilityElementsHidden={loading}
        importantForAccessibility={loading ? 'no-hide-descendants' : 'auto'}>
        {leadingIcon ? <Icon name={leadingIcon} size={20} color={contentColor} /> : null}
        <Text
          variant="button"
          color={variantStyle.labelColorProp}
          style={[
            variant === 'primary' ? { color: contentColor } : null,
            leadingIcon ? { marginLeft: spacing[2] } : null,
            trailingIcon ? { marginRight: spacing[2] } : null,
          ]}>
          {text}
        </Text>
        {trailingIcon ? <Icon name={trailingIcon} size={20} color={contentColor} /> : null}
      </View>
      {loading ? (
        <ActivityIndicator
          testID="button-spinner"
          color={contentColor}
          style={{ position: 'absolute' }}
        />
      ) : null}
    </Touchable>
  );
}
