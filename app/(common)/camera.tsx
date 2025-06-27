import {
  Text,
  TouchableOpacity,
  View,
  Image,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons, Ionicons, AntDesign } from '@expo/vector-icons';
import { useGlobalContext } from '@/context/GlobalProvider';
import { handleUserNavigation } from '@/utils/navigationValidations';
import { invalidateCachedImage } from '@/utils/imageCache';
import { useRouter } from 'expo-router';
import CustomButton from '@/components/CustomButton';
import handleAPICall from '@/utils/HandleApiCall';
import * as ImagePicker from 'expo-image-picker';

const CameraScreen: React.FC = () => {
  const { setUser, setCurrentUser, user } = useGlobalContext();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  useEffect(() => {
    if (capturedImage) {
      setCurrentUser(user);
    }
  }, [capturedImage, user, setCurrentUser]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" />
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color="#F1AC09" />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" />
        <View className="flex-1 justify-center px-6">
          <View className="mb-8 items-center">
            <Ionicons name="camera" size={80} color="#F1AC09" />
          </View>
          <Text className="mb-4 text-center font-psemibold text-2xl text-black-100">
            Camera Access Needed
          </Text>
          <Text className="mb-8 text-center text-base text-gray-600">
            We need your permission to open camera to capture a selfie so that guruji can view it
            before meetings.
          </Text>
          <CustomButton
            text="Grant Permission"
            handlePress={requestPermission}
            containerStyles="px-6 py-3 mx-8"
          />
        </View>
      </SafeAreaView>
    );
  }

  const captureImage = async () => {
    if (cameraRef.current) {
      try {
        const photo: any = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true,
          exif: false,
        });

        setCapturedImage(photo.uri);
      } catch (error) {
        console.error('Failed to take picture:', error);
      }
    }
  };

  const handleSaveImage = async () => {
    setIsSubmitting(true);

    const onSuccess = async (data: any) => {
      try {
        // Invalidate the old cached image BEFORE updating the user context
        if (user?.pfp) {
          await invalidateCachedImage(user.pfp);
        }

        // Update the user context with the new profile picture URL
        setUser((prev: any) => {
          const updatedUser = { ...prev, pfp: data.data };
          setCurrentUser(updatedUser);
          handleUserNavigation(updatedUser, router);
          return updatedUser;
        });
      } catch (error) {
        console.error('Error updating profile picture:', error);
      }
    };

    const onFinally = () => {
      setIsSubmitting(false);
    };

    await handleAPICall(
      'POST',
      '/profile/upload',
      { cardno: user.cardno },
      { image: capturedImage },
      onSuccess,
      onFinally
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      {capturedImage ? (
        <View className="flex-1">
          <View className="flex-row items-center justify-between bg-black px-4 py-3">
            <TouchableOpacity onPress={() => setCapturedImage(null)} className="p-2">
              <AntDesign name="arrowleft" size={24} color="white" />
            </TouchableOpacity>
            <Text className="font-pmedium text-lg text-white">Preview</Text>
            <View style={{ width: 28 }} />
          </View>

          <View className="flex-1 bg-black">
            <Image className="flex-1" source={{ uri: capturedImage }} resizeMode="contain" />
          </View>

          <View className="w-full bg-black px-6 pb-8 pt-4">
            <View className="flex-row justify-between gap-x-4">
              <CustomButton
                text="Retake"
                handlePress={() => setCapturedImage(null)}
                containerStyles="flex-1 py-3 mb-3 border border-secondary"
                textStyles="text-secondary"
                bgcolor="bg-black"
                isDisabled={isSubmitting}
              />
              <CustomButton
                text="Save"
                handlePress={handleSaveImage}
                containerStyles="flex-1 py-3 mb-3"
                isLoading={isSubmitting}
              />
            </View>
          </View>
        </View>
      ) : (
        <View className="relative flex-1">
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing="front"
            enableTorch={false}
            mirror={true}
          />

          <View className="absolute top-0 z-10 w-full bg-black/50 px-4 py-3 backdrop-blur-md">
            <Text className="text-center font-pmedium text-lg text-white">Take a Selfie</Text>
            <Text className="mt-1 text-center text-sm text-gray-400">
              Position your face in the center of the frame
            </Text>
          </View>

          <View className="absolute bottom-0 w-full bg-black/40 pb-12 pt-6 backdrop-blur-sm">
            <View className="flex-row items-center justify-center">
              <View className="flex-1 items-center">
                <TouchableOpacity
                  onPress={pickImage}
                  className="h-14 w-14 items-center justify-center rounded-full border border-white/50 bg-black/60"
                  style={{ elevation: 4 }}>
                  <MaterialIcons name="photo-library" size={28} color="#fff" />
                </TouchableOpacity>
              </View>

              <View className="flex-1 items-center">
                <TouchableOpacity
                  onPress={captureImage}
                  className="h-20 w-20 items-center justify-center rounded-full border-4 border-secondary bg-white"
                  style={{ elevation: 5 }}>
                  <View className="h-16 w-16 items-center justify-center rounded-full border-2 border-secondary">
                    <Ionicons name="camera" size={30} color="#000" />
                  </View>
                </TouchableOpacity>
              </View>

              <View className="flex-1" />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default CameraScreen;
