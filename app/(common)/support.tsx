import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useGlobalContext } from '@/context/GlobalProvider';
import PageHeader from '@/components/PageHeader';
import FormField from '@/components/FormField';
import CustomButton from '@/components/CustomButton';
import CustomSelectBottomSheet from '@/components/CustomSelectBottomSheet';
import handleAPICall from '@/utils/HandleApiCall';

const SERVICE_LIST = [
  { key: 'booking', value: 'Booking Related Issues' },
  { key: 'payment', value: 'Payment Related Issues' },
  { key: 'wifi', value: 'WiFi Related Issues' },
  { key: 'other', value: 'Other' },
];

const SupportTicket = () => {
  const { user } = useGlobalContext();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    service: '',
    issue_description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (form.service.trim() === '' || form.issue_description.trim() === '') {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (form.issue_description.length < 10) {
      Alert.alert('Error', 'Please provide more details about your issue');
      return;
    }

    setIsSubmitting(true);

    const onSuccess = async (data: any) => {
      // Invalidate relevant queries if needed
      await queryClient.invalidateQueries({ queryKey: ['support-tickets', user.cardno] });

      Alert.alert(
        'Success',
        'Your support ticket has been submitted successfully. We will get back to you soon.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setForm({
                service: '',
                issue_description: '',
              });
              // Navigate back or to tickets list
              router.back();
            },
          },
        ]
      );
    };

    const onError = (error: any) => {
      Alert.alert('Error', error.message || 'Failed to submit support ticket');
    };

    const onFinally = () => {
      setIsSubmitting(false);
    };

    await handleAPICall(
      'POST',
      '/support',
      null,
      {
        cardno: user.cardno,
        service: form.service,
        issue: form.issue_description,
      },
      onSuccess,
      onFinally,
      onError
    );
  };

  return (
    <SafeAreaView className="h-full w-full bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <PageHeader
            title="Support Ticket"
            onPress={() => {
              if (form.service || form.issue_description) {
                Alert.alert(
                  'Discard Changes?',
                  'Are you sure you want to go back? Your changes will be lost.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Discard',
                      style: 'destructive',
                      onPress: () => router.back(),
                    },
                  ]
                );
              } else {
                router.back();
              }
            }}
          />

          <View className="mt-6 flex-1 px-4">
            <Text className="font-pregular text-base text-gray-500">
              Hello {user.issuedto}, please let us know how we can help you today
            </Text>

            <CustomSelectBottomSheet
              className="mt-7"
              label="Issue in which service"
              placeholder="Select Service"
              options={SERVICE_LIST}
              selectedValue={form.service}
              onValueChange={(val: any) => setForm({ ...form, service: val })}
            />

            <FormField
              text="Describe the issue"
              value={form.issue_description}
              handleChangeText={(e: any) => setForm({ ...form, issue_description: e })}
              multiline={true}
              numberOfLines={6}
              otherStyles="mt-7"
              inputStyles="font-pmedium text-base text-gray-400"
              containerStyles={'bg-gray-100'}
              placeholder="Please provide detailed information about the issue you're facing..."
            />

            <View className="mt-4">
              <Text className="font-pregular text-sm text-gray-400">
                * Please be as specific as possible to help us resolve your issue quickly
              </Text>
            </View>

            <CustomButton
              text="Submit Ticket"
              handlePress={handleSubmit}
              containerStyles="min-h-[62px] mt-7"
              isLoading={isSubmitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SupportTicket;
