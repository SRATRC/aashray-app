import React, { useState } from 'react';
import { Image, Keyboard, Modal, Pressable, View } from 'react-native';
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { images } from '@/src/constants';
import { useAuthStore } from '@/src/stores';
import { useNotification } from '@/src/context/NotificationContext';
import handleAPICall from '@/src/utils/HandleApiCall';
import CustomAlert from '@/src/components/CustomAlert';
import { Button, Field, Text } from '@/src/design';

const PasswordResetModal = ({ visible, onClose, email }: any) => (
  <Modal
    animationType="fade"
    transparent
    visible={visible}
    onRequestClose={onClose}
    statusBarTranslucent>
    <View className="flex-1 items-center justify-center bg-scrim px-7">
      <View className="w-full max-w-[400px] items-center rounded-hero bg-canvas p-8">
        <View className="mb-5 h-16 w-16 items-center justify-center rounded-full bg-accent-tint">
          <Image source={images.logo} className="h-10 w-10" resizeMode="contain" />
        </View>

        <Text variant="title" className="mb-3">
          Check Your Inbox
        </Text>
        <Text variant="body" color="secondary" align="center">
          We've sent a temporary password to WhatsApp and your registered email:
        </Text>
        <Text variant="bodyStrong" color="accent" className="mb-4 mt-1">
          {email}
        </Text>
        <Text variant="caption" color="muted" align="center" className="mb-7">
          Please use it to sign in and then change your password from your profile.
        </Text>

        <Button text="Got It" onPress={onClose} variant="primary" fullWidth />
      </View>
    </View>
  </Modal>
);

const SignIn = () => {
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState({ phone: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const setUser = useAuthStore((state: any) => state.setUser);
  const { expoPushToken } = useNotification();

  const isReady = form.phone.length === 10 && !!form.password;

  // Tracks OS keyboard spring curve exactly — runs on UI thread
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

  // Translates the block upward by the keyboard height, keeping it anchored to the bottom
  const blockStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: keyboardHeight.value }],
  }));

  const submit = async () => {
    if (!isReady) return;
    setIsSubmitting(true);
    await handleAPICall(
      'POST',
      '/client/verifyAndLogin',
      null,
      { mobno: form.phone, password: form.password, token: expoPushToken },
      async (data: any) => setUser(data.data),
      () => setIsSubmitting(false)
    );
  };

  const handleForgotPassword = async () => {
    if (!form.phone || form.phone.length !== 10) {
      CustomAlert.alert('Error', 'Please enter a valid phone number first');
      return;
    }

    CustomAlert.alert('Are you sure?', 'Are you sure you want to reset your password?', [
      { text: 'Cancel', style: 'destructive' },
      {
        text: 'Continue',
        style: 'default',
        onPress: async () => {
          setIsSubmitting(true);
          await handleAPICall(
            'POST',
            '/client/forgotPassword',
            null,
            { mobno: form.phone },
            async (data: any) => {
              setResetEmail(data?.data.email);
              setModalVisible(true);
            },
            () => setIsSubmitting(false)
          );
        },
      },
    ]);
  };

  return (
    <Pressable className="flex-1 justify-end bg-canvas" onPress={Keyboard.dismiss}>
      <Reanimated.View
        style={[blockStyle, { paddingBottom: insets.bottom + 40 }]}
        className="px-6 pt-10">
        <Image source={images.vvTra} className="h-[80px] w-[80px]" resizeMode="contain" />

        <Text variant="display" className="mb-2">
          Jai Sadgurudev{'\n'}Vandan!
        </Text>
        <Text variant="body" color="muted" className="mb-8 mt-1">
          Sign in to continue your journey
        </Text>

        <View className="mb-3">
          <Field
            label="Phone Number"
            value={form.phone}
            onChangeText={(e) => setForm({ ...form, phone: e })}
            placeholder="10-digit phone number"
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>

        <View className="mb-2">
          <Field
            label="Password"
            value={form.password}
            onChangeText={(e) => setForm({ ...form, password: e })}
            placeholder="Enter your password"
            secureToggle
          />
        </View>

        <Pressable onPress={handleForgotPassword} className="mb-7 self-end py-1" hitSlop={8}>
          <Text variant="caption" color="muted">
            Forgot password?
          </Text>
        </Pressable>

        <Button
          text="Sign In"
          onPress={submit}
          variant="primary"
          fullWidth
          loading={isSubmitting}
          disabled={!isReady}
        />
      </Reanimated.View>

      <PasswordResetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        email={resetEmail}
      />
    </Pressable>
  );
};

export default SignIn;
