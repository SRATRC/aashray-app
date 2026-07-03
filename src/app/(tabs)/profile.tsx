import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Text,
  View,
  Platform,
  TouchableOpacity,
  Modal,
  Image,
  RefreshControl,
  ActivityIndicator,
  Switch,
  TextInput,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  Keyboard,
} from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardController,
  useKeyboardController,
} from 'react-native-keyboard-controller';
import { icons } from '@/src/constants';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore, useDevStore } from '@/src/stores';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather, FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useBottomTabOverflow } from '@/src/components/TabBarBackground';
import getCachedImageUri, { invalidateCachedImage } from '@/src/utils/imageCache';
import { useQuickImagePicker } from '@/src/hooks/useQuickImagePicker';
import { ShadowBox } from '@/src/components/ShadowBox';
import Toast from 'react-native-toast-message';
import handleAPICall from '@/src/utils/HandleApiCall';
import FormField from '@/src/components/FormField';
import CustomModal from '@/src/components/CustomModal';
import * as Haptics from 'expo-haptics';
import * as Updates from 'expo-updates';

const { height: screenHeight } = Dimensions.get('window');

const Profile: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const tabBarHeight = useBottomTabOverflow();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const { setEnabled } = useKeyboardController();

  const { pickAndUpload, isUploading, uploadProgress, uploadError } = useQuickImagePicker();
  const { useDevBackend, setUseDevBackend, devPrNumber, setDevPrNumber } = useDevStore();

  const router: any = useRouter();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Keyboard listeners for password modal — uses willShow/willHide on iOS
  // to avoid flicker when switching between fields
  useEffect(() => {
    if (!passwordModalVisible) return;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      Animated.timing(keyboardOffset, {
        toValue: -e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? e.duration : 200,
        useNativeDriver: true,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      Animated.timing(keyboardOffset, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e.duration : 200,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [passwordModalVisible, keyboardOffset]);
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

      // Dismiss keyboard and animate modal closed, then show toast after modal is fully gone
      KeyboardController.dismiss();
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setPasswordModalVisible(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setEnabled(true);
        keyboardOffset.setValue(0);

        Toast.show({
          type: 'success',
          text1: 'Password updated successfully',
          swipeable: false,
        });
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

  const openPasswordModal = () => {
    setEnabled(false);
    setPasswordModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closePasswordModal = () => {
    KeyboardController.dismiss();
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setEnabled(true);
      keyboardOffset.setValue(0);
    });
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

  const handleToggleDevBackend = (value: boolean) => {
    setUseDevBackend(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Toast.show({
      type: 'success',
      text1: 'Environment Updated',
      text2: `Switched to ${value ? 'Development' : 'Production'}`,
    });
    refreshUserData().then(() => {
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
        openPasswordModal();
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

  const handleLogout = async () => {
    if (isLogoutLoading || !user) return;

    try {
      setIsLogoutLoading(true);

      const onSuccess = async (_data: any) => {
        logout();
      };

      await handleAPICall('GET', '/client/logout', { cardno: user.cardno }, null, onSuccess, () => {
        setIsLogoutLoading(false);
      });
    } catch (error: any) {
      setIsLogoutLoading(false);
      Toast.show({
        type: 'error',
        text1: 'An error occurred!',
        text2: error.message,
        swipeable: false,
      });
    }
  };

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

  const renderHeader = () => {
    return (
      <View className="mb-6 mt-6 flex-col items-center justify-center">
        <View className="relative">
          {/* Profile Image Container with ring */}
          <View className="relative items-center justify-center rounded-full border-[3px] border-secondary p-1">
            <Image
              source={{ uri: cachedImageUri }}
              className="h-[140] w-[140] rounded-full"
              resizeMode="cover"
              onError={() => {
                if (user?.pfp) {
                  getCachedImageUri(user.pfp).then((uri) => setCachedImageUri(uri));
                }
              }}
            />

            {/* Upload Progress Overlay */}
            {isUploading && (
              <View className="absolute inset-0 m-1 items-center justify-center rounded-full bg-black/50">
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
            className="absolute bottom-[2px] right-[2px] h-11 w-11 items-center justify-center rounded-full border-[2.5px] border-gray-50 bg-secondary"
            activeOpacity={0.8}
            disabled={isUploading}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 4,
            }}>
            <Feather name="edit-2" size={16} color="white" />
          </TouchableOpacity>
        </View>

        {/* Upload Error Display */}
        {uploadError && (
          <View className="mt-3 px-4">
            <Text className="text-center text-sm text-red-500">Upload failed: {uploadError}</Text>
          </View>
        )}

        <Text className="mt-4 font-psemibold text-lg text-gray-800">
          {formatNameWithMehta(user?.issuedto || '')}
        </Text>

        <View className="mt-6 w-full px-4">
          <ShadowBox
            className="rounded-2xl border border-gray-200/60 bg-white px-5 pb-5 pt-4"
            intensity="sm">
            {/* Header */}
            <View className="flex-row items-center justify-between">
              <Text className="font-psemibold text-base text-gray-800">Available Credits</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCreditsInfoModalVisible(true);
                }}
                className="rounded-full p-1"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}>
                <Feather name="info" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Separator */}
            <View className="my-3.5 h-px bg-gray-200/80" />

            {/* Credit Breakdown */}
            <View className="gap-y-4">
              {/* Room Credits */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-3">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-secondary-50/70">
                    <FontAwesome name="bed" size={16} color="#D97706" />
                  </View>
                  <Text className="font-pmedium text-[15px] text-gray-700">Stay</Text>
                </View>
                <Text className="font-psemibold text-base text-gray-800">
                  {user?.credits?.room || 0}
                </Text>
              </View>
              {/* Travel Credits */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-3">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-secondary-50/70">
                    <FontAwesome name="taxi" size={16} color="#D97706" />
                  </View>
                  <Text className="font-pmedium text-[15px] text-gray-700">Travel</Text>
                </View>
                <Text className="font-psemibold text-base text-gray-800">
                  {user?.credits?.travel || 0}
                </Text>
              </View>
              {/* Food Credits */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-3">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-secondary-50/70">
                    <Ionicons name="fast-food" size={16} color="#D97706" />
                  </View>
                  <Text className="font-pmedium text-[15px] text-gray-700">Food</Text>
                </View>
                <Text className="font-psemibold text-base text-gray-800">
                  {user?.credits?.food || 0}
                </Text>
              </View>
              {/* Utsav Credits */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-3">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-secondary-50/70">
                    <MaterialIcons name="festival" size={16} color="#D97706" />
                  </View>
                  <Text className="font-pmedium text-[15px] text-gray-700">Utsav</Text>
                </View>
                <Text className="font-psemibold text-base text-gray-800">
                  {user?.credits?.utsav || 0}
                </Text>
              </View>
            </View>
          </ShadowBox>
        </View>
      </View>
    );
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
          {renderHeader()}

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
              onPress={handleLogout}
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
        </KeyboardAwareScrollView>

        {/* Password Reset Modal */}
        <Modal
          visible={passwordModalVisible}
          transparent={true}
          animationType="none"
          statusBarTranslucent={true}
          onRequestClose={closePasswordModal}>
          <View className="flex-1 justify-end bg-black/50">
            <Pressable
              onPress={closePasswordModal}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <Animated.View
              className="overflow-hidden rounded-t-3xl bg-white"
              style={{
                transform: [{ translateY: slideAnim }, { translateY: keyboardOffset }],
                maxHeight: '85%',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -3 },
                shadowOpacity: 0.1,
                shadowRadius: 5,
                elevation: 10,
              }}>
              {/* Drag handle */}
              <View className="items-center pb-3 pt-2">
                <View className="h-1.5 w-16 rounded-full bg-gray-300" />
              </View>

              <ScrollView
                bounces={false}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingBottom: Math.max(insets.bottom, 20) + 20,
                }}>
                <View className="px-6 pt-2">
                  <Text className="mb-1 font-psemibold text-xl text-gray-800">Reset Password</Text>

                  <Text className="mb-6 font-pregular text-sm text-gray-500">
                    Choose a new, strong password that you don&apos;t use for other websites.
                  </Text>

                  <FormField
                    text="Current Password"
                    value={currentPassword}
                    placeholder="Enter current password"
                    handleChangeText={setCurrentPassword}
                    otherStyles="mb-5"
                    containerStyles="bg-gray-50 border border-gray-200"
                    inputStyles="font-pmedium text-base text-gray-800"
                    isPassword={true}
                  />

                  <FormField
                    text="New Password"
                    value={newPassword}
                    placeholder="Enter new password"
                    handleChangeText={setNewPassword}
                    otherStyles="mb-5"
                    containerStyles="bg-gray-50 border border-gray-200"
                    inputStyles="font-pmedium text-base text-gray-800"
                    isPassword={true}
                  />

                  <FormField
                    text="Confirm Password"
                    value={confirmPassword}
                    placeholder="Confirm new password"
                    handleChangeText={setConfirmPassword}
                    otherStyles="mb-8"
                    containerStyles="bg-gray-50 border border-gray-200"
                    inputStyles="font-pmedium text-base text-gray-800"
                    isPassword={true}
                  />

                  <View className="flex-row gap-x-3">
                    <TouchableOpacity
                      className="h-[52] flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white"
                      onPress={closePasswordModal}
                      activeOpacity={0.7}>
                      <Text className="font-psemibold text-base text-gray-600">Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className={`h-[52] flex-1 items-center justify-center rounded-xl ${
                        isLoading ? 'bg-gray-300' : 'bg-secondary'
                      }`}
                      onPress={handleResetPassword}
                      disabled={isLoading}
                      activeOpacity={0.7}>
                      {isLoading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="font-psemibold text-base text-white">Update</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
          <Toast />
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
                When you make a booking for a Room / Flat, Utsav and Guest Food, any available
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
