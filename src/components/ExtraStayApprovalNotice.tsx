import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants';
import FormField from './FormField';

interface ExtraStayApprovalNoticeProps {
  reason: string;
  onChangeReason: (text: string) => void;
  containerStyles?: string;
}

// Shown at the top of the review screen when a booking is over the 9-night /
// 30-day cap. Uses the design-system palette (secondary cream card + orange
// accent + grays) rather than off-system Tailwind amber. Static classes + a
// stable color constant keep it cheap to re-render.
const ExtraStayApprovalNotice: React.FC<ExtraStayApprovalNoticeProps> = ({
  reason,
  onChangeReason,
  containerStyles = '',
}) => {
  return (
    <View className={`rounded-2xl bg-secondary-50 p-4 ${containerStyles}`}>
      <View className="mb-2 flex-row items-center gap-x-2">
        <Ionicons name="alert-circle" size={20} color={colors.orange} />
        <Text className="font-pmedium text-base text-secondary-200">Approval Required</Text>
      </View>
      <Text className="mb-3 font-pregular text-sm text-gray-600">
        Your stay exceeds the 9-night limit within a 30-day window and will be submitted under{' '}
        <Text className="font-pmedium text-gray-800">Awaiting approval</Text>. Once approved by the
        admin, you will receive a WhatsApp message with a link to complete payment and confirm your
        booking.
      </Text>
      <FormField
        text="Reason for Extra Stay *"
        value={reason}
        handleChangeText={onChangeReason}
        placeholder="e.g. Attending shibir & family stay"
      />
    </View>
  );
};

export default ExtraStayApprovalNotice;
