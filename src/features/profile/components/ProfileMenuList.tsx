// src/features/profile/components/ProfileMenuList.tsx
import { Feather, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import React from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Switch,
  TextInput,
} from 'react-native';
import Toast from 'react-native-toast-message';

import type { Profile } from '../types';

import { ShadowBox } from '@/components/ShadowBox';
import { icons } from '@/constants';
import { useDevStore } from '@/stores';

interface ProfileMenuListProps {
  user: Profile;
  onResetPassword: () => void;
  onRefreshUser: () => Promise<void>;
  onLogout: () => void;
  isLogoutLoading: boolean;
}

const ProfileMenuList: React.FC<ProfileMenuListProps> = ({
  user,
  onResetPassword,
  onRefreshUser,
  onLogout,
  isLogoutLoading,
}) => {
  const router: any = useRouter();
  const { useDevBackend, setUseDevBackend, devPrNumber, setDevPrNumber } = useDevStore();

  const handleToggleDevBackend = (value: boolean) => {
    setUseDevBackend(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Toast.show({
      type: 'success',
      text1: 'Environment Updated',
      text2: `Switched to ${value ? 'Development' : 'Production'}`,
    });
    onRefreshUser().then(() => {
      Updates.reloadAsync();
    });
  };

  const profileList: any = [
    {
      name: 'Profile Details',
      icon: icons.profileCircle,
      onPress: () => {
        router.push('/profile/profileDetails');
      },
    },
    {
      name: 'Transaction History',
      icon: icons.transactions,
      onPress: () => {
        router.push('/profile/transactions');
      },
    },
    {
      name: 'Reset Password',
      icon: icons.resetPassword,
      onPress: () => {
        onResetPassword();
      },
    },
    ...(user?.showDevelopmentDashboard
      ? [
          {
            name: 'Use Development Backend',
            icon: <MaterialIcons name="developer-mode" size={22} color="#4B5563" />,
            type: 'switch',
            value: useDevBackend,
            onValueChange: handleToggleDevBackend,
          },
          ...(useDevBackend
            ? [
                {
                  name: 'PR Number',
                  icon: <FontAwesome name="code-fork" size={22} color="#4B5563" />,
                  type: 'input',
                  value: devPrNumber,
                  onChangeText: setDevPrNumber,
                  placeholder: 'Enter PR Number (e.g. 230)',
                },
              ]
            : []),
        ]
      : []),
  ];

  const renderMenuItem = (item: any, index: number, isLast: boolean) => {
    const isSwitch = item.type === 'switch';
    const isInput = item.type === 'input';

    const content = (
      <>
        <View className="flex-row items-center gap-x-3">
          {React.isValidElement(item.icon) ? (
            item.icon
          ) : (
            <Image source={item.icon} className="h-[22] w-[22]" resizeMode="contain" />
          )}
          <Text className="font-pmedium text-[15px] text-gray-700">{item.name}</Text>
        </View>
        {isSwitch ? (
          <Switch
            value={item.value}
            onValueChange={item.onValueChange}
            trackColor={{ false: '#E5E7EB', true: '#F1AC09' }}
            thumbColor="#fff"
            ios_backgroundColor="#E5E7EB"
          />
        ) : isInput ? (
          <View className="flex-1">
            <TextInput
              value={item.value}
              onChangeText={item.onChangeText}
              placeholder={item.placeholder}
              keyboardType="numeric"
              className="text-right font-pmedium text-sm text-gray-800"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        ) : (
          <Feather name="chevron-right" size={20} color="#C5C8CD" />
        )}
      </>
    );

    if (isSwitch || isInput) {
      return (
        <View key={item.name}>
          <View className="flex-row items-center justify-between px-4 py-4">{content}</View>
          {!isLast && <View className="ml-[52] mr-4 h-px bg-gray-200/60" />}
        </View>
      );
    }

    return (
      <View key={item.name}>
        <TouchableOpacity
          className="flex-row items-center justify-between px-4 py-4"
          onPress={item.onPress}
          activeOpacity={0.5}>
          {content}
        </TouchableOpacity>
        {!isLast && <View className="ml-[52] mr-4 h-px bg-gray-200/60" />}
      </View>
    );
  };

  return (
    <>
      {/* Menu Items - Grouped Card */}
      <View className="px-4">
        <ShadowBox
          className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white"
          intensity="sm">
          {profileList.map((item: any, index: number) =>
            renderMenuItem(item, index, index === profileList.length - 1)
          )}
        </ShadowBox>
      </View>

      {/* Logout - Separated */}
      <View className="mt-4 px-4">
        <ShadowBox
          className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white"
          intensity="sm"
          interactive
          onPress={onLogout}
          isDisabled={isLogoutLoading}>
          <View className="flex-row items-center justify-between px-4 py-4">
            <View className="flex-row items-center gap-x-3">
              <Feather name="log-out" size={20} color="#EF4444" />
              <Text className="font-pmedium text-[15px] text-red-500">Logout</Text>
            </View>
            {isLogoutLoading ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Feather name="chevron-right" size={20} color="#FCA5A5" />
            )}
          </View>
        </ShadowBox>
      </View>
    </>
  );
};

export default ProfileMenuList;
