// src/features/events/components/EventDetailHeader.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

interface EventDetailHeaderProps {
  insetsTop: number;
  onBack: () => void;
  onShare?: () => void;
  children: React.ReactNode;
}

// Sticky top bar shared by the loading, error, and loaded states of an event
// detail screen: back button, centered title slot, optional share button.
const EventDetailHeader: React.FC<EventDetailHeaderProps> = ({
  insetsTop,
  onBack,
  onShare,
  children,
}) => {
  return (
    <View
      className="bg-white"
      style={{
        paddingTop: insetsTop,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
      }}>
      <View className="flex-row items-center justify-between px-4 py-4">
        <TouchableOpacity
          onPress={onBack}
          className="rounded-full bg-gray-50 p-3 active:bg-gray-100"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}>
          <Ionicons name="arrow-back" size={20} color="#374151" />
        </TouchableOpacity>

        <View className="flex-1 px-4">{children}</View>

        {onShare ? (
          <TouchableOpacity
            onPress={onShare}
            className="rounded-full bg-blue-50 p-3 active:bg-blue-100"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}>
            <Ionicons name="share-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>
        ) : (
          <View className="w-[44px]" />
        )}
      </View>
    </View>
  );
};

export default EventDetailHeader;
