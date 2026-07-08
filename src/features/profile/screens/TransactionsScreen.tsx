// src/features/profile/screens/TransactionsScreen.tsx
import { FlashList } from '@shopify/flash-list';
import { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTransactions } from '../api';
import { TransactionItem } from '../components/TransactionItem';
import type { Transaction } from '../types';

import CustomEmptyMessage from '@/components/CustomEmptyMessage';
import PageHeader from '@/components/PageHeader';
import { useAuthStore } from '@/stores';

const TransactionsScreen = () => {
  const { user } = useAuthStore();
  const [selectedChip] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useTransactions(user.cardno, selectedChip);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const renderItem = ({ item }: { item: Transaction }) => <TransactionItem item={item} />;

  return (
    <SafeAreaView className="h-full" edges={['top']}>
      <PageHeader title="Transaction History" />
      <FlashList
        className="flex-grow"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 20,
        }}
        data={data?.pages?.flatMap((page) => page) || []}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        ListEmptyComponent={() => (
          <View className="h-full flex-1 items-center justify-center pt-40">
            {isError ? (
              <View className="items-center justify-center px-6">
                <Text className="mb-2 text-center text-lg font-semibold text-gray-800">
                  Oops! Something went wrong
                </Text>
                <Text className="mb-6 text-center text-gray-600">
                  Unable to load transactions. Please check your connection and try again.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    refetch();
                  }}
                  className="rounded-lg bg-secondary px-6 py-3"
                  activeOpacity={0.7}>
                  <Text className="font-semibold text-white">Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <CustomEmptyMessage message="No transactions at this moment!" />
            )}
          </View>
        )}
        ListFooterComponent={
          <View className="items-center pt-4">
            {(isFetchingNextPage || isLoading) && <ActivityIndicator size="small" />}
            {!hasNextPage && (data?.pages?.[0]?.length ?? 0) > 0 && (
              <Text className="text-sm text-gray-500">No more transactions</Text>
            )}
          </View>
        }
        onEndReachedThreshold={0.1}
        onEndReached={() => hasNextPage && fetchNextPage()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
};

export default TransactionsScreen;
