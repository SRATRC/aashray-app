// src/features/profile/components/ResetPasswordModal.tsx
import * as Haptics from 'expo-haptics';
import { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  Platform,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  Keyboard,
} from 'react-native';
import { KeyboardController, useKeyboardController } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { updatePassword } from '../api';

import FormField from '@/components/FormField';
import { useAuthStore } from '@/stores';

const { height: screenHeight } = Dimensions.get('window');

interface ResetPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ visible, onClose }) => {
  const user = useAuthStore((state) => state.user);
  const insets = useSafeAreaInsets();
  const { setEnabled } = useKeyboardController();

  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Open animation — mirrors the legacy `openPasswordModal` trigger.
  useEffect(() => {
    if (visible) {
      setEnabled(false);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Keyboard listeners for password modal — uses willShow/willHide on iOS
  // to avoid flicker when switching between fields
  useEffect(() => {
    if (!visible) return;

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
  }, [visible, keyboardOffset]);

  const closePasswordModal = () => {
    KeyboardController.dismiss();
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setEnabled(true);
      keyboardOffset.setValue(0);
      onClose();
    });
  };

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
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setEnabled(true);
        keyboardOffset.setValue(0);
        onClose();

        Toast.show({
          type: 'success',
          text1: 'Password updated successfully',
          swipeable: false,
        });
      });
    };

    try {
      await updatePassword(user?.cardno, currentPassword.trim(), newPassword.trim());
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
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
                isPassword
              />

              <FormField
                text="New Password"
                value={newPassword}
                placeholder="Enter new password"
                handleChangeText={setNewPassword}
                otherStyles="mb-5"
                containerStyles="bg-gray-50 border border-gray-200"
                inputStyles="font-pmedium text-base text-gray-800"
                isPassword
              />

              <FormField
                text="Confirm Password"
                value={confirmPassword}
                placeholder="Confirm new password"
                handleChangeText={setConfirmPassword}
                otherStyles="mb-8"
                containerStyles="bg-gray-50 border border-gray-200"
                inputStyles="font-pmedium text-base text-gray-800"
                isPassword
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
  );
};

export default ResetPasswordModal;
