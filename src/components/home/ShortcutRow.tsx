import React from 'react';
import { View, Text, Image, Pressable, ImageSourcePropType } from 'react-native';

import { colors } from '@/src/constants';

/**
 * The on-site shortcuts, as one row that fits.
 *
 * They were a wrapping grid, which orphaned the fifth item onto a row of its
 * own, and then a scrolling row, which sliced the last tile at the screen edge
 * so it read as broken rather than scrollable. Five equal columns fit the width
 * outright, so there is nothing to wrap and nothing to cut.
 *
 * The tiles are the same white surface as every other card in the app, which
 * keeps the row light. A solid tint behind each icon turned it into five blocks
 * of colour instead.
 */

export interface Shortcut {
  key: string;
  icon: ImageSourcePropType;
  label: string;
  onPress: () => void;
}

const ShortcutRow: React.FC<{ items: Shortcut[]; className?: string }> = ({
  items,
  className = '',
}) => (
  <View className={`flex-row px-4 ${className}`}>
    {items.map((item) => (
      <Pressable
        key={item.key}
        onPress={item.onPress}
        className="min-w-0 flex-1 items-center gap-y-2"
        hitSlop={4}>
        {({ pressed }) => (
          <>
            <View
              className="h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-white"
              style={pressed ? { backgroundColor: colors.gray_100 } : undefined}>
              <Image source={item.icon} className="h-12 w-12" resizeMode="contain" />
            </View>
            <Text
              className="w-full text-center font-pregular text-xs leading-4 text-gray-700"
              numberOfLines={2}
              ellipsizeMode="tail">
              {item.label}
            </Text>
          </>
        )}
      </Pressable>
    ))}
  </View>
);

export default ShortcutRow;
