import { colors } from '@/src/constants';
import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

type BooleanInputProps = {
  value: boolean | undefined;
  onSelect: (value: boolean) => void;
  accentColor: string;
  accentForeground: string;
  labels: [string, string]; // [trueLabel, falseLabel]
  pillScales: Animated.Value[];
  onPillPress: (index: number) => void;
};

export const BooleanInput: React.FC<BooleanInputProps> = ({
  value,
  onSelect,
  accentColor,
  accentForeground,
  labels,
  pillScales,
  onPillPress,
}) => {
  const options: { val: boolean; label: string; index: number }[] = [
    { val: true, label: labels[0], index: 0 },
    { val: false, label: labels[1], index: 1 },
  ];

  return (
    <View style={styles.row}>
      {options.map(({ val, label, index }) => {
        const isSelected = value === val;
        return (
          <Animated.View
            key={index}
            style={[styles.pillWrapper, { transform: [{ scale: pillScales[index] }] }]}>
            <Pressable
              onPress={() => {
                onSelect(val);
                onPillPress(index);
              }}
              style={[
                styles.pill,
                isSelected ? { backgroundColor: accentColor } : { backgroundColor: '#F2F2F2' },
              ]}>
              <Text
                style={[
                  styles.pillLabel,
                  isSelected ? { color: accentForeground } : styles.pillLabelDefault,
                ]}>
                {label}
              </Text>
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  pillWrapper: {
    flex: 1,
  },
  pill: {
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: {
    fontSize: 17,
    fontFamily: 'DMSans-Medium',
  },
  pillLabelDefault: {
    color: colors.black,
  },
});
