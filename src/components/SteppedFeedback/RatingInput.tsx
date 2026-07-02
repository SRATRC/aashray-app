import { colors } from '@/src/constants';
import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

type RatingInputProps = {
  value: number | undefined;
  onSelect: (value: number) => void;
  accentColor: string;
  accentForeground: string;
  ratingLabels: [string, string];
  pillScales: Animated.Value[];
  onPillPress: (index: number) => void;
};

const RATINGS = [1, 2, 3, 4, 5];

export const RatingInput: React.FC<RatingInputProps> = ({
  value,
  onSelect,
  accentColor,
  accentForeground,
  ratingLabels,
  pillScales,
  onPillPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {RATINGS.map((rating, index) => {
          const isSelected = value === rating;
          return (
            <Animated.View
              key={rating}
              style={[styles.pillWrapper, { transform: [{ scale: pillScales[index] }] }]}>
              <Pressable
                onPress={() => {
                  onSelect(rating);
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
                  {rating}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
      <View style={styles.labelsRow}>
        <Text style={styles.endLabel}>{ratingLabels[0].toUpperCase()}</Text>
        <Text style={styles.endLabel}>{ratingLabels[1].toUpperCase()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
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
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  endLabel: {
    fontSize: 11,
    fontFamily: 'DMSans-Light',
    color: colors.gray_400,
    letterSpacing: 0.5,
  },
});
