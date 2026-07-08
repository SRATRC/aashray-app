// src/features/profile/screens/ProfileScreen.tsx
import { useState } from 'react';
import { Platform, RefreshControl, ActivityIndicator, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchProfile, logoutRequest } from '../api';
import ProfileHeader from '../components/ProfileHeader';
import ProfileMenuList from '../components/ProfileMenuList';
import ResetPasswordModal from '../components/ResetPasswordModal';
import type { Profile } from '../types';

import { useBottomTabOverflow } from '@/components/TabBarBackground';
import { useAuthStore } from '@/stores';
import { invalidateCachedImage } from '@/utils/imageCache';

const ProfileScreen: React.FC = () => {
  const user = useAuthStore((state) => state.user) as Profile;
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const tabBarHeight = useBottomTabOverflow();

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  const refreshUserData = async () => {
    if (!user) return;

    setIsRefreshing(true);
    try {
      const result = await fetchProfile(user.cardno);
      if (result.pfp && result.pfp !== user.pfp) {
        await invalidateCachedImage(user.pfp!);
      }
      setUser({ ...user, ...result });
    } catch {
      // apiClient already surfaced the error toast/haptic
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    if (isLogoutLoading || !user) return;

    setIsLogoutLoading(true);
    try {
      await logoutRequest(user.cardno);
      logout();
    } catch {
      // apiClient already surfaced the error toast/haptic
    } finally {
      setIsLogoutLoading(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF9500" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-full bg-gray-50" edges={['top']}>
      <View className="h-full w-full">
        <KeyboardAwareScrollView
          className="h-full"
          contentContainerStyle={{
            paddingBottom: Platform.OS === 'ios' ? tabBarHeight + 20 : 20,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshUserData} />}>
          <ProfileHeader user={user} />

          <ProfileMenuList
            user={user}
            onResetPassword={() => setPasswordModalVisible(true)}
            onRefreshUser={refreshUserData}
            onLogout={handleLogout}
            isLogoutLoading={isLogoutLoading}
          />
        </KeyboardAwareScrollView>

        <ResetPasswordModal
          visible={passwordModalVisible}
          onClose={() => setPasswordModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;
