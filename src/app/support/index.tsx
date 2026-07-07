import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import moment from 'moment';
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CustomEmptyMessage from '@/src/components/CustomEmptyMessage';
import CustomTag from '@/src/components/CustomTag';
import PageHeader from '@/src/components/PageHeader';
import { ShadowButton } from '@/src/components/ShadowBox';
import { colors, icons } from '@/src/constants';
import { useRefetchOnFocus } from '@/src/hooks/useRefetchOnFocus';
import { useAuthStore } from '@/src/stores';
import handleAPICall from '@/src/utils/HandleApiCall';
import { getStatusColor } from '@/src/utils/ticketStatus';

const SupportHome = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = async ({ pageParam = 1 }) => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/tickets',
        {
          cardno: user.cardno,
          page: pageParam,
        },
        null,
        (res: any) => {
          resolve(Array.isArray(res.data) ? res.data : []);
        },
        () => {},
        (err: any) => reject(err)
      );
    });
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch }: any =
    useInfiniteQuery({
      queryKey: ['tickets', user.cardno],
      queryFn: fetchTickets,
      initialPageParam: 1,
      getNextPageParam: (lastPage: any, pages: any) => {
        if (!lastPage || lastPage.length === 0) return undefined;
        return pages.length + 1;
      },
      // Global default is refetchOnMount:false; refresh on mount so returning
      // to a remounted list reflects tickets created/updated elsewhere instead
      // of showing a stale cached page (useRefetchOnFocus skips its first pass).
      refetchOnMount: 'always',
    });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  useRefetchOnFocus(refetch);

  const renderItem = ({ item }: any) => {
    const statusStyle = getStatusColor(item.status);
    return (
      <ShadowButton
        className="mb-3 rounded-xl border border-gray-100 bg-white p-4"
        onPress={() => router.push(`/support/${item.id}`)}>
        <View className="flex-row items-start justify-between">
          <View className="mr-2 flex-1">
            <Text className="mb-1 font-psemibold text-base text-black">{item.service}</Text>
            <Text
              className="font-pregular text-sm text-gray-500"
              numberOfLines={2}
              ellipsizeMode="tail">
              {item.description}
            </Text>
          </View>
          <CustomTag
            text={item.status.toUpperCase()}
            textStyles={statusStyle.text}
            containerStyles={statusStyle.bg}
          />
        </View>
        <View className="mt-3 flex-row items-center justify-between">
          <Text className="font-pmedium text-xs text-gray-400">ID: #{item.id}</Text>
          <Text className="font-pmedium text-xs text-gray-400">
            {moment(item.createdAt).fromNow()}
          </Text>
        </View>
      </ShadowButton>
    );
  };

  const renderFooter = () => (
    <View className="items-center">
      {(isFetchingNextPage || isLoading) && <ActivityIndicator />}
      {!hasNextPage && data?.pages?.[0]?.length > 0 && <Text>No more tickets at the moment</Text>}
    </View>
  );

  const flatListRef = useRef<any>(null);

  // Only scroll to top on a genuine refetch/reset (pull-to-refresh, focus
  // refetch, query invalidation after creating a ticket) — not when
  // fetchNextPage legitimately grows the page count, which used to snap the
  // list back to the top right after the user scrolled down to load more.
  const prevPagesLengthRef = useRef(0);
  useEffect(() => {
    const pagesLength = data?.pages?.length ?? 0;
    if (!isFetchingNextPage && pagesLength > 0 && pagesLength <= prevPagesLengthRef.current) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
    prevPagesLengthRef.current = pagesLength;
  }, [data, isFetchingNextPage]);

  const tickets = data?.pages?.flatMap((page: any) => page) || [];
  // Ticket ids are random hex strings, not chronological — sort by createdAt
  // (newest first) to match the backend's default ordering.
  const sortedTickets = [...tickets].sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <SafeAreaView className="h-full w-full bg-white">
      <PageHeader title="Help & Support" />

      <FlashList
        ref={flatListRef}
        data={sortedTickets}
        renderItem={renderItem}
        keyExtractor={(item: any) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View className="h-full flex-1 items-center justify-center pt-40">
            {isError ? (
              <View className="items-center justify-center px-6">
                <Text className="mb-2 text-center text-lg font-semibold text-gray-800">
                  Oops! Something went wrong
                </Text>
                <Text className="mb-6 text-center text-gray-600">
                  Unable to load Tickets. Please check your connection and try again.
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
            ) : isLoading ? (
              // Don't flash "No tickets found" while the first page is still
              // loading (data is [] until it arrives).
              <ActivityIndicator />
            ) : (
              <CustomEmptyMessage
                message="Yay! No tickets found"
                imageClassName="h-[200px] w-[200px]"
              />
            )}
          </View>
        )}
        ListFooterComponent={renderFooter}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.1}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      <TouchableOpacity
        className="absolute bottom-8 right-6 rounded-full bg-secondary p-4"
        onPress={() => router.push('/support/create')}>
        <Image
          source={icons.add}
          tintColor={colors.white}
          className="h-6 w-6"
          resizeMode="contain"
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default SupportHome;
