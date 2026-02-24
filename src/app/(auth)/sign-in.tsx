import React, { useState } from 'react';
import { Image, Keyboard, Modal, Pressable, Text, View } from 'react-native';
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { images } from '@/src/constants';
import { useAuthStore } from '@/src/stores';
import { useNotification } from '@/src/context/NotificationContext';
import handleAPICall from '@/src/utils/HandleApiCall';
import CustomAlert from '@/src/components/CustomAlert';
import FormField from '@/src/components/FormField';
import CustomButton from '@/src/components/CustomButton';

const PasswordResetModal = ({ visible, onClose, email }: any) => (
  <Modal
    animationType="fade"
    transparent
    visible={visible}
    onRequestClose={onClose}
    statusBarTranslucent>
    <View className="flex-1 items-center justify-center bg-black/45 px-7">
      <View className="w-full max-w-[400px] items-center rounded-[28px] bg-white p-8">
        <View className="mb-5 h-16 w-16 items-center justify-center rounded-full bg-secondary-50">
          <Image source={images.logo} className="h-10 w-10" resizeMode="contain" />
        </View>

        <Text className="mb-3 font-dmserif text-[26px] text-black">Check Your Email</Text>
        <Text className="font-pregular text-sm text-gray-600">
          We've sent a temporary password to:
        </Text>
        <Text className="mb-4 mt-1 font-pmedium text-base text-secondary">{email}</Text>
        <Text className="mb-7 text-center font-pregular text-sm leading-5 text-gray-500">
          Please use it to sign in and then change your password from your profile.
        </Text>

        <CustomButton text="Got It" handlePress={onClose} variant="pill" containerStyles="w-full" />
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
    <Pressable className="flex-1 justify-end bg-white" onPress={Keyboard.dismiss}>
      <Reanimated.View
        style={[blockStyle, { paddingBottom: insets.bottom + 40 }]}
        className="px-6 pt-10">
        <Image source={images.vvTra} className="h-[80px] w-[80px]" resizeMode="contain" />

        <Text className="mb-2 font-dmserif text-[36px] leading-[44px] text-black">
          Jai Sadgurudev{'\n'}Vandan!
        </Text>
        <Text className="mb-8 mt-1 font-pregular text-base text-gray-400">
          Sign in to continue your journey
        </Text>

        <FormField
          text="Phone Number"
          value={form.phone}
          handleChangeText={(e: any) => setForm({ ...form, phone: e })}
          placeholder="10-digit phone number"
          keyboardType="number-pad"
          maxLength={10}
          otherStyles="mb-3"
          variant="clean"
        />

        <FormField
          text="Password"
          value={form.password}
          handleChangeText={(e: any) => setForm({ ...form, password: e })}
          placeholder="Enter your password"
          isPassword
          otherStyles="mb-2"
          variant="clean"
        />

        <Pressable onPress={handleForgotPassword} className="mb-7 self-end py-1" hitSlop={8}>
          <Text className="font-pregular text-sm text-gray-400">Forgot password?</Text>
        </Pressable>

        <CustomButton
          text="Sign In"
          handlePress={submit}
          variant="pill"
          isLoading={isSubmitting}
          isDisabled={!isReady}
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
