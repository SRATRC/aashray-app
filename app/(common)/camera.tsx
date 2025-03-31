import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button, Image, Text, TouchableOpacity, View } from 'react-native';
import { icons } from '../../constants';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useGlobalContext } from '../../context/GlobalProvider';
import { handleUserNavigation } from '../../utils/navigationValidations';
import CustomButton from '../../components/CustomButton';

const CameraScreen: React.FC = () => {
  const { setUser, setCurrentUser, user } = useGlobalContext();

  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  useEffect(() => {
    if (capturedImage) {
      setCurrentUser(user);
    }
  }, [capturedImage, user, setCurrentUser]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center">
        <Text className="pb-2 text-center">
          We need your permission to open camera to capture a selfie so that guruji can view it
          before meetings.
        </Text>
        <Button onPress={requestPermission} title="Continue" />
      </View>
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
        setUser((prev: any) => ({ ...prev, pfp: photo.uri }));
      } catch (error) {
        console.error('Failed to take picture:', error);
      }
    }
  };

  return (
    <View className="flex-1 justify-center">
      {capturedImage ? (
        <View className="flex-1 bg-gray-100">
          <Image className="flex-1" source={{ uri: capturedImage }} resizeMode="contain" />

          <View className="absolute bottom-0 w-full rounded-t-3xl bg-white-100 px-8 pb-8 pt-4 shadow-xl">
            <View className="flex-row justify-between gap-x-4">
              <CustomButton
                text={'Retake'}
                handlePress={() => setCapturedImage(null)}
                containerStyles={'flex-1 p-2 mx-1 mb-3 border border-secondary'}
                textStyles={'text-secondary'}
                bgcolor={'bg-white'}
              />
              <CustomButton
                text={'Save'}
                handlePress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    handleUserNavigation(user, router);
                  }
                }}
                containerStyles={'flex-1 p-2 mx-1 mb-3'}
              />
            </View>
          </View>
        </View>
      ) : (
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" enableTorch={false}>
          <TouchableOpacity className="absolute bottom-16 self-center" onPress={captureImage}>
            <Image source={icons.shutter} className="h-20 w-20" tintColor={'#fff'} />
          </TouchableOpacity>
        </CameraView>
      )}
    </View>
  );
};

export default CameraScreen;
