// src/features/payments/components/PaymentTimer.tsx
// Extracted verbatim from the original `pendingPayments.tsx` — pure
// presentational countdown badge, no behavior change.
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

const PaymentTimer = ({ createdAt }: { createdAt: string }) => {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    isUrgent: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, isExpired: false, isUrgent: false });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const created = moment.utc(createdAt);
      const expiry = created.clone().add(24, 'hours');
      const now = moment.utc();
      const diff = expiry.diff(now);

      if (diff <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, isExpired: true, isUrgent: false });
        return;
      }

      const duration = moment.duration(diff);
      const hours = Math.floor(duration.asHours());
      const minutes = duration.minutes();
      const seconds = duration.seconds();
      const isUrgent = diff <= 3 * 60 * 60 * 1000;

      setTimeRemaining({ hours, minutes, seconds, isExpired: false, isUrgent });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  const getTimerColor = () => {
    if (timeRemaining.isExpired) return 'text-red-600';
    if (timeRemaining.isUrgent) return 'text-orange-600';
    return 'text-green-600';
  };

  const getTimerBgColor = () => {
    if (timeRemaining.isExpired) return 'bg-red-50 border-red-200';
    if (timeRemaining.isUrgent) return 'bg-orange-50 border-orange-200';
    return 'bg-green-50 border-green-200';
  };

  const getTimerIcon = () => {
    if (timeRemaining.isExpired) return 'time';
    if (timeRemaining.isUrgent) return 'timer';
    return 'time-outline';
  };

  const formatTime = () => {
    if (timeRemaining.isExpired) return 'Expired';

    const { hours, minutes, seconds } = timeRemaining;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <View className={`flex-row items-center rounded-lg border px-2 py-1 ${getTimerBgColor()}`}>
      <Ionicons
        name={getTimerIcon()}
        size={12}
        color={timeRemaining.isExpired ? '#DC2626' : timeRemaining.isUrgent ? '#EA580C' : '#059669'}
        style={{ marginRight: 4 }}
      />
      <Text className={`font-pmedium text-xs ${getTimerColor()}`}>{formatTime()}</Text>
    </View>
  );
};

export default PaymentTimer;
