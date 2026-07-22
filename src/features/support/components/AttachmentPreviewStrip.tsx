import { FontAwesome5 } from '@expo/vector-icons';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { PendingAttachment } from '../types';

interface Props {
  attachments: PendingAttachment[];
  onRemove: (id: string) => void;
  disabled?: boolean;
}

function durationLabel(seconds?: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Horizontal strip of staged (pre-upload) attachments with a remove control and
// per-file upload status. Shared by the create screen and the chat composer.
const AttachmentPreviewStrip = ({ attachments, onRemove, disabled }: Props) => {
  if (attachments.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
      {attachments.map((a) => (
        <View key={a.id} className="h-[72px] w-[72px] overflow-hidden rounded-xl bg-gray-200">
          {a.kind === 'image' ? (
            <Image source={{ uri: a.uri }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="h-full w-full items-center justify-center bg-gray-800">
              <FontAwesome5 name="play" size={16} color="#fff" solid />
              {!!a.durationSec && (
                <Text className="mt-1 font-pmedium text-[10px] text-white">
                  {durationLabel(a.durationSec)}
                </Text>
              )}
            </View>
          )}

          {/* Upload state overlay */}
          {a.status === 'uploading' && (
            <View className="absolute inset-0 items-center justify-center bg-black/40">
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}
          {a.status === 'error' && (
            <View className="absolute inset-0 items-center justify-center bg-red-900/50">
              <FontAwesome5 name="exclamation-triangle" size={16} color="#fff" solid />
            </View>
          )}
          {a.status === 'uploaded' && (
            <View className="absolute bottom-1 right-1 h-4 w-4 items-center justify-center rounded-full bg-green-600">
              <FontAwesome5 name="check" size={8} color="#fff" solid />
            </View>
          )}

          {!disabled && (
            <TouchableOpacity
              onPress={() => onRemove(a.id)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-black/60"
              activeOpacity={0.7}>
              <FontAwesome5 name="times" size={10} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

export default AttachmentPreviewStrip;
