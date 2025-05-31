import { Modal, View, Text, TouchableOpacity, GestureResponderEvent } from 'react-native';
import React from 'react';
import CustomButton from './CustomButton';
import { AntDesign } from '@expo/vector-icons';

interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  message: string;
  btnText?: string;
  btnOnPress?: (event: GestureResponderEvent) => void;
}

const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  onClose,
  message,
  btnText,
  btnOnPress,
}) => {
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
          }}>
          <Text className="mb-5 pr-6 font-pmedium text-lg text-gray-800">{message}</Text>

          <TouchableOpacity
            onPress={onClose}
            className="absolute right-4 top-4 rounded-full bg-gray-50 p-2"
            activeOpacity={0.7}>
            <AntDesign name="close" size={18} color="#666" />
          </TouchableOpacity>

          <CustomButton
            handlePress={btnOnPress ?? onClose}
            text={btnText ?? 'Confirm'}
            bgcolor="bg-secondary"
            containerStyles="mt-2 rounded-xl py-3 w-full"
          />
        </View>
      </View>
    </Modal>
  );
};

export default CustomModal;
