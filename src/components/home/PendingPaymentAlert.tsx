import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { View, Text, Pressable } from 'react-native';

import { colors, surfaces } from '@/src/constants';
import { useAuthStore } from '@/src/stores';
import {
  fetchPendingPayments,
  isTransactionExpiredAt,
  pendingPaymentsQueryKey,
} from '@/src/utils/pendingPayments';

/**
 * An unpaid booking, on the home screen.
 *
 * A pay-later hold is cancelled automatically if payment does not arrive, so
 * this is the one genuinely time-critical thing a member can see. It used to be
 * reachable only through a Quick Access tile weighted the same as "Contact
 * Info". It renders nothing when there is nothing to pay.
 */

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const PendingPaymentAlert: React.FC<{ className?: string }> = ({ className = '' }) => {
  const router = useRouter();
  const user = useAuthStore((state: any) => state.user);
  const cardno = user?.cardno;

  const { data } = useQuery({
    queryKey: pendingPaymentsQueryKey(cardno),
    queryFn: () => fetchPendingPayments(cardno),
    enabled: Boolean(cardno),
  });

  // An expired payment can no longer be paid (the backend cancels the booking
  // after 24h), so it is neither counted nor added to the total due.
  const now = Date.now();
  const pending = (data ?? []).filter((t) => !isTransactionExpiredAt(t, now, user?.country));
  const total = pending.reduce((sum, t) => sum + (Number(t?.amount) || 0), 0);

  if (pending.length === 0) return null;

  const headline =
    pending.length === 1
      ? 'You have 1 pending payment'
      : `You have ${pending.length} pending payments`;

  return (
    <Pressable
      onPress={() => router.push('/pendingPayments')}
      className={`${surfaces.CARD} overflow-hidden ${className}`}>
      <View className="flex-row items-center p-4">
        <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-secondary-50">
          <Ionicons name="card-outline" size={24} color={colors.secondary_200} />
        </View>

        <View className="flex-1">
          <Text className="font-psemibold text-sm text-gray-900">{headline}</Text>
          <Text className="mt-0.5 font-pregular text-xs leading-5 text-gray-500">
            {total > 0 ? `Total due: ${money(total)}` : 'Tap to review and pay.'}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.gray_400} />
      </View>

      <View className="h-1 bg-secondary" />
    </Pressable>
  );
};

export default PendingPaymentAlert;
