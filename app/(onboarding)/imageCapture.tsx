import { View, Text, ScrollView, Image, TouchableWithoutFeedback } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, icons, images } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import CustomButton from '../../components/CustomButton';
import handleAPICall from '../../utils/HandleApiCall';
import Toast from 'react-native-toast-message';

interface Step {
  title: string;
  description: string;
  btnText: string;
  action: () => void;
}

const ImageCaptureOnboarding: React.FC = () => {
  const { user, setUser, removeItem } = useGlobalContext();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const router: any = useRouter();

  const steps: Step[] = [
    {
      title: 'Help Us Verify Your Identity',
      description:
        'To ensure safety for all, please upload your picture. This step helps us secure your profile.',
      btnText: 'Upload My Picture',
      action: () => {
        router.replace('/camera');
      },
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView alwaysBounceVertical={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-between px-6 py-10">
          {/* Header */}
          <View className="mt-4 items-center">
            <Image source={images.logo} className="h-[57px] w-[108px]" resizeMode="contain" />
          </View>

          {/* Step Content */}
          <View className="flex-1 items-center justify-center">
            <Text className="mb-2 text-sm text-gray-500">
              Step {currentStep} of {steps.length}
            </Text>
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
                  width: `${(currentStep / steps.length) * 100}%`,
                  height: '100%',
                  backgroundColor: colors.orange,
                  borderRadius: 3,
                }}
              />
            </View>

            <Text className="text-center text-lg font-semibold text-gray-700">
              {steps[currentStep - 1].title}
            </Text>
            <Text className="mt-2 px-4 text-center text-sm text-gray-500">
              {steps[currentStep - 1].description}
            </Text>
          </View>

          {/* Footer Buttons */}
          <View className="items-center">
            {steps[currentStep - 1].btnText && steps[currentStep - 1].action && (
              <CustomButton
                text={steps[currentStep - 1].btnText}
                handlePress={steps[currentStep - 1].action}
                containerStyles="min-h-[52px] w-full rounded-lg mb-4"
                textStyles="text-white text-base font-medium"
              />
            )}

            <TouchableWithoutFeedback
              onPress={async () => {
                try {
                  const onSuccess = async () => {
                    setUser(null);
                    removeItem('user');
                    router.replace('/sign-in');
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
                  });
                }
              }}>
              <View className="flex flex-row items-center">
                <Image source={icons.logout} className="h-4 w-4" resizeMode="contain" />
                <Text className="font-pregular ml-2 text-sm text-black">Logout</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ImageCaptureOnboarding;
