import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  GestureResponderEvent,
  ScrollView,
} from 'react-native';
import React from 'react';
import { AntDesign } from '@expo/vector-icons';
import CustomButton from './CustomButton';

interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  message?: string;
  btnText?: string;
  btnOnPress?: (event: GestureResponderEvent) => void;
  title?: string;
  children?: React.ReactNode;
  scrollable?: boolean;
  showCloseButton?: boolean;
  showActionButton?: boolean;
}

const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  onClose,
  message,
  btnText,
  btnOnPress,
  title,
  children,
  scrollable = false,
  showCloseButton = true,
  showActionButton = true,
}) => {
  const content = (
    <>
      {title && (
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="font-psemibold text-xl text-gray-900">{title}</Text>
          {showCloseButton && (
            <TouchableOpacity
              onPress={onClose}
              className="rounded-full bg-gray-100 p-2"
              activeOpacity={0.7}>
              <AntDesign name="close" size={20} color="#374151" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {children ? (
        children
      ) : (
        <Text className="mb-5 pr-6 font-pmedium text-lg text-gray-800">{message}</Text>
      )}

      {showActionButton && (
        <CustomButton
          handlePress={btnOnPress ?? onClose}
          text={btnText ?? 'Confirm'}
          bgcolor="bg-secondary"
          containerStyles="mt-4 rounded-xl py-3 w-full"
        />
      )}
    </>
  );

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}>
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
        <View
          className="w-full max-w-[350px] rounded-2xl bg-white p-6"
          style={{
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            maxHeight: scrollable ? '80%' : undefined,
          }}>
          {scrollable ? (
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {content}
            </ScrollView>
          ) : (
            content
          )}
        </View>
      </View>
    </Modal>
  );
};

export default CustomModal;
