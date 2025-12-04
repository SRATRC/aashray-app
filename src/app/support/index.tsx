import {
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useState, useCallback, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { colors, icons, images, status } from '@/src/constants';
import { useAuthStore } from '@/src/stores';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { ShadowButton } from '@/src/components/ShadowBox';
import PageHeader from '@/src/components/PageHeader';
import handleAPICall from '@/src/utils/HandleApiCall';
import CustomTag from '@/src/components/CustomTag';
import CustomEmptyMessage from '@/src/components/CustomEmptyMessage';
import moment from 'moment';

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
        () => reject(new Error('Failed to fetch tickets'))
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
    });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const getStatusColor = (ticketStatus: any) => {
    switch (ticketStatus) {
      case status.STATUS_OPEN:
        return { text: 'text-green-600', bg: 'bg-green-100' };
      case status.STATUS_IN_PROGRESS:
        return { text: 'text-orange-600', bg: 'bg-orange-100' };
      case status.STATUS_RESOLVED:
        return { text: 'text-blue-600', bg: 'bg-blue-100' };
      case status.STATUS_CLOSED:
        return { text: 'text-gray-600', bg: 'bg-gray-100' };
      default:
        return { text: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

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
            {moment(item.created_at).fromNow()}
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

  const flatListRef = useRef(null);

  useEffect(() => {
    if (!isFetchingNextPage && data?.pages?.[0]?.length) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [data, isFetchingNextPage]);

  const tickets = data?.pages?.flatMap((page: any) => page) || [];
  const sortedTickets = [...tickets].sort((a, b) => b.id - a.id);

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
            ) : (
              <CustomEmptyMessage
                message={'Yay! No tickets found'}
                image={images.happyFace}
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
        className="absolute bottom-8 right-6 rounded-2xl bg-secondary p-4"
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
