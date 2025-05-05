import { View, Text, Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';

interface PageHeaderProps {
  title: string;
  iconName?: string;
  onPress?: () => void;
  iconColor?: string;
  iconSize?: number;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  iconName = 'chevron-left',
  onPress,
  iconColor = '#000000',
  iconSize = 20,
}) => {
  const router = useRouter();

  return (
    <View className="mb-4 mt-6 w-full flex-row items-center gap-x-1 px-2">
      <Pressable onPress={onPress ? onPress : () => router.back()}>
        <FontAwesome5
          name={iconName}
          size={iconSize}
          color={iconColor}
          style={{ marginHorizontal: 8, padding: 4 }}
        />
      </Pressable>
      <Text className="font-psemibold text-2xl">{title}</Text>
    </View>
  );
};

export default PageHeader;
