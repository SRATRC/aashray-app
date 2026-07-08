// src/features/profile/components/ProfileHeader.tsx
import { Feather, FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { Text, View, TouchableOpacity, Image, ActivityIndicator } from 'react-native';

import CreditsInfoModal from './CreditsInfoModal';
import type { Profile } from '../types';

import { ShadowBox } from '@/components/ShadowBox';
import { useQuickImagePicker } from '@/hooks/useQuickImagePicker';
import getCachedImageUri, { invalidateCachedImage } from '@/utils/imageCache';

interface ProfileHeaderProps {
  user: Profile;
}

const formatNameWithMehta = (name: string) => {
  if (!name) return '';
  const nameParts = name.trim().split(' ');
  if (nameParts.length === 1) {
    return `${nameParts[0]} Mehta`;
  }
  const lastIndex = nameParts.length - 1;
  nameParts.splice(lastIndex, 0, 'Mehta');
  return nameParts.join(' ');
};

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  const { pickAndUpload, isUploading, uploadProgress, uploadError } = useQuickImagePicker();

  const [creditsInfoModalVisible, setCreditsInfoModalVisible] = useState(false);
  const [cachedImageUri, setCachedImageUri] = useState('');
  const [previousPfpUrl, setPreviousPfpUrl] = useState('');

  useEffect(() => {
    const loadCachedImage = async () => {
      if (user?.pfp) {
        if (user.pfp !== previousPfpUrl) {
          const uri = await getCachedImageUri(user.pfp);
          setCachedImageUri(uri);
          setPreviousPfpUrl(user.pfp);
        }
      }
    };

    loadCachedImage();
  }, [user?.pfp, previousPfpUrl]);

  useFocusEffect(
    useCallback(() => {
      const checkProfileUpdate = async () => {
        if (user?.pfp && previousPfpUrl && user.pfp !== previousPfpUrl) {
          await invalidateCachedImage(previousPfpUrl);
          const uri = await getCachedImageUri(user.pfp);
          setCachedImageUri(uri);
          setPreviousPfpUrl(user.pfp);
        }
      };

      checkProfileUpdate();
    }, [user?.pfp, previousPfpUrl])
  );

  return (
    <View className="mb-6 mt-6 flex-col items-center justify-center">
      <View className="relative">
        {/* Profile Image Container with ring */}
        <View className="relative items-center justify-center rounded-full border-[3px] border-secondary p-1">
          <Image
            source={{ uri: cachedImageUri }}
            className="h-[140] w-[140] rounded-full"
            resizeMode="cover"
            onError={() => {
              if (user?.pfp) {
                getCachedImageUri(user.pfp).then((uri) => setCachedImageUri(uri));
              }
            }}
          />

          {/* Upload Progress Overlay */}
          {isUploading && (
            <View className="absolute inset-0 m-1 items-center justify-center rounded-full bg-black/50">
              <View className="items-center">
                <ActivityIndicator size="large" color="white" />
                <Text className="mt-2 text-sm font-medium text-white">Uploading...</Text>
                <Text className="text-xs text-white">{uploadProgress}%</Text>

                {/* Progress Bar */}
                <View className="mt-2 h-1 w-20 rounded-full bg-white/30">
                  <View
                    className="h-1 rounded-full bg-white transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={pickAndUpload}
          className="absolute bottom-[2px] right-[2px] h-11 w-11 items-center justify-center rounded-full border-[2.5px] border-gray-50 bg-secondary"
          activeOpacity={0.8}
          disabled={isUploading}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
          }}>
          <Feather name="edit-2" size={16} color="white" />
        </TouchableOpacity>
      </View>

      {/* Upload Error Display */}
      {uploadError && (
        <View className="mt-3 px-4">
          <Text className="text-center text-sm text-red-500">Upload failed: {uploadError}</Text>
        </View>
      )}

      <Text className="mt-4 font-psemibold text-lg text-gray-800">
        {formatNameWithMehta(user?.issuedto || '')}
      </Text>

      <View className="mt-6 w-full px-4">
        <ShadowBox
          className="rounded-2xl border border-gray-200/60 bg-white px-5 pb-5 pt-4"
          intensity="sm">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <Text className="font-psemibold text-base text-gray-800">Available Credits</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCreditsInfoModalVisible(true);
              }}
              className="rounded-full p-1"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}>
              <Feather name="info" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Separator */}
          <View className="my-3.5 h-px bg-gray-200/80" />

          {/* Credit Breakdown */}
          <View className="gap-y-4">
            {/* Room Credits */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-x-3">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-secondary-50/70">
                  <FontAwesome name="bed" size={16} color="#D97706" />
                </View>
                <Text className="font-pmedium text-[15px] text-gray-700">Stay</Text>
              </View>
              <Text className="font-psemibold text-base text-gray-800">
                {user?.credits?.room || 0}
              </Text>
            </View>
            {/* Travel Credits */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-x-3">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-secondary-50/70">
                  <FontAwesome name="taxi" size={16} color="#D97706" />
                </View>
                <Text className="font-pmedium text-[15px] text-gray-700">Travel</Text>
              </View>
              <Text className="font-psemibold text-base text-gray-800">
                {user?.credits?.travel || 0}
              </Text>
            </View>
            {/* Food Credits */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-x-3">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-secondary-50/70">
                  <Ionicons name="fast-food" size={16} color="#D97706" />
                </View>
                <Text className="font-pmedium text-[15px] text-gray-700">Food</Text>
              </View>
              <Text className="font-psemibold text-base text-gray-800">
                {user?.credits?.food || 0}
              </Text>
            </View>
            {/* Utsav Credits */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-x-3">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-secondary-50/70">
                  <MaterialIcons name="festival" size={16} color="#D97706" />
                </View>
                <Text className="font-pmedium text-[15px] text-gray-700">Utsav</Text>
              </View>
              <Text className="font-psemibold text-base text-gray-800">
                {user?.credits?.utsav || 0}
              </Text>
            </View>
          </View>
        </ShadowBox>
      </View>

      <CreditsInfoModal
        visible={creditsInfoModalVisible}
        onClose={() => setCreditsInfoModalVisible(false)}
      />
    </View>
  );
};

export default ProfileHeader;
