import { FontAwesome5 } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import { buildAttachmentUri } from '../attachments';
import { ServedAttachment } from '../types';

interface Props {
  attachments: ServedAttachment[] | undefined;
  cardno: string;
  onOpenImage: (uri: string) => void;
}

// Placeholder for media that was auto-deleted after the 60-day retention window.
const ExpiredPlaceholder = () => (
  <View className="h-[120px] w-[200px] items-center justify-center rounded-xl border border-gray-200 bg-gray-100 px-3">
    <FontAwesome5 name="image" size={18} color="#9CA3AF" />
    <Text className="mt-2 text-center font-pregular text-[11px] leading-[15px] text-gray-400">
      Media removed after 60 days
    </Text>
  </View>
);

// Inline video player. useVideoPlayer is a hook, so each video attachment is its
// own component instance (one player per video).
const TicketVideo = ({ uri }: { uri: string }) => {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });
  return (
    <VideoView
      player={player}
      style={{ width: 220, height: 140, borderRadius: 12, backgroundColor: '#000' }}
      contentFit="contain"
      nativeControls
    />
  );
};

// Renders a message's (or the ticket's) stored attachments: tappable image
// thumbnails (open full-screen), inline video players, and expired placeholders.
const TicketMessageAttachments = ({ attachments, cardno, onOpenImage }: Props) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <View className="mt-1.5 flex-row flex-wrap gap-2">
      {attachments.map((a) => {
        if (a.expired) return <ExpiredPlaceholder key={a.id} />;

        const uri = buildAttachmentUri(a.url, cardno);
        if (!uri) return null;

        if (a.kind === 'video') {
          return <TicketVideo key={a.id} uri={uri} />;
        }

        return (
          <TouchableOpacity
            key={a.id}
            activeOpacity={0.85}
            onPress={() => onOpenImage(uri)}
            className="overflow-hidden rounded-xl bg-gray-200">
            <Image source={{ uri }} style={{ width: 200, height: 150 }} resizeMode="cover" />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default TicketMessageAttachments;
