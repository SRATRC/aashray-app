import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors } from '@/src/constants';

export interface AttachmentSheetOption {
  icon: string; // FontAwesome5 icon name
  label: string;
  subtitle: string;
  disabled?: boolean;
  onPress: () => void;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  options: AttachmentSheetOption[];
  title?: string;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

/**
 * Bottom-sheet action picker for adding attachments (Photo / Video).
 *
 * Implemented as an inline RN Modal styled as a bottom sheet — matching
 * CustomSelectBottomSheet — so it presents correctly even when the host screen
 * is itself a modal (a root-mounted Modal/alert cannot present over another
 * modal on iOS). Backdrop fades in; the panel springs up from the bottom.
 */
const AttachmentActionSheet = ({ visible, onClose, options, title = 'Add attachment' }: Props) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(320);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 24,
        stiffness: 260,
        mass: 0.9,
      }).start();
    }
  }, [visible, slideAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          className="overflow-hidden rounded-t-3xl bg-white pb-10"
          style={{
            transform: [{ translateY: slideAnim }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.1,
            shadowRadius: 5,
            elevation: 10,
          }}>
          {/* Pull indicator */}
          <View className="items-center pb-3 pt-2.5">
            <View className="h-1.5 w-16 rounded-full bg-gray-300" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pb-3">
            <Text style={{ fontSize: 18, fontFamily: 'Poppins-SemiBold', color: colors.black_100 }}>
              {title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              className="h-8 w-8 items-center justify-center rounded-full bg-gray-100">
              <FontAwesome5 name="times" size={13} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <View className="px-3 pt-1">
            {options.map((opt, i) => (
              <TouchableOpacity
                key={i}
                disabled={opt.disabled}
                activeOpacity={0.7}
                onPress={() => {
                  onClose();
                  opt.onPress();
                }}
                className={`flex-row items-center gap-x-4 rounded-2xl px-3 py-3 ${
                  opt.disabled ? 'opacity-40' : ''
                }`}>
                <View className="h-11 w-11 items-center justify-center rounded-full bg-gray-100">
                  <FontAwesome5 name={opt.icon} size={16} color="#374151" solid />
                </View>
                <View className="flex-1">
                  <Text className="font-psemibold text-[15px] text-gray-900">{opt.label}</Text>
                  <Text className="mt-0.5 font-pregular text-[12.5px] text-gray-400">
                    {opt.subtitle}
                  </Text>
                </View>
                {!opt.disabled && <FontAwesome5 name="chevron-right" size={12} color="#D1D5DB" />}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default AttachmentActionSheet;
