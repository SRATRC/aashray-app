import React from 'react';
import { View, Text, Pressable } from 'react-native';

/**
 * A titled block on the home screen.
 *
 * Every section used the same 18pt black heading, so a list of outbound social
 * links shouted as loudly as the member's own booking. Titles here are one
 * step quieter than the content they introduce, and an optional action sits on
 * the right rather than becoming another row.
 */

interface HomeSectionProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  className?: string;
}

const HomeSection: React.FC<HomeSectionProps> = ({
  title,
  actionLabel,
  onAction,
  children,
  className = '',
}) => (
  <View className={className}>
    <View className="mb-3 flex-row items-center justify-between px-4">
      <Text className="font-psemibold text-base text-gray-900">{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text className="font-psemibold text-sm text-secondary-200">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
    {children}
  </View>
);

export default HomeSection;
