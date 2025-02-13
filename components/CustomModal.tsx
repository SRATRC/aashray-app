import React from 'react';
import { Modal, View, Text, TouchableOpacity, Image, GestureResponderEvent } from 'react-native';
import { icons } from '../constants';
import CustomButton from './CustomButton';

// Define prop types for the component
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
    <Modal transparent={true} animationType="fade" visible={visible} onRequestClose={onClose}>
      <View
        className="flex-1 flex-col items-center justify-center rounded"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <View className="w-[300] flex-col rounded-lg bg-white p-[20]">
          <View className="flex-row items-start justify-between">
            <Text className="flex-1 font-pmedium text-base text-black">{message}</Text>
            <TouchableOpacity onPress={onClose}>
              <Image source={icons.cross} className="ms-2 h-4 w-4 ps-2" resizeMode="contain" />
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-end">
            <CustomButton
              handlePress={btnOnPress ? btnOnPress : onClose}
              text={btnText ?? 'Confirm'}
              bgcolor="bg-secondary"
              containerStyles="mt-5 rounded-md px-2 py-1 justify-end"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CustomModal;
