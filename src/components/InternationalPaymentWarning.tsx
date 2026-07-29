import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomModal from '@/src/components/CustomModal';

interface InternationalPaymentWarningProps {
  visible: boolean;
  country: string;
  onClose: () => void;
  onProceed: () => void;
}

const InternationalPaymentWarning = ({
  visible,
  country,
  onClose,
  onProceed,
}: InternationalPaymentWarningProps) => (
  <CustomModal visible={visible} onClose={onClose} title="Warning" showActionButton={false}>
    <View className="mb-4">
      <View className="mb-3 h-16 w-16 self-center items-center justify-center rounded-full bg-amber-100">
        <Ionicons name="warning" size={32} color="#F59E0B" />
      </View>

      <Text className="mb-3 text-center font-pregular text-sm text-gray-700">
        You are attempting to make a payment from{' '}
        <Text className="font-psemibold">{country}</Text>.
      </Text>

      <View className="mb-4 rounded-lg bg-amber-50 p-3">
        <Text className="mb-2 font-pmedium text-xs text-amber-900">Important Information:</Text>
        <Text className="mb-1 font-pregular text-xs text-amber-800">
          We currently do not support international payments. If you intend to pay using an Indian
          bank account, you may proceed with the payment.
        </Text>
        <Text className="font-pregular text-xs text-amber-800">
          Otherwise, you can pay for these bookings at the Research Centre on arrival.
        </Text>
      </View>

      <CustomButton
        text="I Understand, Proceed"
        handlePress={onProceed}
        containerStyles="min-h-[44px]"
        textStyles="font-psemibold text-sm text-white"
      />
    </View>
  </CustomModal>
);

export default InternationalPaymentWarning;
