import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import {
  KeyboardProvider,
  KeyboardAvoidingView,
  KeyboardController,
  useKeyboardController,
} from 'react-native-keyboard-controller';
import { AntDesign } from '@expo/vector-icons';
import FormField from './FormField';
import CustomButton from './CustomButton';

const { height } = Dimensions.get('window');

interface SplitRange {
  start: string;
  end: string;
  nights: number;
}

interface ExtraStayReasonSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  splitRanges?: SplitRange[] | null;
  limitTargetName?: string | null;
  totalWindowNights?: number;
  limitReasonType?: string;
  pendingNights?: number;
  value: string;
  onChangeText: (text: string) => void;
}

// Local short-date formatter, e.g. '2 Aug'.
const formatDateShort = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const month = monthNames[parseInt(parts[1], 10) - 1] || parts[1];
    const day = parseInt(parts[2], 10);
    return `${day} ${month}`;
  }
  return dateStr;
};

const ExtraStayReasonSheet: React.FC<ExtraStayReasonSheetProps> = ({
  visible,
  onClose,
  onConfirm,
  splitRanges,
  limitTargetName,
  totalWindowNights,
  limitReasonType,
  pendingNights,
  value,
  onChangeText,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [showReasonError, setShowReasonError] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const { setEnabled } = useKeyboardController();

  useEffect(() => {
    if (visible) {
      setEnabled(false);
      setModalVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      KeyboardController.dismiss();
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setModalVisible(false);
        setEnabled(true);
      });
    }
    // Stop any in-flight slide animation if the sheet unmounts mid-transition,
    // so the driver isn't left running (and its completion setState never fires
    // on an unmounted component).
    return () => {
      slideAnim.stopAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleProceed = useCallback(() => {
    if (!value.trim()) {
      // Inline error only — firing a CustomAlert (a Modal) on top of this sheet
      // (also a Modal) stacks two modals and freezes the screen on iOS.
      setShowReasonError(true);
      return;
    }
    setShowReasonError(false);
    onConfirm(value.trim());
  }, [value, onConfirm]);

  // Clear the inline error as soon as the member starts typing a reason.
  useEffect(() => {
    if (value.trim()) setShowReasonError(false);
  }, [value]);

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>
      <KeyboardProvider>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <View className="flex-1 justify-end bg-black/50">
            <Pressable
              onPress={onClose}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <Animated.View
              className="overflow-hidden rounded-t-3xl bg-white"
              style={{
                transform: [{ translateY: slideAnim }],
                maxHeight: height * 0.85,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -3 },
                shadowOpacity: 0.1,
                shadowRadius: 5,
                elevation: 10,
              }}>
              {/* Pull indicator */}
              <View className="items-center pb-3 pt-2">
                <View className="h-1.5 w-16 rounded-full bg-gray-300" />
              </View>

              {/* Header */}
              <View className="flex-row items-center justify-between border-b border-gray-200 px-5 pb-4">
                <Text className="font-psemibold text-lg text-amber-800">
                  Admin Approval Required
                </Text>
                <TouchableOpacity
                  className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
                  onPress={onClose}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <AntDesign name="close" size={18} color="#374151" />
                </TouchableOpacity>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}>
                <View className="w-full">
                  {splitRanges && splitRanges.length >= 2 ? (
                    <View className="mb-2">
                      <Text className="mb-2 font-pregular text-sm text-gray-700">
                        Your booking {limitTargetName ? <>for <Text className="font-psemibold">{limitTargetName}</Text> </> : ''}is split into 2 segments due to Utsav event dates:
                      </Text>
                      <Text className="mb-1.5 font-pregular text-xs text-gray-700">
                        • <Text className="font-psemibold">Segment 1 ({formatDateShort(splitRanges[0].start)} – {formatDateShort(splitRanges[0].end)}, {splitRanges[0].nights} nights):</Text> Confirmed (Available).
                      </Text>
                      <Text className="mb-2 font-pregular text-xs text-gray-700">
                        • <Text className="font-psemibold">Segment 2 ({formatDateShort(splitRanges[1].start)} – {formatDateShort(splitRanges[1].end)}, {splitRanges[1].nights} nights):</Text> Brings your total stay within 30 days to <Text className="font-psemibold">{totalWindowNights} nights</Text> (exceeding 9-night limit).
                      </Text>
                      <Text className="mt-1 mb-1 font-pmedium text-xs text-amber-800">
                        Segment 2 will be submitted for admin approval.
                      </Text>
                    </View>
                  ) : (
                    <Text className="mb-2 font-pregular text-sm text-gray-700">
                      {limitReasonType === 'rolling_limit_exceeded' ? (
                        limitTargetName ? (
                          <>
                            Your booking for <Text className="font-psemibold">{limitTargetName}</Text> exceeds the 30-day limit (total <Text className="font-psemibold">{totalWindowNights} nights</Text> in 30 days) and will be submitted under <Text className="font-psemibold text-amber-700">Awaiting approval</Text>.
                          </>
                        ) : (
                          <>
                            Your total stay within a 30-day window will be <Text className="font-psemibold">{totalWindowNights} nights</Text> (exceeding the 9-night limit) and will be submitted under <Text className="font-psemibold text-amber-700">Awaiting approval</Text>.
                          </>
                        )
                      ) : (
                        limitTargetName ? (
                          <>
                            Your booking for <Text className="font-psemibold">{limitTargetName}</Text> exceeds 9 nights ({pendingNights} nights) and will be submitted under <Text className="font-psemibold text-amber-700">Awaiting approval</Text>.
                          </>
                        ) : (
                          <>
                            Your booking exceeds 9 nights ({pendingNights} nights) and will be submitted under <Text className="font-psemibold text-amber-700">Awaiting approval</Text>.
                          </>
                        )
                      )}
                    </Text>
                  )}
                  <Text className="mb-4 font-pregular text-xs text-gray-500">
                    Once approved by the admin, you will receive a WhatsApp message with a link to complete payment and confirm your stay.
                  </Text>
                  <FormField
                    text="Reason for Extended Stay *"
                    value={value}
                    handleChangeText={onChangeText}
                    placeholder="e.g. Attending shibir & family stay"
                    otherStyles={showReasonError ? 'mb-1' : 'mb-4'}
                  />
                  {showReasonError && (
                    <Text className="mb-3 font-pregular text-xs text-red-500">
                      Please enter a reason for your extended stay.
                    </Text>
                  )}
                  <View className="flex-row gap-x-3 mt-2">
                    <CustomButton
                      text="Cancel"
                      handlePress={onClose}
                      containerStyles="flex-1 bg-gray-200 py-3"
                      textStyles="text-gray-800"
                    />
                    <CustomButton
                      text="Proceed"
                      handlePress={handleProceed}
                      containerStyles="flex-1 bg-secondary py-3"
                    />
                  </View>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </KeyboardProvider>
    </Modal>
  );
};

export default ExtraStayReasonSheet;
