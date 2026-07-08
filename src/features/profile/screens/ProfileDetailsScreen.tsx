// src/features/profile/screens/ProfileDetailsScreen.tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { updateProfile } from '../api';

import PageHeader from '@/components/PageHeader';
import ProfileForm, { ProfileFormData } from '@/components/ProfileForm';
import { useAuthStore } from '@/stores';

const ProfileDetailsScreen = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const router = useRouter();

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
      const result = await updateProfile(user.cardno, formData);
      setUser(result);
      router.back();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="h-full bg-white">
      <KeyboardAwareScrollView
        bottomOffset={62}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled">
        <PageHeader title="Profile Details" />
        <View className="mb-8 w-full px-4">
          <ProfileForm
            initialData={initialFormData}
            onSubmit={handleSubmit}
            submitButtonText="Update Profile"
            isSubmitting={isSubmitting}
            showSectionHeaders={false}
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default ProfileDetailsScreen;
