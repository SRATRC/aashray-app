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
    <View className="mt-6 w-full flex-row items-center px-4">
      <Pressable onPress={onPress ? onPress : () => router.back()}>
        <Image
          source={icon ? icon : icons.backArrow}
          className={`mx-2 p-1 ${Platform.OS === 'android' ? 'h-4 w-4' : 'h-6 w-6'}`}
          resizeMode="contain"
          tintColor={'#000000'}
        />
      </Pressable>
      <Text className="font-psemibold text-2xl">{title}</Text>
    </View>
  );
};

export default PageHeader;
