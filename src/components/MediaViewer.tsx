import { useEffect } from 'react';
import { Dimensions, Modal, StatusBar, TouchableOpacity, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useVideoPlayer, VideoView } from 'expo-video';
import { AttachmentKind } from '@/src/utils/ticketAttachments';

export interface MediaViewerItem {
  uri: string;
  kind: AttachmentKind;
}

interface Props {
  visible: boolean;
  item: MediaViewerItem | null;
  onClose: () => void;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// The video branch is its own component so the native player is only created
// while a video is actually being shown (it mounts/unmounts with this branch) —
// no player is constructed on the image path.
const VideoContent = ({ uri, playing }: { uri: string; playing: boolean }) => {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  // Autoplay the tapped video; pause when the viewer is dismissed.
  useEffect(() => {
    try {
      if (playing) player.play();
      else player.pause();
    } catch {
      // player may be released between renders — safe to ignore.
    }
  }, [playing, player]);

  return <VideoView player={player} style={{ flex: 1 }} contentFit="contain" nativeControls />;
};

// Lightweight full-screen media viewer: pinch-zoom + pan + double-tap for
// images, and an expo-video player (native controls) for video. Rendered in a
// Modal, so its content is wrapped in its own GestureHandlerRootView (the
// modal is a separate native hierarchy from the app root).
const MediaViewer = ({ visible, item, onClose }: Props) => {
  const isVideo = item?.kind === 'video';

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  // Reset the transform whenever the shown item changes / the viewer reopens.
  useEffect(() => {
    scale.value = 1;
    savedScale.value = 1;
    tx.value = 0;
    ty.value = 0;
    savedTx.value = 0;
    savedTy.value = 0;
  }, [item?.uri, visible, scale, savedScale, tx, ty, savedTx, savedTy]);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, savedScale.value * e.scale);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        scale.value = withTiming(1);
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        savedTx.value = 0;
        savedTy.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        tx.value = savedTx.value + e.translationX;
        ty.value = savedTy.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        savedTx.value = 0;
        savedTy.value = 0;
      } else {
        scale.value = withTiming(2);
        savedScale.value = 2;
      }
    });

  const composed = Gesture.Simultaneous(Gesture.Exclusive(doubleTap, pan), pinch);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <StatusBar hidden />
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="absolute right-5 z-10 h-10 w-10 items-center justify-center rounded-full bg-black/50"
            style={{ top: 48 }}
            activeOpacity={0.7}>
            <FontAwesome5 name="times" size={20} color="#fff" />
          </TouchableOpacity>

          {item &&
            (isVideo ? (
              <VideoContent uri={item.uri} playing={visible} />
            ) : (
              <GestureDetector gesture={composed}>
                <Animated.Image
                  source={{ uri: item.uri }}
                  style={[{ width: SCREEN_W, height: SCREEN_H }, imageStyle]}
                  resizeMode="contain"
                />
              </GestureDetector>
            ))}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default MediaViewer;
