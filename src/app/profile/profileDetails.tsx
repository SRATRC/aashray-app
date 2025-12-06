import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/stores';
import PageHeader from '@/src/components/PageHeader';
import handleAPICall from '@/src/utils/HandleApiCall';
import ProfileForm, { ProfileFormData } from '@/src/components/ProfileForm';

const ProfileDetails = () => {
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

    const onSuccess = (data: any) => {
      setUser(data.data);
      router.back();
    };

    const onFinally = () => {
      setIsSubmitting(false);
    };

    await handleAPICall(
      'PUT',
      '/profile',
      null,
      {
        cardno: user.cardno,
        ...formData,
      },
      onSuccess,
      onFinally
    );
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

export default ProfileDetails;
