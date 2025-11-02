import React, { useState } from 'react';
import { View, Text, Image, Alert, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { images } from '@/src/constants';
import { useAuthStore } from '@/src/stores';
import { useNotification } from '@/src/context/NotificationContext';
import FormField from '@/src/components/FormField';
import CustomButton from '@/src/components/CustomButton';
import handleAPICall from '@/src/utils/HandleApiCall';

const PasswordResetModal = ({ visible, onClose, email }: any) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-[400px] items-center rounded-2xl bg-white p-8 shadow-xl">
          <View className="mb-6 h-16 w-16 items-center justify-center rounded-full bg-secondary-50">
            <Image source={images.logo} className="h-10 w-10" resizeMode="contain" />
          </View>

          <Text className="mb-3 font-psemibold text-2xl text-gray-900">Check Your Email</Text>

          <Text className="mb-2 text-center font-pregular text-sm text-gray-600">
            We've sent a temporary password to:
          </Text>

          <Text className="mb-5 text-center font-pmedium text-base text-secondary-100">
            {email}
          </Text>

          <Text className="mb-8 text-center font-pregular text-sm text-gray-600">
            Please use it to sign in and then change your password from your profile.
          </Text>

          <CustomButton containerStyles="w-full h-12" text="Got It" handlePress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const SignIn = () => {
  const [form, setForm] = useState({
    phone: '',
    password: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const setUser = useAuthStore((state) => state.setUser);
  const { expoPushToken } = useNotification();

  const submit = async () => {
    setIsSubmitting(true);

    if (!form.phone || form.phone.length < 10 || !form.password) {
      Alert.alert('Error', 'Please fill the fields correctly');
      setIsSubmitting(false);
      return;
    }

    const onSuccess = async (data: any) => {
      const updatedUser = data.data;
      setUser(updatedUser);
    };

    const onFinally = () => {
      setIsSubmitting(false);
    };

    await handleAPICall(
      'POST',
      '/client/verifyAndLogin',
      null,
      {
        mobno: form.phone,
        password: form.password,
        token: expoPushToken,
      },
      onSuccess,
      onFinally
    );
  };

  const handleForgotPassword = async () => {
    if (!form.phone || form.phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid phone number first');
      return;
    }

    setIsSubmitting(true);

    const onSuccess = async (data: any) => {
      setResetEmail(data?.data.email);
      setModalVisible(true);
    };

    const onFinally = () => {
      setIsSubmitting(false);
    };

    await handleAPICall(
      'POST',
      '/client/forgotPassword',
      null,
      {
        mobno: form.phone,
      },
      onSuccess,
      onFinally
    );
  };

  return (
    <SafeAreaView className="h-full bg-gray-100">
      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="items-center">
          <Image source={images.vvTra} className="h-[80px] w-[80px]" resizeMode="contain" />
        </View>

        <View className="flex-1 justify-center">
          <View className="mb-10">
            <Text className="mb-2 text-center font-psemibold text-3xl text-gray-900">
              Jai Sadgurudev Vandan!
            </Text>
            <Text className="text-center font-pregular text-base text-gray-600">
              Sign in to your account
            </Text>
          </View>

          <View>
            <FormField
              text="Phone Number"
              value={form.phone}
              handleChangeText={(e: any) => setForm({ ...form, phone: e })}
              otherStyles="mb-5"
              inputStyles="font-pmedium text-base text-black"
              keyboardType="number-pad"
              placeholder="10-digit phone number"
              maxLength={10}
              useNeomorphic={true}
            />

            <FormField
              text="Password"
              value={form.password}
              handleChangeText={(e: any) => setForm({ ...form, password: e })}
              placeholder="Enter your password"
              otherStyles="mb-3"
              inputStyles="font-pmedium text-base text-black"
              keyboardType="default"
              isPassword={true}
              useNeomorphic={true}
            />

            <View className="mb-7 flex flex-row items-center justify-end">
              <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7} className="py-2">
                <Text className="font-pmedium text-sm text-secondary-100">Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <CustomButton
              text="Sign In"
              handlePress={submit}
              containerStyles="h-14 mb-8"
              isLoading={isSubmitting}
              isDisabled={form.phone.length !== 10 || !form.password}
            />

            {/* Divider - Closer to button */}
            {/* <View className="mb-6 flex flex-row items-center">
              <View className="h-[1px] flex-1 bg-gray-200" />
              <Text className="mx-4 font-pregular text-sm text-gray-500">or</Text>
              <View className="h-[1px] flex-1 bg-gray-200" />
            </View> */}

            {/* Sign Up CTA */}
            {/* <View className="flex flex-row items-center justify-center">
              <Text className="font-pregular text-sm text-gray-600">New to SRATRC? </Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="font-psemibold text-sm text-secondary-100">Create account</Text>
              </TouchableOpacity>
            </View> */}
          </View>
        </View>

        <PasswordResetModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          email={resetEmail}
        />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default SignIn;
