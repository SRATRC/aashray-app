import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import moment from 'moment';
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  InteractionManager,
  Platform,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { usePendingTransactions, createPaymentOrder, paymentKeys } from '../api';
import PaymentsSummaryCard from '../components/PaymentsSummaryCard';
import PendingPaymentItem from '../components/PendingPaymentItem';
import type { Transaction } from '../types';

import CustomButton from '@/components/CustomButton';
import CustomEmptyMessage from '@/components/CustomEmptyMessage';
import CustomErrorMessage from '@/components/CustomErrorMessage';
import CustomModal from '@/components/CustomModal';
import PageHeader from '@/components/PageHeader';
import { colors } from '@/constants';
import { useAuthStore } from '@/stores';

const PendingPaymentsScreen = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const queryClient = useQueryClient();
  const [selectedPayments, setSelectedPayments] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInternationalWarning, setShowInternationalWarning] = useState(false);

  const { data, isLoading, isError, refetch } = usePendingTransactions(user.cardno);

  const processPaymentMutation = useMutation({
    mutationFn: async (data: { bookingid: string; category: string }[]) => {
      return createPaymentOrder(user.cardno, data);
    },
    onSuccess: () => {
      setSelectedPayments([]);
      queryClient.invalidateQueries({
        queryKey: paymentKeys.pending(user.cardno),
        refetchType: 'all',
        exact: true,
      });
    },
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const pendingPayments = useMemo(() => (data as Transaction[]) || [], [data]);
  const totalAmount = useMemo(
    () => selectedPayments.reduce((total, payment) => total + payment.amount, 0),
    [selectedPayments]
  );

  const isTransactionExpired = useCallback((transaction: Transaction) => {
    // Cash pending payments never expire
    if (transaction.status === 'cash pending') {
      return false;
    }

    const created = moment.utc(transaction.createdAt);
    const expiry = created.clone().add(24, 'hours');
    return moment.utc().isAfter(expiry);
  }, []);

  // Calculate total of non-expired payments
  const totalNonExpiredAmount = useMemo(() => {
    return pendingPayments
      .filter((payment) => !isTransactionExpired(payment))
      .reduce((total, payment) => total + payment.amount, 0);
  }, [pendingPayments, isTransactionExpired]);

  // Calculate total of expired payments
  const totalExpiredAmount = useMemo(() => {
    return pendingPayments
      .filter((payment) => isTransactionExpired(payment))
      .reduce((total, payment) => total + payment.amount, 0);
  }, [pendingPayments, isTransactionExpired]);

  const isPaymentAllowed = useMemo(() => {
    return totalNonExpiredAmount > 0;
  }, [totalNonExpiredAmount]);

  const isInternationalUser = useMemo(() => {
    return user.country !== 'India';
  }, [user.country]);

  const categoryStats = useMemo(() => {
    const stats = pendingPayments.reduce(
      (acc, item) => {
        const category = item.category || 'other';
        if (!acc[category]) {
          acc[category] = { count: 0, amount: 0, expiredCount: 0, expiredAmount: 0 };
        }
        acc[category].count += 1;
        acc[category].amount += item.amount;

        if (isTransactionExpired(item)) {
          acc[category].expiredCount += 1;
          acc[category].expiredAmount += item.amount;
        }
        return acc;
      },
      {} as Record<
        string,
        { count: number; amount: number; expiredCount: number; expiredAmount: number }
      >
    );

    return Object.entries(stats).map(([category, data]) => ({
      category,
      ...data,
    }));
  }, [pendingPayments, isTransactionExpired]);

  const validPayments = useMemo(() => {
    return pendingPayments.filter((payment) => !isTransactionExpired(payment));
  }, [pendingPayments, isTransactionExpired]);

  const allSelected = useMemo(
    () => validPayments.length > 0 && selectedPayments.length === validPayments.length,
    [selectedPayments, validPayments]
  );

  const handleSelectPayment = useCallback(
    (payment: Transaction) => {
      if (!isPaymentAllowed) return;

      if (isTransactionExpired(payment)) {
        Toast.show({
          type: 'error',
          text1: 'Payment expired',
          text2: 'This payment window has expired',
          swipeable: false,
        });
        return;
      }

      setSelectedPayments((prev) => {
        const isSelected = prev.some(
          (item) => item.bookingid === payment.bookingid && item.category === payment.category
        );
        const newSelection = isSelected
          ? prev.filter(
              (item) => item.bookingid !== payment.bookingid || item.category !== payment.category
            )
          : [...prev, payment];
        return newSelection;
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [isPaymentAllowed, isTransactionExpired]
  );

  const handleSelectAll = useCallback(() => {
    if (!isPaymentAllowed || pendingPayments.length === 0) return;

    const validPayments = pendingPayments.filter((payment) => !isTransactionExpired(payment));
    setSelectedPayments(allSelected ? [] : validPayments);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [pendingPayments, allSelected, isPaymentAllowed, isTransactionExpired]);

  const proceedWithPayment = async () => {
    // Dismiss the modal first (if shown) to avoid native modal conflicts
    setShowInternationalWarning(false);

    // Prevent double invocations while in-flight
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const paymentData = selectedPayments.map((payment) => ({
        bookingid: payment.bookingid,
        category: payment.category,
      }));

      const result = (await processPaymentMutation.mutateAsync(paymentData)) as any;

      if (result.data?.amount === 0) {
        Toast.show({
          type: 'success',
          text1: 'Payment processed successfully',
          swipeable: false,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      const options = {
        key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID,
        name: 'Vitraag Vigyaan Aashray',
        image: 'https://vitraagvigyaan.org/img/logo.png',
        description: `Payment for ${selectedPayments.length} item${selectedPayments.length > 1 ? 's' : ''}`,
        amount: result.data.amount,
        currency: 'INR',
        order_id: result.data.id,
        prefill: {
          email: user.email,
          contact: user.mobno,
          name: user.issuedto,
        },
        theme: { color: colors.orange },
      } as const;

      // Ensure RN Modal has fully dismissed and UI interactions have settled
      await new Promise<void>((resolve) =>
        InteractionManager.runAfterInteractions(() => resolve())
      );
      await new Promise((resolve) => setTimeout(resolve, Platform.OS === 'android' ? 200 : 100));

      await RazorpayCheckout.open(options);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Payment successful',
        swipeable: false,
      });
      queryClient.invalidateQueries({
        queryKey: paymentKeys.pending(user.cardno),
        refetchType: 'all',
        exact: true,
      });
      router.replace('/paymentConfirmation');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (error?.message) {
        Toast.show({
          type: 'error',
          text1: 'Failed to process payment',
          text2: error.message,
          swipeable: false,
        });
      }
      router.replace('/paymentFailed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (isSubmitting) return; // guard

    if (!isPaymentAllowed) {
      Toast.show({
        type: 'error',
        text1: 'Payment not available',
        text2: 'No payments required',
        swipeable: false,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (selectedPayments.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No payments selected',
        text2: 'Please select at least one payment to proceed',
        swipeable: false,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const expiredPayments = selectedPayments.filter((payment) => isTransactionExpired(payment));
    if (expiredPayments.length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Some payments have expired',
        text2: 'Please remove expired payments from selection',
        swipeable: false,
      });
      return;
    }

    // Show warning for international users
    if (isInternationalUser) {
      setShowInternationalWarning(true);
      return;
    }

    // Proceed directly for Indian users
    await proceedWithPayment();
  };

  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => {
      const isSelected = selectedPayments.some(
        (payment) => payment.bookingid === item.bookingid && payment.category === item.category
      );
      const isExpired = isTransactionExpired(item);

      return (
        <PendingPaymentItem
          item={item}
          isSelected={isSelected}
          isExpired={isExpired}
          onPress={() => handleSelectPayment(item)}
        />
      );
    },
    [selectedPayments, handleSelectPayment, isTransactionExpired]
  );

  const SummaryCard = useCallback(() => {
    if (!pendingPayments.length) return null;

    const validPayments = pendingPayments.filter((payment) => !isTransactionExpired(payment));
    const expiredCount = pendingPayments.length - validPayments.length;

    return (
      <PaymentsSummaryCard
        totalItemsCount={pendingPayments.length}
        validPaymentsCount={validPayments.length}
        expiredCount={expiredCount}
        totalNonExpiredAmount={totalNonExpiredAmount}
        totalExpiredAmount={totalExpiredAmount}
        categoryStats={categoryStats}
      />
    );
  }, [
    pendingPayments.length,
    totalNonExpiredAmount,
    totalExpiredAmount,
    categoryStats,
    isTransactionExpired,
  ]);

  const ListHeader = useCallback(() => {
    if (!pendingPayments.length) return null;

    const validPayments = pendingPayments.filter((payment) => !isTransactionExpired(payment));

    return (
      <View className="mb-2">
        <SummaryCard />

        {isInternationalUser && (
          <View className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <View className="flex-row items-start">
              <MaterialIcons
                name="info-outline"
                size={18}
                color="#D97706"
                style={{ marginRight: 8, marginTop: 2 }}
              />
              <View className="flex-1">
                <Text className="mb-1 font-psemibold text-xs text-amber-800">
                  International Payment Notice
                </Text>
                <Text className="font-pregular text-xs text-amber-700">
                  You are attempting to make a payment from {user.country}. Unfortunately, we do not
                  accept payments from outside India.
                </Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSelectAll}
          activeOpacity={isPaymentAllowed ? 0.6 : 1}
          disabled={!isPaymentAllowed || validPayments.length === 0}
          className={`mb-4 flex-row items-center rounded-xl p-3 ${
            !isPaymentAllowed || validPayments.length === 0 ? 'opacity-50' : ''
          }`}>
          <View
            className={`mr-3 h-6 w-6 items-center justify-center rounded-full border-2 ${
              allSelected && isPaymentAllowed
                ? 'border-secondary bg-secondary-50'
                : !isPaymentAllowed
                  ? 'border-gray-300 bg-gray-100'
                  : 'border-gray-400 bg-white'
            }`}>
            {allSelected && isPaymentAllowed && <Ionicons name="checkmark" size={14} />}
          </View>
          <Text
            className={`font-pmedium text-sm ${
              !isPaymentAllowed || validPayments.length === 0 ? 'text-gray-400' : 'text-gray-900'
            }`}>
            {allSelected ? 'Deselect All' : 'Select All'} ({validPayments.length} valid items)
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [
    pendingPayments.length,
    allSelected,
    handleSelectAll,
    isPaymentAllowed,
    isInternationalUser,
    user.country,
    SummaryCard,
    isTransactionExpired,
  ]);

  return (
    <SafeAreaView className="h-full" edges={['top']}>
      <PageHeader title="Pending Payments" />

      {isError && (
        <View className="flex-1 items-center justify-center">
          <CustomErrorMessage errorTitle="Error" errorMessage="Failed to fetch pending payments" />
        </View>
      )}

      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F1AC09" />
          <Text className="mt-3 font-pregular text-sm text-gray-600">Loading your payments...</Text>
        </View>
      )}

      {!isLoading && !isError && (
        <FlashList
          className="flex-grow"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom:
              selectedPayments.length > 0 && isPaymentAllowed ? 120 + insets.bottom : 20,
          }}
          data={pendingPayments}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View className="h-full flex-1 items-center justify-center pt-40">
              <CustomEmptyMessage message={`Look at you,\nfinancially responsible superstar!`} />
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyExtractor={(item) => `${item.bookingid}-${item.category}-${item.createdAt}`}
          extraData={[selectedPayments, isPaymentAllowed]}
        />
      )}

      {selectedPayments.length > 0 && isPaymentAllowed && (
        <View className="absolute bottom-0 left-0 right-0">
          <View
            className="rounded-t-xl border-t border-gray-200 bg-white shadow-lg"
            style={{ paddingBottom: insets.bottom }}>
            <View className="p-4">
              <View className="mb-3 flex-row items-center justify-between">
                <View>
                  <Text className="font-pregular text-xs text-gray-600">
                    {selectedPayments.length} {selectedPayments.length === 1 ? 'item' : 'items'}{' '}
                    selected
                  </Text>
                  <Text className="font-pbold text-lg text-gray-900">
                    ₹ {totalAmount.toLocaleString()}
                  </Text>
                </View>
                <View className="rounded-lg border border-secondary bg-secondary-50 px-3 py-1.5">
                  <Text className="font-pmedium text-xs text-gray-800">
                    {isInternationalUser ? 'International Payment' : 'Ready to pay'}
                  </Text>
                </View>
              </View>
              <CustomButton
                text={`Proceed to Payment • ₹${totalAmount.toLocaleString()}`}
                handlePress={handleProceedToPayment}
                containerStyles="min-h-[48px]"
                textStyles="font-psemibold text-sm text-white"
                isLoading={isSubmitting}
              />
            </View>
          </View>
        </View>
      )}

      <CustomModal
        visible={showInternationalWarning}
        onClose={() => setShowInternationalWarning(false)}
        title="Warning"
        showActionButton={false}>
        <View>
          <View className="mb-4">
            <View className="mb-4 items-center">
              <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <Ionicons name="warning" size={32} color="#F59E0B" />
              </View>
            </View>

            <Text className="mb-3 text-center font-pregular text-sm text-gray-700">
              You are attempting to make a payment from{' '}
              <Text className="font-psemibold">{user.country}</Text>.
            </Text>

            <View className="rounded-lg bg-amber-50 p-3">
              <Text className="mb-2 font-pmedium text-xs text-amber-900">
                Important Information:
              </Text>
              <Text className="mb-1 font-pregular text-xs text-amber-800">
                We currently do not support international payments. If you intend to pay using an
                Indian bank account, you may proceed with the payment.
              </Text>
            </View>
          </View>

          <View className="gap-y-3">
            <CustomButton
              text="I Understand, Proceed"
              handlePress={proceedWithPayment}
              containerStyles="min-h-[44px]"
              textStyles="font-psemibold text-sm text-white"
              isLoading={isSubmitting}
            />
          </View>
        </View>
      </CustomModal>
    </SafeAreaView>
  );
};

export default PendingPaymentsScreen;
