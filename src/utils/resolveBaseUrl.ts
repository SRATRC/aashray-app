import { BASE_URL, DEV_URL } from '@/constants';
import { useDevStore } from '@/stores';

// Resolves the API base URL from the dev-backend toggle. Used by
// HandleApiCall.js, useTicketStream.ts, and collectDiagnostics.ts — new
// call sites needing this logic should use this instead of re-deriving it
// (some pre-existing code, e.g. updateManager.tsx, still reads BASE_URL
// directly and isn't routed through here). Call this fresh at the point of
// use (not once and cached in a closure) so a mid-session dev-backend toggle
// is picked up immediately.
export function resolveApiBaseUrl(): string | undefined {
  const { useDevBackend, devPrNumber } = useDevStore.getState();

  if (useDevBackend) {
    if (devPrNumber) {
      return `https://aashray-backend-pr-${devPrNumber}.onrender.com/api/v1`;
    }
    return DEV_URL;
  }

  return BASE_URL;
}
