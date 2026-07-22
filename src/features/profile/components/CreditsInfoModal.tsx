// src/features/profile/components/CreditsInfoModal.tsx
import { View, Text } from 'react-native';

import CustomModal from '@/components/CustomModal';

interface CreditsInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

const CreditsInfoModal: React.FC<CreditsInfoModalProps> = ({ visible, onClose }) => {
  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      title="About Credits"
      btnText="Got it"
      scrollable
      showCloseButton>
      <>
        <View className="mb-4">
          <Text className="mb-2 font-psemibold text-base text-gray-800">Credit Value</Text>
          <Text className="font-pregular text-sm leading-5 text-gray-600">1 Credit = ₹1</Text>
        </View>
        <View className="mb-4">
          <Text className="mb-2 font-psemibold text-base text-gray-800">How to get Credits?</Text>
          <Text className="font-pregular text-sm leading-5 text-gray-600">
            You can earn credits only when a booking is canceled after the payment for that booking
            has been completed.
          </Text>
        </View>
        <View>
          <Text className="mb-2 font-psemibold text-base text-gray-800">How to Use?</Text>
          <Text className="font-pregular text-sm leading-5 text-gray-600">
            When you make a booking for a Room / Flat, Utsav and Guest Food, any available credits
            in your account will be automatically applied at checkout.
          </Text>
        </View>
        <View className="mt-4 border-t border-gray-200 pt-4">
          <Text className="font-pregular text-sm leading-5 text-rose-600">
            Credits are non-refundable, non-transferable, and cannot be converted to cash.
          </Text>
        </View>
      </>
    </CustomModal>
  );
};

export default CreditsInfoModal;
