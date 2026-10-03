import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Refetches on every screen focus except the very first one.
 *
 * Query defaults don't refetch on focus, so without this, returning to a
 * screen after data changed elsewhere would show stale data until a manual
 * pull-to-refresh. The first focus fires immediately on mount alongside the
 * query's own fetch-on-mount — without skipping it, that would double the
 * initial request.
 */
export function useRefetchOnFocus(refetch: () => void) {
  const isInitialFocusRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isInitialFocusRef.current) {
        isInitialFocusRef.current = false;
        return;
      }
      refetch();
    }, [refetch])
  );
}
