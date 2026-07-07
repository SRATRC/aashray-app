import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '@/src/stores';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import PageHeader from '@/src/components/PageHeader';
import FormField from '@/src/components/FormField';
import CustomButton from '@/src/components/CustomButton';
import CustomSelectBottomSheet from '@/src/components/CustomSelectBottomSheet';
import CustomAlert from '@/src/components/CustomAlert';
import AttachmentPreviewStrip from '@/src/components/AttachmentPreviewStrip';
import handleAPICall from '@/src/utils/HandleApiCall';
import { collectDiagnostics } from '@/src/utils/collectDiagnostics';
import { useTicketAttachments, UPLOAD_CANCELLED } from '@/src/hooks/useTicketAttachments';
import { MAX_IMAGES, MAX_VIDEOS } from '@/src/utils/ticketAttachments';
import * as Application from 'expo-application';

// The 12 support departments — labels + order mirror the backend's
// TICKET_SERVICE_ROLE_MAP (config/constants.js), which is the source of truth.
// The stored `service` value is the label string itself.
const SERVICE_LIST = [
  { key: 'Electrical', value: 'Electrical' },
  { key: 'Housekeeping', value: 'Housekeeping' },
  { key: 'Maintenance', value: 'Maintenance' },
  { key: 'Raj Prasad', value: 'Raj Prasad' },
  { key: 'Raj Adhyayan', value: 'Raj Adhyayan' },
  { key: 'Raj Sharan', value: 'Raj Sharan' },
  { key: 'Raj Pravas', value: 'Raj Pravas' },
  { key: 'Raj Utsav', value: 'Raj Utsav' },
  { key: 'WiFi', value: 'WiFi' },
  { key: 'Payment/Accounts', value: 'Payment/Accounts' },
  { key: 'IT', value: 'IT' },
  { key: 'Others', value: 'Others' },
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

  const {
    attachments,
    imageCount,
    videoCount,
    canAddImage,
    canAddVideo,
    hasAttachments,
    addImages,
    addVideo,
    remove,
    upload,
    cancel,
    isUploading,
  } = useTicketAttachments(user.cardno);

  const busy = isSubmitting || isUploading;

  const handleClose = () => {
    const dirty = form.service.trim() !== '' || form.description.trim() !== '' || hasAttachments;
    if (dirty) {
      CustomAlert.alert('Discard Changes?', 'You have unsaved changes that will be lost.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            cancel();
            router.back();
          },
        },
      ]);
    } else {
      router.back();
    }
  };

  const handleAddImages = async () => {
    const msg = await addImages();
    if (msg) CustomAlert.alert('Heads up', msg);
  };

  const handleAddVideo = async () => {
    const msg = await addVideo();
    if (msg) CustomAlert.alert('Heads up', msg);
  };

  const handleSubmit = async () => {
    if (form.service.trim() === '') {
      CustomAlert.alert('Error', 'Please select a service type');
      return;
    }

    // A detailed description is required on its own, but attachment-only
    // tickets are valid (the backend accepts them), so staged media can stand
    // in for the 10-char minimum.
    if (form.description.trim().length < 10 && !hasAttachments) {
      CustomAlert.alert(
        'Error',
        'Please describe your issue (at least 10 characters) or add a photo/video.'
      );
      return;
    }

    setIsSubmitting(true);

    // Compress + presign + upload any attachments first, then create the ticket
    // referencing the returned keys. A failed upload aborts before creation.
    let attachmentRefs;
    try {
      attachmentRefs = hasAttachments ? await upload() : [];
    } catch (err: any) {
      setIsSubmitting(false);
      if (err?.message === UPLOAD_CANCELLED) return;
      CustomAlert.alert('Upload failed', err?.message || 'Could not upload your attachments.');
      return;
    }

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
        ...(attachmentRefs.length ? { attachments: attachmentRefs } : {}),
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

        {/* Attachments */}
        <Text className="mb-2 mt-7 font-pmedium text-base text-black">Attachments (optional)</Text>
        <View className="flex-row gap-x-3">
          <TouchableOpacity
            onPress={handleAddImages}
            disabled={!canAddImage || busy}
            activeOpacity={0.7}
            className={`flex-1 flex-row items-center justify-center gap-x-2 rounded-xl border border-gray-200 bg-gray-50 py-3 ${
              !canAddImage || busy ? 'opacity-40' : ''
            }`}>
            <FontAwesome5 name="image" size={15} color="#4B5563" />
            <Text className="font-pmedium text-sm text-gray-700">
              Photo{imageCount ? ` (${imageCount}/${MAX_IMAGES})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAddVideo}
            disabled={!canAddVideo || busy}
            activeOpacity={0.7}
            className={`flex-1 flex-row items-center justify-center gap-x-2 rounded-xl border border-gray-200 bg-gray-50 py-3 ${
              !canAddVideo || busy ? 'opacity-40' : ''
            }`}>
            <FontAwesome5 name="video" size={15} color="#4B5563" />
            <Text className="font-pmedium text-sm text-gray-700">
              Video{videoCount ? ` (${videoCount}/${MAX_VIDEOS})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
        <Text className="mt-2 font-pregular text-xs text-gray-400">
          Up to {MAX_IMAGES} photos and {MAX_VIDEOS} videos (max 60s each).
        </Text>
        <View className="mt-3">
          <AttachmentPreviewStrip attachments={attachments} onRemove={remove} disabled={busy} />
        </View>

        <CustomButton
          text={isUploading ? 'Uploading...' : 'Submit Request'}
          handlePress={handleSubmit}
          containerStyles="min-h-[62px] mt-10"
          isLoading={busy}
          isDisabled={
            form.service === '' || (form.description.trim().length < 10 && !hasAttachments) || busy
          }
        />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default CreateTicket;
