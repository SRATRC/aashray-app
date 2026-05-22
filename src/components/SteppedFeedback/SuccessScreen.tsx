import { colors } from '@/src/constants';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

type SuccessScreenProps = {
  opacity: Animated.Value;
  title: string;
  subtitle: string;
  backgroundColor: string;
  onDismiss?: () => void;
  autoDismissMs?: number;
};

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  opacity,
  title,
  subtitle,
  backgroundColor,
  onDismiss,
  autoDismissMs = 3000,
}) => {
  const dismissed = useRef(false);

  const handleDismiss = () => {
    if (dismissed.current || !onDismiss) return;
    dismissed.current = true;
    onDismiss();
  };

  useEffect(() => {
    if (!onDismiss) return;
    const timer = setTimeout(handleDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [onDismiss, autoDismissMs]);

  return (
    <Animated.View style={[styles.container, { opacity, backgroundColor }]}>
      <Pressable style={styles.pressable} onPress={handleDismiss}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {onDismiss && <Text style={styles.hint}>Tap to continue</Text>}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  pressable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 38,
    fontFamily: 'DMSerifDisplay-Regular',
    color: colors.black,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'DMSans-Light',
    color: colors.gray_600,
    marginTop: 12,
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    fontFamily: 'DMSans-Regular',
    color: colors.gray_400,
    marginTop: 32,
    textAlign: 'center',
  },
});
