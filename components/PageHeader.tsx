import { View, Text, Image, Platform, Pressable, ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import { icons } from '../constants';
import React from 'react';

interface PageHeaderProps {
  title: string;
  icon?: ImageSourcePropType;
  onPress?: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, icon, onPress }) => {
  const router = useRouter();

  return (
    <View className="mb-4 mt-6 w-full flex-row items-center px-4">
      <Pressable onPress={onPress ? onPress : () => router.back()}>
        <Image
          source={icon ? icon : icons.backArrow}
          className="android:h-4 android:w-4 ios:h-6 ios:w-6 mx-2 p-1"
          resizeMode="contain"
          tintColor={'#000000'}
        />
      </Pressable>
      <Text className="font-psemibold text-2xl">{title}</Text>
    </View>
  );
};

export default PageHeader;
