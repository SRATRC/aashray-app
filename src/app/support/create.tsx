import { Platform, Text } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/stores';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import PageHeader from '@/src/components/PageHeader';
import FormField from '@/src/components/FormField';
import CustomButton from '@/src/components/CustomButton';
import CustomSelectBottomSheet from '@/src/components/CustomSelectBottomSheet';
import CustomAlert from '@/src/components/CustomAlert';
import handleAPICall from '@/src/utils/HandleApiCall';
import { collectDiagnostics } from '@/src/utils/collectDiagnostics';
import * as Application from 'expo-application';

// Canonical services list — kept in sync with the admin panel's service filter.
const SERVICE_LIST = [
  { key: 'Maintenance', value: 'Maintenance' },
  { key: 'IT Support', value: 'IT Support' },
  { key: 'Housekeeping', value: 'Housekeeping' },
  { key: 'Food', value: 'Food' },
  { key: 'Travel', value: 'Travel' },
  { key: 'Other', value: 'Other' },
];

const CreateTicket = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    service: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (form.service.trim() !== '' || form.description.trim() !== '') {
      CustomAlert.alert('Discard Changes?', 'You have unsaved changes that will be lost.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (form.service.trim() === '' || form.description.trim() === '') {
      CustomAlert.alert('Error', 'Please fill all fields');
      return;
    }

    if (form.description.trim().length < 10) {
      CustomAlert.alert('Error', 'Please provide more details about your issue');
      return;
    }

    setIsSubmitting(true);

    const appVersion = Application.nativeApplicationVersion;
    const os = Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Other';
    const metadata = await collectDiagnostics();

    if (__DEV__) {
      console.log('[Support] Ticket metadata:', metadata);
    }

    const onSuccess = async () => {
      await queryClient.invalidateQueries({ queryKey: ['tickets', user.cardno] });
      CustomAlert.alert(
        'Request Submitted',
        "We've received your request. Our team typically responds within 3 business days — you'll be notified here as soon as there's an update.",
        [{ text: 'OK', onPress: () => router.back() }]
      );
    };

    const onFinally = () => {
      setIsSubmitting(false);
    };

    const onError = (error: any) => {
      CustomAlert.alert('Error', error.message);
    };

    await handleAPICall(
      'POST',
      '/tickets',
      null,
      {
        cardno: user.cardno,
        service: form.service,
        description: form.description,
        os,
        app_version: appVersion,
        metadata,
      },
      onSuccess,
      onFinally,
      onError
    );
  };

  return (
    <SafeAreaView className="h-full w-full bg-white">
      <PageHeader title="New Request" iconName="times" onPress={handleClose} />

      <KeyboardAwareScrollView
        bottomOffset={62}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        keyboardShouldPersistTaps="handled">
        <Text className="mt-4 font-pregular text-base text-gray-500">
          Describe your issue below and we'll help you resolve it. Our average response time is 3
          business days.
        </Text>

        <CustomSelectBottomSheet
          className="mt-7"
          label="Service Type"
          placeholder="Select Service"
          options={SERVICE_LIST}
          selectedValue={form.service}
          onValueChange={(val) => setForm({ ...form, service: val as string })}
        />

        <FormField
          text="Description"
          value={form.description}
          handleChangeText={(e: string) => setForm({ ...form, description: e })}
          multiline={true}
          numberOfLines={6}
          otherStyles="mt-7"
          inputStyles="font-pmedium text-base text-black h-32"
          containerStyles={'bg-gray-100 items-start pt-2'}
          placeholder="Describe your issue in detail..."
        />

        <CustomButton
          text="Submit Request"
          handlePress={handleSubmit}
          containerStyles="min-h-[62px] mt-10"
          isLoading={isSubmitting}
          isDisabled={form.service === '' || form.description.trim().length < 10}
        />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default CreateTicket;
