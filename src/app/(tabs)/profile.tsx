import React, { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  Platform,
  TouchableOpacity,
  Modal,
  Image,
  Keyboard,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { icons } from '@/src/constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/stores';
import { useRouter, useFocusEffect } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Feather, FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useBottomTabOverflow } from '@/src/components/TabBarBackground';
import getCachedImageUri, { invalidateCachedImage } from '@/src/utils/imageCache';
import { useQuickImagePicker } from '@/src/hooks/useQuickImagePicker';
import Toast from 'react-native-toast-message';
import handleAPICall from '@/src/utils/HandleApiCall';
import FormField from '@/src/components/FormField';
import CustomModal from '@/src/components/CustomModal';
import * as Haptics from 'expo-haptics';

const Profile: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const tabBarHeight = useBottomTabOverflow();

  const { pickAndUpload, isUploading, uploadProgress, uploadError } = useQuickImagePicker();

  const router: any = useRouter();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [creditsInfoModalVisible, setCreditsInfoModalVisible] = useState(false);
  const [cachedImageUri, setCachedImageUri] = useState('');
  const [previousPfpUrl, setPreviousPfpUrl] = useState('');

  const formatNameWithMehta = (name: string) => {
    if (!name) return '';
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) {
      return `${nameParts[0]} Mehta`;
    }
    const lastIndex = nameParts.length - 1;
    nameParts.splice(lastIndex, 0, 'Mehta');
    return nameParts.join(' ');
  };

  useEffect(() => {
    const loadCachedImage = async () => {
      if (user?.pfp) {
        if (user.pfp !== previousPfpUrl) {
          const uri = await getCachedImageUri(user.pfp);
          setCachedImageUri(uri);
          setPreviousPfpUrl(user.pfp);
        }
      }
    };

    loadCachedImage();
  }, [user?.pfp, previousPfpUrl]);

  useFocusEffect(
    useCallback(() => {
      const checkProfileUpdate = async () => {
        if (user?.pfp && previousPfpUrl && user.pfp !== previousPfpUrl) {
          await invalidateCachedImage(previousPfpUrl);
          const uri = await getCachedImageUri(user.pfp);
          setCachedImageUri(uri);
          setPreviousPfpUrl(user.pfp);
        }
      };

      checkProfileUpdate();
    }, [user?.pfp, previousPfpUrl])
  );

  const handleResetPassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: 'All fields are required',
        swipeable: false,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: 'Passwords do not match',
        text2: 'New password and confirmation must match',
        swipeable: false,
      });
      return;
    }

    setIsLoading(true);

    const onSuccess = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsLoading(false);
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      Toast.show({
        type: 'success',
        text1: 'Password updated successfully',
        swipeable: false,
      });
    };

    await handleAPICall(
      'POST',
      '/client/updatePassword',
      null,
      {
        cardno: user?.cardno,
        current_password: currentPassword.trim(),
        new_password: newPassword.trim(),
      },
      onSuccess,
      () => {
        setIsLoading(false);
      }
    );
  };

  const closePasswordModal = () => {
    setPasswordModalVisible(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    Keyboard.dismiss();
  };

  const refreshUserData = async () => {
    if (!user) return;

    setIsRefreshing(true);
    await handleAPICall(
      'GET',
      '/profile',
      { cardno: user.cardno },
      null,
      async (data: any) => {
        if (data.data.pfp && data.data.pfp !== user.pfp) {
          await invalidateCachedImage(user.pfp);
        }

        const updatedUser = { ...user, ...data.data };
        setUser(updatedUser);
      },
      () => {
        setIsRefreshing(false);
      }
    );
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
        setPasswordModalVisible(true);
      },
    },
    {
      name: 'Logout',
      icon: icons.logout,
      onPress: async () => {
        if (isLogoutLoading || !user) return;

        try {
          setIsLogoutLoading(true);

          const onSuccess = async (_data: any) => {
            logout();
          };

          await handleAPICall(
            'GET',
            '/client/logout',
            { cardno: user.cardno },
            null,
            onSuccess,
            () => {
              setIsLogoutLoading(false);
            }
          );
        } catch (error: any) {
          setIsLogoutLoading(false);
          Toast.show({
            type: 'error',
            text1: 'An error occurred!',
            text2: error.message,
            swipeable: false,
          });
        }
      },
    },
  ];

  const renderItem = ({ item }: { item: any }) => {
    const isLogoutItem = item.name === 'Logout';
    const isDisabled = isLogoutItem && isLogoutLoading;

    return (
      <TouchableOpacity
        className={`mb-5 rounded-2xl p-4 ${
          Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'
        } mx-4 flex flex-row items-center justify-between bg-white ${
          isDisabled ? 'opacity-50' : ''
        }`}
        onPress={item.onPress}
        disabled={isDisabled}>
        <View className="flex-row items-center gap-x-4">
          <Image
            source={item.icon}
            className="h-6 w-6"
            resizeMode="contain"
            style={isDisabled ? { tintColor: '#9CA3AF' } : {}}
          />
          <Text className={`font-pregular text-base ${isDisabled ? 'text-gray-400' : ''}`}>
            {item.name}
          </Text>
        </View>
        {isLogoutItem && isLogoutLoading ? (
          <ActivityIndicator size="small" color="#FF9500" />
        ) : (
          <View className="rounded-lg bg-secondary-50 p-2">
            <Image source={icons.yellowArrowRight} className="h-3 w-3" resizeMode="contain" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    return (
      <View className="mb-10 mt-8 flex-col items-center justify-center">
        <View className="relative">
          {/* Profile Image Container */}
          <View className="relative">
            <Image
              source={{ uri: cachedImageUri }}
              className="h-[150] w-[150] rounded-full border-2 border-secondary"
              resizeMode="cover"
              onError={() => {
                if (user?.pfp) {
                  getCachedImageUri(user.pfp).then((uri) => setCachedImageUri(uri));
                }
              }}
            />

            {/* Upload Progress Overlay */}
            {isUploading && (
              <View className="absolute inset-0 h-[150] w-[150] items-center justify-center rounded-full bg-black/50">
                <View className="items-center">
                  <ActivityIndicator size="large" color="white" />
                  <Text className="mt-2 text-sm font-medium text-white">Uploading...</Text>
                  <Text className="text-xs text-white">{uploadProgress}%</Text>

                  {/* Progress Bar */}
                  <View className="mt-2 h-1 w-20 rounded-full bg-white/30">
                    <View
                      className="h-1 rounded-full bg-white transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={pickAndUpload}
            className="absolute bottom-[5px] right-[5px] h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-secondary shadow-lg shadow-black/20"
            activeOpacity={0.8}
            disabled={isUploading}>
            <Feather name="edit-2" size={14} color="white" />
          </TouchableOpacity>
        </View>

        {/* Upload Error Display */}
        {uploadError && (
          <View className="mt-3 px-4">
            <Text className="text-center text-sm text-red-500">Upload failed: {uploadError}</Text>
          </View>
        )}

        <Text className="mt-3 font-psemibold text-base">
          {formatNameWithMehta(user?.issuedto || '')}
        </Text>

        <View className="mt-8 w-full px-4">
          <View
            className={`rounded-3xl border border-gray-200/80 bg-white p-6 ${
              Platform.OS === 'ios' ? 'shadow-lg shadow-gray-100/80' : 'shadow-2xl shadow-gray-200'
            }`}>
            {/* Header */}
            <View className="flex-row items-start justify-between">
              <Text className="font-psemibold text-lg text-gray-700">Available Credits</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCreditsInfoModalVisible(true);
                }}
                className="rounded-full p-1.5"
                activeOpacity={0.7}>
                <Feather name="info" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Separator */}
            <View className="my-4 h-px bg-gray-200" />

            {/* Credit Breakdown */}
            <View className="gap-y-4">
              {/* Room Credits */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-3">
                  <FontAwesome name="bed" size={20} color="#4B5563" />
                  <Text className="font-pmedium text-base text-gray-700">Stay</Text>
                </View>
                <Text className="font-psemibold text-base text-gray-800">
                  {user?.credits?.room || 0}
                </Text>
              </View>
              {/* Travel Credits */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-3">
                  <FontAwesome name="taxi" size={20} color="#4B5563" />
                  <Text className="font-pmedium text-base text-gray-700">Travel</Text>
                </View>
                <Text className="font-psemibold text-base text-gray-800">
                  {user?.credits?.travel || 0}
                </Text>
              </View>
              {/* Food Credits */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-3">
                  <Ionicons name="fast-food" size={20} color="#4B5563" />
                  <Text className="font-pmedium text-base text-gray-700">Food</Text>
                </View>
                <Text className="font-psemibold text-base text-gray-800">
                  {user?.credits?.food || 0}
                </Text>
              </View>
              {/* Utsav Credits */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-3">
                  <MaterialIcons name="festival" size={20} color="#4B5563" />
                  <Text className="font-pmedium text-base text-gray-700">Utsav</Text>
                </View>
                <Text className="font-psemibold text-base text-gray-800">
                  {user?.credits?.utsav || 0}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Add safety check for user
  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF9500" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-full bg-white" edges={['top']}>
      <View className="h-full w-full">
        <FlashList
          className="h-full py-2"
          contentContainerStyle={{
            paddingBottom: Platform.OS === 'ios' ? tabBarHeight + 20 : 20,
          }}
          showsVerticalScrollIndicator={false}
          data={profileList}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          estimatedItemSize={6}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshUserData} />}
        />

        {/* Password Reset Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          statusBarTranslucent={true}
          visible={passwordModalVisible}
          onRequestClose={closePasswordModal}>
          <KeyboardAwareScrollView
            className="flex-1 bg-black/50"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 16,
            }}>
            <View className="w-full max-w-sm rounded-2xl bg-white">
              <View className="p-6">
                <Text className="mb-1 flex-1 font-psemibold text-xl text-gray-800">
                  Reset Password
                </Text>

                <Text className="mb-6 mt-1 font-pregular text-sm text-gray-500">
                  Choose a new, strong password that you don&apos;t use for other websites.
                </Text>

                <FormField
                  text="Current Password"
                  value={currentPassword}
                  placeholder="Enter current password"
                  handleChangeText={setCurrentPassword}
                  otherStyles="mb-4"
                  containerStyles="bg-gray-100 border-gray-200"
                  inputStyles="font-pmedium text-base text-black"
                  isPassword={true}
                />

                <FormField
                  text="New Password"
                  value={newPassword}
                  placeholder="Enter new password"
                  handleChangeText={setNewPassword}
                  otherStyles="mb-4"
                  containerStyles="bg-gray-100 border-gray-200"
                  inputStyles="font-pmedium text-base text-black"
                  isPassword={true}
                />

                <FormField
                  text="Confirm Password"
                  value={confirmPassword}
                  placeholder="Confirm new password"
                  handleChangeText={setConfirmPassword}
                  otherStyles="mb-8"
                  containerStyles="bg-gray-100 border-gray-500"
                  inputStyles="font-pmedium text-base text-black"
                  isPassword={true}
                />

                <View className="flex-row gap-x-3">
                  <TouchableOpacity
                    className="h-12 flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white"
                    onPress={closePasswordModal}
                    activeOpacity={0.8}>
                    <Text className="font-psemibold text-base text-gray-700">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={`h-12 flex-1 items-center justify-center rounded-xl ${
                      isLoading ? 'bg-gray-400' : 'bg-secondary'
                    }`}
                    onPress={handleResetPassword}
                    disabled={isLoading}
                    activeOpacity={0.8}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="font-psemibold text-base text-white">Update</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAwareScrollView>
        </Modal>

        {/* Credits Info Modal */}
        <CustomModal
          visible={creditsInfoModalVisible}
          onClose={() => setCreditsInfoModalVisible(false)}
          title="About Credits"
          btnText="Got it"
          scrollable={true}
          showCloseButton={true}>
          <>
            <View className="mb-4">
              <Text className="mb-2 font-psemibold text-base text-gray-800">Credit Value</Text>
              <Text className="font-pregular text-sm leading-5 text-gray-600">1 Credit = ₹1</Text>
            </View>
            <View className="mb-4">
              <Text className="mb-2 font-psemibold text-base text-gray-800">
                How to get Credits?
              </Text>
              <Text className="font-pregular text-sm leading-5 text-gray-600">
                You can earn credits only when a booking is canceled after the payment for that
                booking has been completed.
              </Text>
            </View>
            <View>
              <Text className="mb-2 font-psemibold text-base text-gray-800">How to Use?</Text>
              <Text className="font-pregular text-sm leading-5 text-gray-600">
                When you make a booking for a Room / Flat, Travel and Guest Food, any available
                credits in your account will be automatically applied at checkout.
              </Text>
            </View>
            <View className="mt-4 border-t border-gray-200 pt-4">
              <Text className="font-pregular text-sm leading-5 text-rose-600">
                Credits are non-refundable, non-transferable, and cannot be converted to cash.
              </Text>
            </View>
          </>
        </CustomModal>
      </View>
    </SafeAreaView>
  );
};

export default Profile;
