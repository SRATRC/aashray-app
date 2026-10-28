import React from 'react';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { ShadowBox } from '@/src/components/ShadowBox';
import { useUpdateStore } from '@/src/stores';

// The server sends Android's minimum OS as an API level ("26"); show the version name.
const ANDROID_VERSIONS: Record<string, string> = {
  '23': '6.0',
  '24': '7.0',
  '25': '7.1',
  '26': '8.0',
  '27': '8.1',
  '28': '9',
  '29': '10',
  '30': '11',
  '31': '12',
  '32': '12L',
  '33': '13',
  '34': '14',
  '35': '15',
  '36': '16',
};

// "28.0" -> "iOS 28", "16.4" -> "iOS 16.4", "26" -> "Android 8.0"; null when unknown.
const getOsName = (minOs: string | null): string | null => {
  if (!minOs) return null;
  if (Platform.OS === 'android') {
    const name = ANDROID_VERSIONS[minOs.trim().split('.')[0]];
    return name ? `Android ${name}` : null;
  }
  const version = minOs.trim().replace(/(\.0)+$/, '');
  return /^\d+(\.\d+)*$/.test(version) ? `iOS ${version}` : null;
};

// Shown on Profile when this phone's OS can't install the required release.
// The launch check never interrupts these members; this is the only place they see it.
const UnsupportedDeviceBanner: React.FC = () => {
  const unsupported = useUpdateStore((state) => state.unsupported);
  if (!unsupported) return null;

  const { minOsVersion, updateVersion, storeUrl } = unsupported;
  const osName = getOsName(minOsVersion);
  const updateYourPhone = osName
    ? `update your phone to ${osName} or later.`
    : "update your phone's software if you can.";
  const message = updateVersion
    ? `Version ${updateVersion} is the newest one your phone can install. For later versions, ${updateYourPhone}`
    : `You can keep using this version. To get new features, ${updateYourPhone}`;

  return (
    <ShadowBox className="mb-4 rounded-2xl border border-gray-200/60 bg-white p-4" intensity="sm">
      <View className="flex-row gap-x-3">
        <Feather name="smartphone" size={20} color="#4B5563" style={{ marginTop: 1 }} />
        <View className="flex-1">
          <Text className="font-psemibold text-[15px] text-gray-800">
            Your phone can&apos;t get the newest version
          </Text>
          <Text className="mt-1 font-pregular text-sm leading-5 text-gray-500">{message}</Text>
          {updateVersion && (
            <TouchableOpacity
              onPress={() => Linking.openURL(storeUrl)}
              className="mt-3 self-start rounded-full bg-secondary px-4 py-2"
              activeOpacity={0.8}
              accessibilityRole="button">
              <Text className="font-psemibold text-sm text-white">Update to {updateVersion}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ShadowBox>
  );
};

export default UnsupportedDeviceBanner;
