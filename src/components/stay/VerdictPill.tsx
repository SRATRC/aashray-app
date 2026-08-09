import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text } from 'react-native';

import type { Verdict } from './stayOutcome.types';

// One visual language for the three answers, shared by the outcome block, the
// review recap and the bookings list. Red is deliberately absent: a waitlist is
// "yes, but", not a failure. Red stays reserved for cancelled and failed.
export const VERDICT_STYLE: Record<
  Verdict,
  { label: string; icon: keyof typeof Ionicons.glyphMap; tint: string; bg: string; text: string }
> = {
  confirmed: {
    // Every screen that shows this pill shows it before the booking exists, so
    // "Confirmed" would claim something untrue. It states availability instead.
    label: 'Available',
    icon: 'checkmark-circle',
    tint: '#05B617',
    bg: 'bg-green-100',
    text: 'text-green-200',
  },
  waitlist: {
    label: 'Waitlist',
    icon: 'time',
    tint: '#FF8E01',
    bg: 'bg-secondary-50',
    text: 'text-secondary-200',
  },
  unavailable: {
    label: 'Unavailable',
    icon: 'remove-circle',
    tint: '#6B7280',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
  },
};

interface VerdictPillProps {
  verdict: Verdict;
  /**
   * Rendered as "Waitlist · 6" whenever it is positive. Whether a given number
   * is worth showing is the caller's call, not this component's: a group of one
   * person is noise, a queue of one person is not. Pass undefined to hide it.
   */
  count?: number;
  size?: 'sm' | 'md';
}

const VerdictPill: React.FC<VerdictPillProps> = ({ verdict, count, size = 'md' }) => {
  const style = VERDICT_STYLE[verdict];
  const isSmall = size === 'sm';

  return (
    <View
      className={`flex-row items-center self-start rounded-full ${style.bg} ${
        isSmall ? 'gap-x-1 px-2 py-0.5' : 'gap-x-1.5 px-2.5 py-1'
      }`}>
      <Ionicons name={style.icon} size={isSmall ? 12 : 14} color={style.tint} />
      <Text className={`font-pmedium ${isSmall ? 'text-xs' : 'text-sm'} ${style.text}`}>
        {style.label}
        {count != null && count > 0 ? ` · ${count}` : ''}
      </Text>
    </View>
  );
};

export default VerdictPill;
