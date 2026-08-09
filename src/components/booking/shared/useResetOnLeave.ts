import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';

/**
 * Run `reset` once this screen is off screen — and not one frame before.
 *
 * Neither end of a navigation is safe on its own. Resetting on focus is visible
 * through an interactive back swipe: the gesture reveals the screen and drags it
 * under the finger while it still holds the old state, and focus only fires when
 * the gesture commits. Resetting on blur is visible the other way: blur fires as
 * the pushed screen *starts* sliding in, so the reset flashes behind it.
 *
 * `runAfterInteractions` waits for the transition to finish, which is the first
 * moment the screen is genuinely covered. Coming back before it runs cancels it,
 * so a fast return keeps what you had rather than wiping it while you look at it.
 */
export default function useResetOnLeave(reset: () => void) {
  // Held in a ref so the effect below never depends on a changing callback —
  // callers pass an inline arrow, and re-subscribing on every render would
  // cancel a pending reset each time the screen re-rendered.
  const resetRef = useRef(reset);
  resetRef.current = reset;

  const pending = useRef<{ cancel: () => void } | null>(null);

  useEffect(() => () => pending.current?.cancel(), []);

  useFocusEffect(
    useCallback(() => {
      pending.current?.cancel();
      pending.current = null;
      return () => {
        pending.current = InteractionManager.runAfterInteractions(() => {
          pending.current = null;
          resetRef.current();
        });
      };
    }, [])
  );
}
