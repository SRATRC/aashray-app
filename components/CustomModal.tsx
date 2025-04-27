import { Modal, View, Text, TouchableOpacity, GestureResponderEvent } from 'react-native';
import React from 'react';
import CustomButton from './CustomButton';
import AntDesign from '@expo/vector-icons/AntDesign';

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
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <View className="w-[320] rounded-xl bg-white p-6 shadow-lg" style={{ elevation: 10 }}>
          {/* Header with message and close button */}
          <View className="mb-4 flex-row items-start justify-between">
            <Text className="flex-1 pr-4 font-pmedium text-base text-gray-800">{message}</Text>
            <TouchableOpacity onPress={onClose} className="rounded-full bg-gray-100 p-1.5">
              <AntDesign name="close" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Button row */}
          <View className="flex-row justify-end">
            <CustomButton
              handlePress={btnOnPress ? btnOnPress : onClose}
              text={btnText ?? 'Confirm'}
              bgcolor="bg-secondary"
              containerStyles="mt-2 rounded-lg px-5 py-2.5"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CustomModal;
