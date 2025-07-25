import { useState, useCallback } from 'react';
import { useAuthStore } from '@/stores';
import { invalidateCachedImage } from '@/utils/imageCache';
import Toast from 'react-native-toast-message';
import handleAPICall from '@/utils/HandleApiCall';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export const useQuickImagePicker = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const resetUploadState = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
    });
  }, []);

  const pickAndUpload = async () => {
    try {
      // Reset previous state
      resetUploadState();
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission Required',
          text2: 'Enable photo permissions to upload',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'livePhotos'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled || !result.assets[0]?.uri) return;

      const imageUri = result.assets[0].uri;

      // Start upload
      setUploadState(prev => ({
        ...prev,
        isUploading: true,
        progress: 10, // Initial progress
      }));

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Simulate progress updates (you can replace this with actual progress from your API)
      const progressInterval = setInterval(() => {
        setUploadState(prev => {
          if (prev.progress < 90) {
            return { ...prev, progress: prev.progress + 20 };
          }
          return prev;
        });
      }, 300);

      await handleAPICall(
        'POST',
        '/profile/upload',
        { cardno: user?.cardno },
        { image: imageUri },
        async (data: any) => {
          clearInterval(progressInterval);
          
          // Complete progress
          setUploadState(prev => ({ ...prev, progress: 100 }));
          
          // Cache invalidation and user update
          if (user?.pfp) {
            await invalidateCachedImage(user.pfp);
          }
          const updatedUser = { ...user, pfp: data.data };
          setUser(updatedUser);

          // Success feedback
          Toast.show({
            type: 'success',
            text1: 'Photo Updated!',
            text2: 'Your profile picture has been updated.',
          });

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          // Reset state after a short delay
          setTimeout(resetUploadState, 1000);
        },
        () => {},
        (error) => {
          clearInterval(progressInterval);
          setUploadState(prev => ({
            ...prev,
            isUploading: false,
            error: error.message || 'Upload failed',
          }));
        }
      );
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: err.message || 'Upload failed',
      }));
      
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: 'Please try again later.',
      });
    }
  };

  return {
    pickAndUpload,
    isUploading: uploadState.isUploading,
    uploadProgress: uploadState.progress,
    uploadError: uploadState.error,
    resetUploadState,
  };
};