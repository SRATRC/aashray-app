import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { View, Text, Pressable } from 'react-native';

import { colors } from '@/src/constants';
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

  return (
    <Pressable
      onPress={() => router.push('/pendingPayments')}
      className={`flex-row items-center gap-x-3 rounded-2xl border border-secondary bg-secondary-50 px-4 py-3.5 ${className}`}>
      <Ionicons name="alert-circle" size={22} color={colors.secondary_200} />
      <View className="flex-1">
        <Text className="font-psemibold text-sm text-gray-900">
          {pending.length === 1 ? '1 payment pending' : `${pending.length} payments pending`}
          {total > 0 ? ` · ${money(total)}` : ''}
        </Text>
        <Text className="mt-0.5 font-pregular text-xs leading-5 text-gray-600">
          An unpaid booking is released automatically. Pay to keep it.
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.secondary_200} />
    </Pressable>
  );
};

export default PendingPaymentAlert;
