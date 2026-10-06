import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';

// Longest we wait for the push animation. The stack's transitionEnd event does
// not fire for a screen that was not animated in (first route, no animation),
// so this keeps the pop-up from being held back for good.
const FALLBACK_MS = 1200;

/**
 * True once this screen has finished sliding in.
 *
 * Why: a React Native <Modal> asked to present while its screen is still
 * mid-push on iOS never appears, yet still swallows every touch, so the
 * member is stuck. A fast reply (the booking check on a quick connection)
 * lands inside the animation. Render the pop-up only when this returns true.
 */
export default function useScreenSettled(): boolean {
  const navigation = useNavigation();
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (settled) return;
    const unsubscribe = navigation.addListener(
      'transitionEnd' as never,
      ((e: { data?: { closing?: boolean } }) => {
        if (!e?.data?.closing) setSettled(true);
      }) as never
    );
    const timer = setTimeout(() => setSettled(true), FALLBACK_MS);
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [navigation, settled]);

  return settled;
}
