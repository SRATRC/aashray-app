// src/features/payments/components/PendingPaymentItem.tsx
// Extracted verbatim from the `renderItem` in the original `pendingPayments.tsx`
// — pure presentational transaction card, no behavior change.
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';

import PaymentTimer from './PaymentTimer';
import type { Transaction } from '../types';
import { getItemTitle, getDateRange, getDuration, getCategoryIcon } from '../utils';

interface PendingPaymentItemProps {
  item: Transaction;
  isSelected: boolean;
  isExpired: boolean;
  onPress: () => void;
}

const PendingPaymentItem = ({ item, isSelected, isExpired, onPress }: PendingPaymentItemProps) => {
  const isCashPending = item.status === 'cash pending';

  const categoryColors = {
    bg: 'bg-secondary-50',
    text: 'text-gray-700',
    border: 'border-secondary-50',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={!isExpired ? 0.6 : 1}
      disabled={isExpired}
      className={`mb-3 rounded-xl border ${
        isSelected && !isExpired
          ? 'border-secondary bg-secondary-50'
          : isExpired
            ? 'border-gray-200 bg-gray-50/70' // Subtle gray background
            : 'border-gray-200 bg-white'
      }`}
      style={{
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: isSelected && !isExpired ? 3 : 0,
        },
        shadowOpacity: isSelected && !isExpired ? 0.08 : 0,
        shadowRadius: isSelected && !isExpired ? 6 : 0,
        elevation: isSelected && !isExpired ? 3 : 0,
      }}>
      {/* Timer badge - Only show for non-cash pending payments */}
      {!isCashPending && (
        <View className="absolute -right-1 -top-1 z-10">
          <PaymentTimer createdAt={item.createdAt} />
        </View>
      )}

      <View className="p-4">
        <View className="mb-3 flex-row items-start justify-between">
          <View className="flex-1 flex-row items-start">
            <View
              className={`mr-3 rounded-full ${
                isExpired
                  ? 'border-gray-200 bg-gray-100'
                  : `${categoryColors.bg} ${categoryColors.border} border`
              }`}>
              <Image
                source={getCategoryIcon(item.category)}
                className="h-10 w-10"
                resizeMode="contain"
                style={{ opacity: isExpired ? 0.5 : 1 }}
              />
            </View>
            <View className="flex-1">
              <Text
                className={`font-psemibold text-sm leading-tight ${
                  isExpired ? 'text-gray-500' : 'text-gray-900'
                }`}
                numberOfLines={2}>
                {getItemTitle(item)}
              </Text>
              <View className="mt-1 flex-row items-baseline">
                <Text
                  className={`font-pbold text-lg ${isExpired ? 'text-gray-400' : 'text-gray-900'}`}>
                  ₹ {item.amount.toLocaleString()}
                </Text>
                {isExpired && (
                  <Text className="ml-2 font-pregular text-xs text-red-500">Expired</Text>
                )}
              </View>
            </View>
          </View>

          <View className="ml-2">
            <View
              className={`h-6 w-6 items-center justify-center rounded-full ${
                isSelected && !isExpired
                  ? 'border-2 border-secondary bg-secondary'
                  : isExpired
                    ? 'border border-gray-300 bg-gray-100' // Thinner border, filled background
                    : 'border-2 border-gray-300 bg-white'
              }`}>
              {isSelected && !isExpired && <Ionicons name="checkmark" size={14} color="#fff" />}
              {isExpired && (
                <View className="h-2 w-2 rounded-full bg-gray-400" /> // Subtle dot indicator
              )}
            </View>
          </View>
        </View>

        <View className={`mb-3 h-px ${isExpired ? 'bg-gray-200/70' : 'bg-gray-200'}`} />

        <View className="gap-y-2">
          {(item.start_day || item.end_day) && (
            <View className="flex-row items-center">
              <Ionicons
                name="time-outline"
                size={14}
                color={isExpired ? '#9CA3AF' : '#6B7280'}
                style={{ marginRight: 6 }}
              />
              <Text
                className={`font-pregular text-xs ${isExpired ? 'text-gray-400' : 'text-gray-600'}`}>
                {getDateRange(item.start_day, item.end_day)}
              </Text>
              {item.start_day && item.end_day && (
                <Text
                  className={`ml-2 font-pregular text-xs ${
                    isExpired ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                  • {getDuration(item.start_day, item.end_day)}
                </Text>
              )}
            </View>
          )}

          {item.booked_for_name && (
            <View className="flex-row items-center">
              <Ionicons
                name="person-outline"
                size={14}
                color={isExpired ? '#9CA3AF' : '#6B7280'}
                style={{ marginRight: 6 }}
              />
              <Text
                className={`font-pregular text-xs ${isExpired ? 'text-gray-400' : 'text-gray-600'}`}>
                Booked for {item.booked_for_name}
              </Text>
            </View>
          )}

          {item.description && (
            <View className="flex-row items-center">
              <Ionicons
                name="information-outline"
                size={14}
                color={isExpired ? '#9CA3AF' : '#6B7280'}
                style={{ marginRight: 6 }}
              />
              <Text
                className={`font-pregular text-xs ${isExpired ? 'text-gray-400' : 'text-gray-600'}`}>
                {item.description}
              </Text>
            </View>
          )}

          {isCashPending && (
            <View className="flex-row items-center">
              <Ionicons
                name="cash-outline"
                size={14}
                color={isExpired ? '#9CA3AF' : '#F59E0B'}
                style={{ marginRight: 6 }}
              />
              <Text
                className={`font-pregular text-xs ${isExpired ? 'text-gray-400' : 'text-amber-600'}`}>
                Cash payment pending
              </Text>
            </View>
          )}

          <View className="flex-row items-center justify-between pt-1">
            <View
              className={`rounded-full border px-2 py-1 ${
                isExpired
                  ? 'border-gray-200 bg-gray-100'
                  : `${categoryColors.bg} ${categoryColors.border}`
              }`}>
              <Text
                className={`font-pmedium text-xs capitalize ${
                  isExpired ? 'text-gray-400' : categoryColors.text
                }`}>
                {item.category}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default PendingPaymentItem;
