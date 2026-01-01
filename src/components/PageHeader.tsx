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
  hideIcon?: boolean;
  rightAction?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  iconName = 'chevron-left',
  onPress,
  iconColor = '#000000',
  iconSize = 20,
  hideIcon = false,
  rightAction,
}) => {
  const router = useRouter();

  return (
    <View className="mb-4 mt-6 w-full flex-row items-center justify-between px-2">
      <View className="flex-row items-center gap-x-1">
        {!hideIcon && (
          <Pressable onPress={onPress ? onPress : () => router.back()}>
            <FontAwesome5
              name={iconName}
              size={iconSize}
              color={iconColor}
              style={{ marginHorizontal: 8, padding: 4 }}
            />
          </Pressable>
        )}
        <Text className="font-psemibold text-2xl">{title}</Text>
      </View>
      {rightAction && <View className="mr-2">{rightAction}</View>}
    </View>
  );
};

export default PageHeader;
