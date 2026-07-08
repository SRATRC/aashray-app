// src/features/payments/components/PaymentsSummaryCard.tsx
// Extracted verbatim from the `SummaryCard` in the original
// `pendingPayments.tsx` — pure presentational summary card, no behavior
// change. All derived numbers are computed by the screen and passed in.
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { View, Text } from 'react-native';

interface CategoryStat {
  category: string;
  count: number;
  amount: number;
  expiredCount: number;
  expiredAmount: number;
}

interface PaymentsSummaryCardProps {
  totalItemsCount: number;
  validPaymentsCount: number;
  expiredCount: number;
  totalNonExpiredAmount: number;
  totalExpiredAmount: number;
  categoryStats: CategoryStat[];
}

const PaymentsSummaryCard = ({
  totalItemsCount,
  validPaymentsCount,
  expiredCount,
  totalNonExpiredAmount,
  totalExpiredAmount,
  categoryStats,
}: PaymentsSummaryCardProps) => {
  if (!totalItemsCount) return null;

  return (
    <View className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-psemibold text-base text-gray-900">Payment Summary</Text>
        <View className="rounded-full bg-secondary-50 px-2.5 py-1">
          <Text className="font-pmedium text-xs text-primary">{totalItemsCount} total items</Text>
        </View>
      </View>

      <View className="mb-3 flex-row items-end justify-between">
        <View>
          <Text className="mb-1 font-pregular text-xs text-gray-600">Payable Amount</Text>
          <Text className="font-pbold text-xl text-gray-900">
            ₹ {totalNonExpiredAmount.toLocaleString()}
          </Text>
          <Text className="font-pregular text-xs text-green-600">
            {validPaymentsCount} active payment{validPaymentsCount !== 1 ? 's' : ''}
          </Text>
        </View>

        <View className="flex-row gap-x-1.5">
          {categoryStats.slice(0, 3).map((stat, index) => (
            <View
              key={stat.category}
              className="rounded-lg border border-gray-200 bg-gray-100 px-2 py-1">
              <Text
                className={`font-pmedium text-xs ${index === 0 ? 'text-gray-800' : 'text-gray-700'} capitalize`}>
                {stat.category} ({stat.count - stat.expiredCount})
              </Text>
            </View>
          ))}
        </View>
      </View>

      {expiredCount > 0 && (
        <View className="mt-2 rounded-lg bg-red-50 p-2.5">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center">
              <MaterialIcons
                name="info-outline"
                size={16}
                color="#DC2626"
                style={{ marginRight: 6 }}
              />
              <Text className="font-pregular text-xs text-red-700">
                {expiredCount} expired payment{expiredCount > 1 ? 's' : ''} worth ₹{' '}
                {totalExpiredAmount.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default PaymentsSummaryCard;
