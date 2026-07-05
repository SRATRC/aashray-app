import { BASE_URL, DEV_URL } from '@/src/constants';
import { useDevStore } from '@/src/stores';

// Single source of truth for resolving the API base URL from the dev-backend
// toggle. Call this fresh at the point of use (not once and cached in a
// closure) so a mid-session dev-backend toggle is picked up immediately.
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
