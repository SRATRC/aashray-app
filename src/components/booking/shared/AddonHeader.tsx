import React from 'react';
import { View, Text, Image } from 'react-native';

/**
 * The collapsed row of an add-on section.
 *
 * Every add-on used to render its own row: a bare 40pt icon beside one line of
 * text. That left a tall row carrying almost no information, which is what made
 * the screen read as empty. The icon now sits in a tinted circle — the same
 * treatment the booking cards use — and a second line says what the add-on is
 * for, so the row is worth its height.
 */

interface AddonHeaderProps {
  icon: any;
  title: string;
  subtitle?: string;
}

const AddonHeader: React.FC<AddonHeaderProps> = ({ icon, title, subtitle }) => (
  <View className="flex-1 flex-row items-center gap-x-3">
    <View className="h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-50">
      <Image source={icon} className="h-7 w-7" resizeMode="contain" />
    </View>
    <View className="flex-1">
      <Text className="font-psemibold text-base text-gray-900">{title}</Text>
      {subtitle ? (
        <Text className="mt-0.5 font-pregular text-xs text-gray-500">{subtitle}</Text>
      ) : null}
    </View>
  </View>
);

export default AddonHeader;
