import { useEffect, useRef, useState } from 'react';

/**
 * A loading flag that refuses to flicker.
 *
 * Two rules, and both are needed. A skeleton that appears for 120ms and
 * vanishes is worse than no skeleton at all — it reads as a glitch rather than
 * as progress. But only delaying is not enough either: a call that lands at
 * 260ms would show the skeleton for 10ms, which is the same flash moved later.
 *
 *  - `delay`      wait this long before showing anything. Most calls finish
 *                 first and the user sees no loading state at all.
 *  - `minVisible` once shown, stay shown at least this long, so it always reads
 *                 as a deliberate state.
 *
 * Worst case a fast-but-not-instant call is held ~150ms longer than the network
 * needed. That is the price of never flashing, and it is the right trade for a
 * whole-screen skeleton.
 */
export default function useDelayedFlag(
  active: boolean,
  { delay = 250, minVisible = 400 }: { delay?: number; minVisible?: number } = {}
) {
  const [shown, setShown] = useState(false);
  const shownAt = useRef(0);

  useEffect(() => {
    // Already showing and still loading: nothing to schedule.
    if (active && shown) return;

    if (active) {
      const timer = setTimeout(() => {
        shownAt.current = Date.now();
        setShown(true);
      }, delay);
      return () => clearTimeout(timer);
    }

    if (!shown) return;

    const remaining = minVisible - (Date.now() - shownAt.current);
    if (remaining <= 0) {
      setShown(false);
      return;
    }
    const timer = setTimeout(() => setShown(false), remaining);
    return () => clearTimeout(timer);
  }, [active, shown, delay, minVisible]);

  return shown;
}
