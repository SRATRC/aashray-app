import React from 'react';
import { Modal, View, Text, TouchableOpacity, Image, GestureResponderEvent } from 'react-native';
import { icons } from '../constants';
import CustomButton from './CustomButton';

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
        <View className="w-[320] rounded-xl bg-white p-5 shadow-lg" style={{ elevation: 10 }}>
          {/* Header with close button */}
          <View className="mb-4 flex-row items-start justify-between">
            <Text className="flex-1 pr-4 font-pmedium text-base text-black">{message}</Text>
            <TouchableOpacity onPress={onClose} className="rounded-full bg-gray-100 p-1">
              <Image source={icons.cross} className="h-4 w-4" resizeMode="contain" />
            </TouchableOpacity>
          </View>

          {/* Button row */}
          <View className="flex-row justify-end">
            <CustomButton
              handlePress={btnOnPress ? btnOnPress : onClose}
              text={btnText ?? 'Confirm'}
              bgcolor="bg-secondary"
              containerStyles="mt-3 rounded-md px-4 py-2"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CustomModal;
