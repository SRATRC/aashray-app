import { Dimensions } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Localization from 'expo-localization';
import * as Network from 'expo-network';
import * as Updates from 'expo-updates';
import { Paths } from 'expo-file-system';
import * as Sentry from '@sentry/react-native';
import { BASE_URL, DEV_URL } from '../constants';
import { useDevStore, useAuthStore } from '../stores';

/**
 * Collects a best-effort diagnostic snapshot to attach to a support ticket.
 *
 * Every field group is independently guarded — a failure reading one group
 * (e.g. network state on an unsupported platform) never prevents the rest of
 * the snapshot from being collected, and this function itself never throws.
 */
/**
 * Races a promise against a timeout, resolving to `fallback` if the promise
 * does not settle in time. Guards against native calls that hang (rather than
 * reject) — a try/catch alone cannot recover from a promise that never
 * settles, which would otherwise block ticket creation indefinitely.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function collectDiagnostics(): Promise<Record<string, any>> {
  const [device, app, config, runtime, session, sentry] = await Promise.all([
    collectDevice(),
    collectApp(),
    collectConfig(),
    collectRuntime(),
    collectSession(),
    collectSentry(),
  ]);

  return { device, app, config, runtime, session, sentry };
}

const DEVICE_TYPE_NAMES: Record<number, string> = {
  0: 'unknown',
  1: 'phone',
  2: 'tablet',
  3: 'desktop',
  4: 'tv',
};

async function collectDevice(): Promise<Record<string, any>> {
  try {
    return {
      type: DEVICE_TYPE_NAMES[Device.deviceType as number] ?? 'unknown',
      brand: Device.brand ?? null,
      manufacturer: Device.manufacturer ?? null,
      model: Device.modelName ?? Device.modelId ?? null,
      isDevice: Device.isDevice ?? null,
      totalMemory: Device.totalMemory ?? null,
      osName: Device.osName ?? null,
      osVersion: Device.osVersion ?? null,
      androidApiLevel: Device.platformApiLevel ?? null,
    };
  } catch (e) {
    return {};
  }
}

function getJsEngine(): string | null {
  try {
    // @ts-ignore - HermesInternal is a Hermes-only global, not typed.
    if (typeof global.HermesInternal !== 'undefined') return 'hermes';
    return 'jsc';
  } catch (e) {
    return null;
  }
}

async function collectApp(): Promise<Record<string, any>> {
  try {
    return {
      version: Application.nativeApplicationVersion ?? null,
      buildNumber: Application.nativeBuildVersion ?? null,
      bundleId: Application.applicationId ?? null,
      expoSdkVersion: Constants.expoConfig?.sdkVersion ?? null,
      runtimeVersion: Updates.runtimeVersion ?? null,
      updateChannel: Updates.channel ?? null,
      updateId: Updates.updateId ?? null,
      jsEngine: getJsEngine(),
    };
  } catch (e) {
    return {};
  }
}

async function collectConfig(): Promise<Record<string, any>> {
  try {
    // Same dev-switch resolution logic as src/utils/HandleApiCall.js so the
    // reported base URL always matches where the request actually went.
    const { useDevBackend, devPrNumber } = useDevStore.getState();
    let resolvedBaseUrl = BASE_URL;

    if (useDevBackend) {
      if (devPrNumber) {
        resolvedBaseUrl = `https://aashray-backend-pr-${devPrNumber}.onrender.com/api/v1`;
      } else {
        resolvedBaseUrl = DEV_URL;
      }
    }

    return {
      useDevBackend: !!useDevBackend,
      devPrNumber: devPrNumber ?? '',
      resolvedBaseUrl: resolvedBaseUrl ?? null,
    };
  } catch (e) {
    return {};
  }
}

async function collectNetwork(): Promise<Record<string, any>> {
  try {
    const state = await withTimeout(Network.getNetworkStateAsync(), 1500, null);
    if (!state) return {};
    return {
      isConnected: state.isConnected ?? null,
      isInternetReachable: state.isInternetReachable ?? null,
      type: state.type ? String(state.type).toLowerCase() : null,
    };
  } catch (e) {
    return {};
  }
}

function collectScreen(): Record<string, any> {
  try {
    const { width, height, scale, fontScale } = Dimensions.get('window');
    return { width, height, scale, fontScale };
  } catch (e) {
    return {};
  }
}

function collectLocale(): Record<string, any> {
  try {
    const locale = Localization.getLocales()[0];
    const calendar = Localization.getCalendars()[0];
    return {
      locale: locale?.languageTag ?? null,
      region: locale?.regionCode ?? null,
      timezone: calendar?.timeZone ?? null,
    };
  } catch (e) {
    return {};
  }
}

function collectFreeDiskStorage(): number | null {
  try {
    return Paths.availableDiskSpace ?? null;
  } catch (e) {
    return null;
  }
}

async function collectRuntime(): Promise<Record<string, any>> {
  try {
    const network = await collectNetwork();
    const { locale, region, timezone } = collectLocale();

    return {
      network,
      locale,
      region,
      timezone,
      screen: collectScreen(),
      freeDiskStorage: collectFreeDiskStorage(),
    };
  } catch (e) {
    return {};
  }
}

function getLastRoute(): string | undefined {
  try {
    // Best-effort only: expo-router does not expose current pathname outside
    // of a React hook context, so this reaches into an internal (unstable)
    // module. Any failure here is swallowed and the field is simply omitted.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { store } = require('expo-router/build/global-state/router-store');
    const info = store?.getRouteInfo?.();
    return info?.pathname || info?.pathnameWithParams || undefined;
  } catch (e) {
    return undefined;
  }
}

async function collectSession(): Promise<Record<string, any>> {
  try {
    const { user } = useAuthStore.getState();
    let uptimeMs: number | null = null;
    try {
      uptimeMs = await withTimeout(Device.getUptimeAsync(), 1500, null);
    } catch (e) {
      uptimeMs = null;
    }

    return {
      cardno: user?.cardno ?? null,
      issuedto: user?.issuedto ?? null,
      lastRoute: getLastRoute() ?? null,
      filedAt: new Date().toISOString(),
      uptimeMs,
    };
  } catch (e) {
    return {};
  }
}

async function collectSentry(): Promise<Record<string, any>> {
  try {
    const lastEventId = typeof Sentry.lastEventId === 'function' ? Sentry.lastEventId() : null;
    return { lastEventId: lastEventId ?? null };
  } catch (e) {
    return { lastEventId: null };
  }
}
