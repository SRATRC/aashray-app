import { colors } from '@/src/constants';
import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

type ProgressBarProps = {
  progressAnim: Animated.Value;
  accentColor: string;
  topOffset: number;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progressAnim,
  accentColor,
  topOffset,
}) => {
  return (
    <View style={[styles.track, { top: topOffset }]}>
      <Animated.View style={[styles.fill, { width: progressAnim, backgroundColor: accentColor }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 3,
    width: '100%',
    backgroundColor: colors.gray_200,
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  fill: {
    height: 3,
  },
});
