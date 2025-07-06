import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, icons, images } from '@/constants';
import { useAuthStore } from '@/stores';
import CustomButton from '@/components/CustomButton';
import handleAPICall from '@/utils/HandleApiCall';
import Toast from 'react-native-toast-message';

const ImageCaptureOnboarding: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const router: any = useRouter();

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
            <Text className="mb-2 text-sm text-gray-500">Step 1 of 2</Text>
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
              Help Us Verify Your Identity
            </Text>
            <Text className="mt-2 px-4 text-center text-sm text-gray-500">
              Want Guruji to recognize you at a glance? Upload your picture and make sure he never
              has to say, 'Remind me who you are again!'
            </Text>
          </View>

          {/* Footer Buttons */}
          <View className="items-center">
            <CustomButton
              text="Upload My Picture"
              handlePress={() =>
                router.push({
                  pathname: '/(common)/camera',
                  params: { onSuccessRoute: '/(onboarding)/completeProfile' },
                })
              }
              containerStyles="min-h-[52px] w-full rounded-lg mb-4"
              textStyles="text-white text-base font-medium"
            />

            <TouchableWithoutFeedback
              onPress={async () => {
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
              }}>
              <View className="flex flex-row items-center">
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
