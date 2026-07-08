import { useState } from 'react';
import { View, Text, Image, TouchableWithoutFeedback } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProfileForm, { ProfileFormData } from '@/components/ProfileForm';
import { images, colors, icons } from '@/constants';
import { logoutRequest, updateProfile } from '@/features/profile';
import { useAuthStore } from '@/stores';

const CompleteProfileScreen = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormData: Partial<ProfileFormData> = {
    issuedto: user?.issuedto || '',
    gender: user?.gender || '',
    dob: user?.dob || '',
    idType: user?.idType || '',
    idNo: user?.idNo || '',
    address: user?.address || '',
    mobno: user?.mobno || '',
    email: user?.email || '',
    country: user?.country || '',
    state: user?.state || '',
    city: user?.city || '',
    pin: user?.pin || '',
    center: user?.center || '',
  };

  const handleSubmit = async (formData: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      const updated = await updateProfile(user.cardno, formData);
      setUser(updated);
    } catch {
      // apiClient already surfaced the error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutRequest(user?.cardno);
      logout();
    } catch {
      // apiClient already surfaced the error toast
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAwareScrollView
        bottomOffset={62}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 py-6">
          {/* Logo */}
          <View className="items-center">
            <Image source={images.logo} className="h-[60px] w-[60px]" resizeMode="contain" />
          </View>

          {/* Progress Header */}
          <View className="mt-4 items-center justify-center">
            <Text className="mb-2 text-sm text-gray-500">Step 2</Text>
            <View
              style={{
                width: '80%',
                height: 6,
                backgroundColor: '#E0E0E0',
                borderRadius: 3,
                marginBottom: 20,
              }}>
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: colors.orange,
                  borderRadius: 3,
                }}
              />
            </View>

            <Text className="text-center text-lg font-semibold text-gray-700">
              Complete Your Profile
            </Text>
            <Text className="mt-2 px-4 text-center text-sm text-gray-500">
              Help us personalize your experience by sharing some basic information about yourself.
            </Text>
          </View>

          {/* Profile Form */}
          <ProfileForm
            initialData={initialFormData}
            onSubmit={handleSubmit}
            submitButtonText="Submit Profile Details"
            isSubmitting={isSubmitting}
            showSectionHeaders
          />

          {/* Logout */}
          <View className="w-full items-center pb-10">
            <TouchableWithoutFeedback onPress={handleLogout}>
              <View className="flex flex-row items-center">
                <Image source={icons.logout} className="h-4 w-4" resizeMode="contain" />
                <Text className="ml-2 font-pregular text-sm text-black">Logout</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default CompleteProfileScreen;
