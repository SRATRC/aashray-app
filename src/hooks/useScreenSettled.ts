import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';

// Safety net only. transitionEnd fires on the screens this is used on (about
// 0.6 s on the iPhone SE, also for the first screen of a nested stack). It may
// not fire for a screen that was not animated in, so this caps the wait and the
// pop-up is never held back for good.
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
