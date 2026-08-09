import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  Linking,
  ImageSourcePropType,
} from 'react-native';

/**
 * Outbound links, sized like outbound links.
 *
 * Seven full tiles made this the second largest block on the home screen, and
 * every one of them leaves the app. Small circles in a single scrolling row
 * keep them reachable without competing with the member's own booking.
 */

export interface SocialLink {
  key: string;
  icon: ImageSourcePropType;
  label: string;
  url: string;
}

const SocialRow: React.FC<{ items: SocialLink[]; className?: string }> = ({
  items,
  className = '',
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={{ flexGrow: 0, flexShrink: 0 }}
    contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
    className={className}>
    {items.map((item) => (
      <Pressable
        key={item.key}
        onPress={() => Linking.openURL(item.url)}
        className="w-[64px] items-center gap-y-1.5">
        {({ pressed }) => (
          <>
            <View
              className="h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white"
              style={pressed ? { opacity: 0.6 } : undefined}>
              <Image source={item.icon} className="h-8 w-8" resizeMode="contain" />
            </View>
            <Text
              className="w-full text-center font-pregular text-[11px] leading-4 text-gray-500"
              numberOfLines={2}>
              {item.label}
            </Text>
          </>
        )}
      </Pressable>
    ))}
  </ScrollView>
);

export default SocialRow;
