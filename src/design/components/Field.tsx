// src/design/components/Field.tsx
import React, { forwardRef, useState } from 'react';
import {
  KeyboardTypeOptions,
  NativeSyntheticEvent,
  ReturnKeyTypeOptions,
  TextInput,
  TextInputSubmitEditingEventData,
  View,
} from 'react-native';

import type { IconName } from '../icons/registry';
import { Icon } from '../primitives/Icon';
import { Text } from '../primitives/Text';
import { Touchable } from '../primitives/Touchable';
import { useTheme } from '../theme/useTheme';
import { radius, spacing, typography } from '../tokens';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  leadingIcon?: IconName;
  secureToggle?: boolean;
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void;
  autoFocus?: boolean;
};

export const Field = forwardRef<TextInput, Props>(function Field(
  {
    label,
    value,
    onChangeText,
    placeholder,
    helperText,
    error,
    leadingIcon,
    secureToggle,
    keyboardType,
    returnKeyType,
    onSubmitEditing,
    autoFocus,
  },
  ref
) {
  const t = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [secure, setSecure] = useState(true);

  const borderColor = error
    ? t.color.status.error
    : isFocused
      ? t.color.accent.default
      : t.color.line.default;

  return (
    <View>
      <Text variant="label" color="muted" style={{ marginBottom: spacing[1] }}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor,
          borderRadius: radius.md,
          backgroundColor: t.color.bg.surface,
          paddingHorizontal: spacing[3],
        }}>
        {leadingIcon ? <Icon name={leadingIcon} size={20} color={t.color.text.muted} /> : null}
        <TextInput
          ref={ref}
          testID="field-input"
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t.color.text.muted}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoFocus={autoFocus}
          secureTextEntry={secureToggle ? secure : false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          allowFontScaling
          maxFontSizeMultiplier={1.4}
          clearButtonMode="while-editing"
          style={{
            flex: 1,
            fontFamily: typography.body.family,
            fontSize: typography.body.size,
            lineHeight: typography.body.lineHeight,
            color: t.color.text.primary,
            paddingVertical: spacing[3],
            marginLeft: leadingIcon ? spacing[2] : 0,
          }}
        />
        {secureToggle ? (
          <Touchable
            accessibilityLabel={secure ? 'Show password' : 'Hide password'}
            onPress={() => setSecure((s) => !s)}
            style={{ marginLeft: spacing[2] }}>
            <Icon name={secure ? 'eye' : 'eye-off'} size={20} color={t.color.text.muted} />
          </Touchable>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" style={{ color: t.color.status.error, marginTop: spacing[1] }}>
          {error}
        </Text>
      ) : helperText ? (
        <Text variant="caption" color="muted" style={{ marginTop: spacing[1] }}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
});
