import Constants from 'expo-constants';

/**
 * The three backends the app can talk to, and the one place that decides which
 * URL each one means. Nothing else builds a base URL.
 *
 * `qa` optionally targets one PR's preview deploy. The PR number is only read
 * when `qa` is selected, so switching to `prod` or `local` cannot accidentally
 * keep pointing at a preview.
 */
/** The three targets and their labels. One object, so the order and the names
 * cannot drift apart the way a parallel array and map would. */
export const BACKEND_LABELS = {
  prod: 'Prod',
  qa: 'QA',
  local: 'Local',
};

const PROD_URL = process.env.EXPO_PUBLIC_BASE_URL;
const QA_URL = process.env.EXPO_PUBLIC_QA_BASE_URL || process.env.EXPO_PUBLIC_DEV_BASE_URL;
export const DEFAULT_LOCAL_PORT = process.env.EXPO_PUBLIC_LOCAL_PORT;

/**
 * Host of the machine running Metro, so `local` reaches your laptop from the
 * iOS simulator, an Android emulator and a real device alike — `localhost` on a
 * phone means the phone. Falls back to localhost when Metro is not serving the
 * app, which is every release build, where `local` is not selectable anyway.
 */
const metroHost = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  return hostUri ? hostUri.split(':')[0] : 'localhost';
};

/** `port` comes from the in-app field. Blank falls back to the default rather
 * than building a portless URL. EXPO_PUBLIC_LOCAL_BASE_URL overrides the whole
 * thing, host included, for a backend that is not on this machine. */
const localUrl = (port) =>
  process.env.EXPO_PUBLIC_LOCAL_BASE_URL ||
  `http://${metroHost()}:${String(port || '').trim() || DEFAULT_LOCAL_PORT}/api/v1`;

/**
 * The base URL for a target. `qaPrNumber` is ignored unless the target is `qa`,
 * and `localPort` unless it is `local`.
 */
export const resolveBaseUrl = (backend, qaPrNumber, localPort) => {
  if (backend === 'local') return localUrl(localPort);
  if (backend === 'qa') {
    return qaPrNumber
      ? `https://aashray-backend-pr-${qaPrNumber}.onrender.com/api/v1`
      : QA_URL;
  }
  return PROD_URL;
};
