// src/design/primitives/Touchable.tsx
import React from 'react';
import { Platform, Pressable, PressableProps, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { motion } from '../tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  haptic?: 'light' | 'selection' | 'none';
  style?: ViewStyle;
};

const DEFAULT_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

export function Touchable({
  onPress,
  haptic = 'light',
  disabled,
  style,
  accessibilityRole = 'button',
  hitSlop = DEFAULT_HIT_SLOP,
  children,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.45 : 1,
  }));

  const fireHaptic = () => {
    if (haptic === 'none' || disabled) return;
    if (haptic === 'selection') {
      Haptics.selectionAsync();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <AnimatedPressable
      accessibilityRole={accessibilityRole}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => {
        if (disabled) return;
        scale.value = withTiming(motion.press.scale, { duration: 80 });
        fireHaptic();
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 });
      }}
      onPress={(event) => {
        if (disabled) return;
        onPress?.(event);
      }}
      android_ripple={
        Platform.OS === 'android' && !disabled
          ? { color: motion.press.ripple, borderless: false }
          : undefined
      }
      style={[
        { minHeight: Platform.OS === 'ios' ? 44 : 48, justifyContent: 'center' },
        style,
        animatedStyle,
      ]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
