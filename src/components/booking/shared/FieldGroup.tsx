import { FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';

import { colors } from '@/src/constants';

/**
 * The native grouped-list pattern, used for every set of booking inputs.
 *
 * The old screens stacked "label above a full-width box" with 28px gaps, which
 * is a web form. This is the phone pattern instead: a titled group, rows
 * separated by hairlines, label on the left, current value and a chevron on the
 * right, each row at least 44pt tall.
 */

interface FieldGroupProps {
  title?: string;
  /** Explanation for the whole group, e.g. why a choice matters. */
  footer?: string;
  children: React.ReactNode;
  className?: string;
}

export const FieldGroup: React.FC<FieldGroupProps> = ({
  title,
  footer,
  children,
  className = '',
}) => {
  const rows = React.Children.toArray(children).filter(Boolean);

  return (
    <View className={className}>
      {title ? (
        <Text className="mb-2 px-1 font-pmedium text-xs uppercase tracking-wide text-gray-400">
          {title}
        </Text>
      ) : null}
      <View className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {rows.map((row, i) => (
          <View key={i}>
            {i > 0 ? <View className="ml-4 h-px bg-gray-200" /> : null}
            {row}
          </View>
        ))}
      </View>
      {footer ? (
        <Text className="mt-2 px-1 font-pregular text-xs leading-5 text-gray-500">{footer}</Text>
      ) : null}
    </View>
  );
};

interface FieldRowProps {
  label: string;
  /** The chosen value. Renders muted when absent so an empty row reads as a prompt. */
  value?: string | null;
  placeholder?: string;
  onPress?: () => void;
  /** Right-hand content instead of value + chevron, e.g. a switch. */
  accessory?: React.ReactNode;
  error?: boolean;
  disabled?: boolean;
}

/** Error text sized to sit under a row without breaking its rhythm. */
export const FieldRowError: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <Text className="-mt-1 px-4 pb-2.5 font-pregular text-xs text-red-200">{message}</Text>
  ) : null;

export const FieldRow: React.FC<FieldRowProps> = ({
  label,
  value,
  placeholder = 'Select',
  onPress,
  accessory,
  error = false,
  disabled = false,
}) => {
  const body = (
    <View
      className="min-h-[52px] flex-row items-center justify-between gap-x-3 px-4 py-3"
      style={disabled ? { opacity: 0.5 } : undefined}>
      <Text className="font-pregular text-base text-gray-700">{label}</Text>

      {accessory ?? (
        <View className="flex-1 flex-row items-center justify-end gap-x-2">
          <Text
            className={`font-pmedium text-base ${
              error ? 'text-red-200' : value ? 'text-gray-900' : 'text-gray-400'
            }`}
            numberOfLines={1}>
            {value || placeholder}
          </Text>
          {onPress ? <FontAwesome5 name="chevron-right" size={13} color={colors.gray_400} /> : null}
        </View>
      )}
    </View>
  );

  if (!onPress || disabled) return body;

  return (
    <Pressable onPress={onPress} android_ripple={{ color: colors.gray_200 }}>
      {({ pressed }) => (
        <View style={pressed ? { backgroundColor: colors.gray_100 } : undefined}>{body}</View>
      )}
    </Pressable>
  );
};

interface FieldTextRowProps {
  label: string;
  value?: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  keyboardType?: any;
  maxLength?: number;
  autoCapitalize?: any;
  /** Lets a long value wrap onto more lines, e.g. an address. */
  multiline?: boolean;
  error?: boolean;
  errorMessage?: string;
}

/**
 * A typed field as a group row, so an input and a picker read as the same kind
 * of control. Long values wrap onto more lines but stay right-aligned: one row
 * breaking to a left-aligned block was the only thing on the card out of line.
 */
// Four lines at the row's 16pt text. Past that the field scrolls, so one long
// address cannot push the rest of the group off screen.
const MULTILINE_MAX_HEIGHT = 88;

export const FieldTextRow: React.FC<FieldTextRowProps> = ({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType,
  maxLength,
  autoCapitalize = 'none',
  multiline = false,
  error = false,
  errorMessage,
}) => (
  <View>
    <View
      className={`min-h-[52px] flex-row gap-x-3 px-4 py-3 ${
        multiline ? 'items-start' : 'items-center'
      }`}>
      <Text className="font-pregular text-base text-gray-700">{label}</Text>
      <TextInput
        className={`flex-1 text-right font-pmedium text-base ${
          error ? 'text-red-200' : 'text-gray-900'
        }`}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.gray_400}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        multiline={multiline}
        textAlign="right"
        scrollEnabled={multiline}
        style={
          multiline
            ? { textAlignVertical: 'top', paddingTop: 0, maxHeight: MULTILINE_MAX_HEIGHT }
            : undefined
        }
      />
    </View>
    <FieldRowError message={error ? errorMessage : undefined} />
  </View>
);

export default FieldGroup;
