import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { View, Text, Pressable } from 'react-native';

import { colors, surfaces } from '@/src/constants';
import { useAuthStore } from '@/src/stores';
import handleAPICall from '@/src/utils/HandleApiCall';

/**
 * An unpaid booking, on the home screen.
 *
 * A pay-later hold is cancelled automatically if payment does not arrive, so
 * this is the one genuinely time-critical thing a member can see. It used to be
 * reachable only through a Quick Access tile weighted the same as "Contact
 * Info". It renders nothing when there is nothing to pay.
 */

interface Transaction {
  amount?: number | string;
  status?: string;
}

const fetchPending = (cardno: string): Promise<Transaction[]> =>
  new Promise((resolve, reject) => {
    handleAPICall(
      'GET',
      '/profile/transactions',
      { cardno, page: 1, page_size: 100, status: 'pending,cash pending,failed' },
      null,
      (res: any) => resolve(res?.data ?? (Array.isArray(res) ? res : [])),
      () => {},
      () => reject(new Error('Failed to fetch transactions')),
      false
    );
  });

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const PendingPaymentAlert: React.FC<{ className?: string }> = ({ className = '' }) => {
  const router = useRouter();
  const user = useAuthStore((state: any) => state.user);
  const cardno = user?.cardno;

  const { data } = useQuery({
    queryKey: ['pendingPayments', cardno],
    queryFn: () => fetchPending(cardno),
    enabled: Boolean(cardno),
  });

  const pending = data ?? [];
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
