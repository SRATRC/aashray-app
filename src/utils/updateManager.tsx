import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { isNewerVersion } from '@/src/utils/version';
import { BASE_URL } from '@/src/constants';
import { getSnoozeUntil, setSnoozeUntil } from '@/src/utils/updatePrefs';
import UpdateModal, { UpdateInfo } from '@/src/components/UpdateModal';
import CustomAlert from '@/src/components/CustomAlert';
import '@/src/utils/deviceHeaders';
import axios from 'axios';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import * as Linking from 'expo-linking';

interface ApiResponse {
  message?: string;
  data?: {
    latestVersion?: string;
    mandatory?: boolean;
    releaseNotes?: string;
    // Server-side decision for this device; absent on older backends.
    updateType?: 'none' | 'optional' | 'forced' | 'unsupported';
    targetVersion?: string | null;
    androidUrl?: string; // optional override
    iosUrl?: string; // optional override
  };
}

const getStoreUrl = (api?: ApiResponse['data']) => {
  // Prefer API-provided URLs if present
  if (Platform.OS === 'android') {
    return (
      api?.androidUrl ||
      process.env.EXPO_PUBLIC_ANDROID_STORE_URL ||
      'https://play.google.com/store/apps/details?id=org.vitraagvigyaan.aashray'
    );
  }
  return (
    api?.iosUrl ||
    process.env.EXPO_PUBLIC_IOS_STORE_URL ||
    'https://apps.apple.com/in/app/vitraag-vigyaan-aashray/id6743924565'
  );
};

const fetchUpdateInfo = async (): Promise<{
  info: UpdateInfo | null;
  raw?: ApiResponse['data'];
}> => {
  try {
    const res = await axios.get<ApiResponse>(`${BASE_URL}/updates`, {
      params: { os: Platform.OS },
      timeout: 8000,
      validateStatus: () => true,
    });
    if (res.status !== 200 || !res.data?.data?.latestVersion) {
      return { info: null };
    }
    const d = res.data.data;
    // The newest version this device can install may be older than the latest.
    const version = d.targetVersion || d.latestVersion;
    return {
      info: {
        latestVersion: version,
        mandatory: d.updateType ? d.updateType === 'forced' : !!d.mandatory,
        releaseNotes: d.releaseNotes || '',
      },
      raw: d,
    };
  } catch (e) {
    // Silent fail – do not show toast on startup
    return { info: null };
  }
};

const getCurrentAppVersion = (): string | null => {
  // Prefer native version if available
  const nativeVersion = Application.nativeApplicationVersion;
  if (nativeVersion) return nativeVersion;
  const configVersion = Constants.expoConfig?.version || Constants.expoConfig?.runtimeVersion;
  const envVersion = process.env.EXPO_PUBLIC_APP_VERSION;
  return configVersion || envVersion || null;
};

// Snooze non-blocking prompts until tomorrow 00:00 local time.
const snoozeUntilTomorrow = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  setSnoozeUntil(tomorrow.getTime());
};

export const UpdateManager: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [visible, setVisible] = useState(false);
  const [rawData, setRawData] = useState<ApiResponse['data'] | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const { info, raw } = await fetchUpdateInfo();
      if (!mounted || !info) return;

      const currentVersion = getCurrentAppVersion();
      if (!currentVersion) return; // can't compare reliably

      // Respect snooze for optional updates
      if (!info.mandatory) {
        const snoozeUntil = getSnoozeUntil();
        if (snoozeUntil && Date.now() < snoozeUntil) return;
      }

      const updateType = raw?.updateType;
      if (updateType === 'unsupported' && !isNewerVersion(info.latestVersion, currentVersion)) {
        // Nothing newer installs on this OS: tell them, never block.
        CustomAlert.alert(
          "Your phone can't get the latest update",
          "Your phone's software is too old for the newest version of the app. You can keep using this version. To get new features, update your phone's software if you can.",
          [{ text: 'OK', onPress: snoozeUntilTomorrow }]
        );
        return;
      }

      // Trust the server's decision when it sends one; older backends don't.
      const show = updateType
        ? updateType !== 'none'
        : isNewerVersion(info.latestVersion, currentVersion);
      if (show) {
        setUpdateInfo(info);
        setRawData(raw);
        setVisible(true);
      }
    };
    check();
    return () => {
      mounted = false;
    };
  }, []);

  const handleUpdateNow = () => {
    const url = getStoreUrl(rawData);
    Linking.openURL(url);
  };

  const handleDismiss = () => {
    // Only for optional updates
    snoozeUntilTomorrow();
    setVisible(false);
  };

  if (!updateInfo) return null;

  return (
    <UpdateModal
      visible={visible}
      info={updateInfo}
      onUpdateNow={handleUpdateNow}
      onDismiss={!updateInfo.mandatory ? handleDismiss : undefined}
    />
  );
};

export default UpdateManager;
