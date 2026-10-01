import React, { useEffect, useState } from 'react';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

/**
 * The move between the two steps of a booking type — pick a thing, then say who
 * is coming.
 *
 * Those steps are not routes. Each screen returns a different `BookingShell`
 * from the same position in its tree, so React reconciles them as one element
 * and swaps the contents in a single commit: the next step is simply there, with
 * nothing in between.
 *
 * `stepKey` is the whole trick. It keys `Step`, so a step change is a real
 * unmount and mount, which resets the shared value below to 0 and lets the
 * arriving step ease in from nothing.
 *
 * The fade is driven by an ordinary shared value rather than Reanimated's
 * `entering` presets. Both would look the same, but this mounts already at
 * opacity 0 and depends on nothing beyond `withTiming`, so there is no layout
 * animation subsystem to misbehave under the New Architecture.
 *
 * Only the arriving step animates. The leaving one is gone the moment state
 * changes; keeping it mounted to animate out would stack two shells, and two
 * pinned footers, on top of each other for the overlap.
 */

const DURATION = 260;
/** Points the arriving step travels. Small on purpose — this is a step inside a
 * flow, not a page push, so it should read as a settle rather than a slide. */
const OFFSET = 24;

type Direction = 'forward' | 'back';

const Step: React.FC<{
  direction: Direction;
  animate: boolean;
  children: React.ReactNode;
}> = ({ direction, animate, children }) => {
  // Starts at rest when there is nothing to animate, so the very first paint of
  // the screen is simply the screen — no fade to sit through.
  const progress = useSharedValue(animate ? 0 : 1);
  const from = direction === 'forward' ? OFFSET : -OFFSET;

  useEffect(() => {
    if (!animate) return;
    progress.value = withTiming(1, {
      duration: DURATION,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
  }, [animate, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateX: from * (1 - progress.value) }],
  }));

  return <Animated.View style={[{ flex: 1 }, style]}>{children}</Animated.View>;
};

interface StepTransitionProps {
  /** Identifies the step. A change remounts the subtree and replays the ease-in. */
  stepKey: string;
  /** Forward arrives from the right, back from the left, so the move has a direction. */
  direction: Direction;
  children: React.ReactNode;
}

const StepTransition: React.FC<StepTransitionProps> = ({ stepKey, direction, children }) => {
  // This component survives a step change — only `Step` below is re-keyed — so
  // it is the right place to remember that the screen has already been on
  // screen once. Arriving on the tab is not a step change, and animating it
  // made every visit to Raj Adhyayan open with a fade it had not earned.
  // `Step` reads `animate` only when it mounts, and it mounts anew exactly when
  // `stepKey` changes. So "has been on screen once" is "the key has changed at
  // least once". Noticing the change during render (React's documented
  // derive-state-from-props pattern) sets this before the first paint of the new
  // step, adds no extra render after first paint, and reads no ref while
  // rendering.
  const [seenKey, setSeenKey] = useState(stepKey);
  const [animate, setAnimate] = useState(false);
  if (seenKey !== stepKey) {
    setSeenKey(stepKey);
    setAnimate(true);
  }

  return (
    <Step key={stepKey} direction={direction} animate={animate}>
      {children}
    </Step>
  );
};

export default StepTransition;
