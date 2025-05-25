import {
  View,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { images } from '../../constants';
import { router } from 'expo-router';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useNotification } from '../../context/NotificationContext';
import { handleUserNavigation } from '../../utils/navigationValidations';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import handleAPICall from '../../utils/HandleApiCall';

const PasswordResetModal = ({ visible, onClose, email }: any) => {
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50">
        <View className="w-[85%] max-w-[400px] items-center rounded-3xl bg-white p-8 shadow-md">
          <View className="mb-5 rounded-full bg-secondary-50 p-5">
            <Image source={images.logo} className="h-[50px] w-[50px]" resizeMode="contain" />
          </View>

          <Text className="mb-4 font-psemibold text-2xl text-gray-800">Check Your Email</Text>

          <Text className="mb-1 text-center font-pregular text-base text-gray-600">
            We've sent a temporary password to:
          </Text>

          <Text className="mb-4 text-center font-pmedium text-base text-secondary">{email}</Text>

          <Text className="mb-6 text-center font-pregular text-sm text-gray-600">
            We have emailed a temporary password to you. Please use it to sign in and then change
            your password.
          </Text>

          <CustomButton
            containerStyles="w-full mb-4 px-8 py-3"
            text="Got It"
            handlePress={onClose}
          />
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

  const { setUser, setCurrentUser } = useGlobalContext();
  const { expoPushToken } = useNotification();

  const submit = async () => {
    setIsSubmitting(true);

    if (!form.phone || form.phone.length < 10 || !form.password) {
      Alert.alert('Error', 'Please fill the fields corectly');
      setIsSubmitting(false);
      return;
    }

    const onSuccess = async (data: any) => {
      setUser(() => {
        const updatedUser = data.data;
        setCurrentUser(updatedUser);
        handleUserNavigation(updatedUser, router);
        return updatedUser;
      });
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
    <SafeAreaView className="h-full bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <View className="my-6 min-h-[83vh] w-full justify-center px-4">
            <Image source={images.logo} className="h-[80px] w-[80px]" resizeMode="contain" />
            <Text className="text-semibold mt-5 font-psemibold text-2xl text-black">
              Welcome to SRATRC
            </Text>

            <FormField
              text="Phone Number"
              value={form.phone}
              handleChangeText={(e: any) => setForm({ ...form, phone: e })}
              otherStyles="mt-7"
              inputStyles="font-pmedium text-base text-black"
              keyboardType="number-pad"
              placeholder="Enter Your Phone Number"
              maxLength={10}
            />

            <FormField
              text="Password"
              value={form.password}
              handleChangeText={(e: any) => setForm({ ...form, password: e })}
              otherStyles="mt-7"
              inputStyles="font-pmedium text-base text-black"
              keyboardType="default"
              placeholder="Enter Your Password"
              isPassword={true}
            />

            <View className="mt-2 flex flex-row items-center justify-end">
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text className="font-pmedium text-sm text-secondary">Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <CustomButton
              text="Sign In"
              handlePress={submit}
              containerStyles="mt-7 min-h-[62px]"
              isLoading={isSubmitting}
              isDisabled={!form.phone || !form.password}
            />

            {/* Password Reset Modal */}
            <PasswordResetModal
              visible={modalVisible}
              onClose={() => setModalVisible(false)}
              email={resetEmail}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignIn;
