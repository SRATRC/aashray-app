import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, icons, images } from '@/src/constants';
import { useAuthStore } from '@/src/stores';
import { useQuickImagePicker } from '@/src/hooks/useQuickImagePicker';
import CustomButton from '@/src/components/CustomButton';
import handleAPICall from '@/src/utils/HandleApiCall';
import Toast from 'react-native-toast-message';

const ImageCaptureOnboarding: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const { pickAndUpload, isUploading, uploadProgress, uploadError } = useQuickImagePicker();

  const handleLogout = async () => {
    try {
      const onSuccess = async () => {
        logout();
      };

      await handleAPICall(
        'GET',
        '/client/logout',
        { cardno: user?.cardno },
        null,
        onSuccess,
        () => {}
      );
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'An error occurred!',
        text2: error.message,
        swipeable: false,
      });
    }
  };

  const renderUploadButton = () => {
    if (isUploading) {
      return (
        <View className="mb-4 min-h-[52px] w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-100">
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color={colors.orange} />
            <Text className="ml-2 text-base font-medium text-gray-600">
              Uploading... {uploadProgress}%
            </Text>
          </View>
          {/* Progress Bar */}
          <View className="mt-2 h-2 w-3/4 rounded-full bg-gray-200">
            <View
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${uploadProgress}%`,
                backgroundColor: colors.orange,
              }}
            />
          </View>
        </View>
      );
    }

    return (
      <CustomButton
        text="Upload My Picture"
        handlePress={pickAndUpload}
        containerStyles="min-h-[52px] w-full rounded-lg mb-4"
        textStyles="text-white text-base font-medium"
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView alwaysBounceVertical={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-between px-6 py-10">
          {/* Header */}
          <View className="mt-4 items-center">
            <Image source={images.logo} className="h-[80px] w-[80px]" resizeMode="contain" />
          </View>

          {/* Step Content */}
          <View className="flex-1 items-center justify-center">
            <Text className="mb-2 text-sm text-gray-500">Step 1</Text>
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

            {/* Enhanced Visual Section */}
            <View className="mb-8 items-center">
              <Text className="mb-3 text-center text-xl font-semibold text-gray-800">
                Help Us Verify Your Identity
              </Text>
              <Text className="mt-2 px-4 text-center text-base leading-6 text-gray-600">
                Want Guruji to recognize you at a glance? Upload your picture and make sure he never
                has to say, 'Remind me who you are again!'
              </Text>
            </View>

            {/* Upload Status */}
            {uploadError && (
              <View className="mb-4 w-full px-4">
                <Text className="text-center text-sm text-red-500">
                  Upload failed: {uploadError}
                </Text>
              </View>
            )}
          </View>

          {/* Footer Buttons */}
          <View className="items-center">
            {renderUploadButton()}

            <TouchableWithoutFeedback onPress={handleLogout} disabled={isUploading}>
              <View
                className={`flex flex-row items-center py-3 ${isUploading ? 'opacity-50' : ''}`}>
                <Image source={icons.logout} className="h-4 w-4" resizeMode="contain" />
                <Text className="ml-2 font-pregular text-sm text-black">Logout</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ImageCaptureOnboarding;
