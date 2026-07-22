// src/features/maintenance/screens/MaintenanceListScreen.tsx
import { FlashList } from '@shopify/flash-list';
import moment from 'moment';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMaintenanceList } from '../api';
import CreateMaintenanceModal from '../components/CreateMaintenanceModal';
import type { MaintenanceRequest } from '../types';

import CustomChipGroup from '@/components/CustomChipGroup';
import CustomEmptyMessage from '@/components/CustomEmptyMessage';
import CustomTag from '@/components/CustomTag';
import ExpandableItem from '@/components/ExpandableItem';
import HorizontalSeparator from '@/components/HorizontalSeparator';
import PageHeader from '@/components/PageHeader';
import { colors, icons, status, types } from '@/constants';
import { useAuthStore } from '@/stores';

const CHIPS = [
  types.MAINTENANCE_TYPE_ALL,
  types.MAINTENANCE_TYPE_OPEN,
  types.MAINTENANCE_TYPE_CLOSED,
];

const MaintenanceListScreen = () => {
  const { user } = useAuthStore();

  const [selectedChip, setSelectedChip] = useState(types.MAINTENANCE_TYPE_ALL);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useMaintenanceList(user.cardno, selectedChip);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const renderItem = ({ item }: { item: MaintenanceRequest }) => (
    <ExpandableItem
      containerStyles="mt-3"
      visibleContent={
        <View className="flex flex-row items-center gap-x-4">
          <Image source={icons.id} className="h-10 w-10" resizeMode="contain" />
          <View className="flex-col gap-y-1">
            <View className="flex flex-row">
              <CustomTag
                text={item.status}
                textStyles={item.status === status.STATUS_OPEN ? 'text-red-200' : 'text-green-200'}
                containerStyles={item.status === status.STATUS_OPEN ? 'bg-red-100' : 'bg-green-100'}
              />
            </View>
            <View className="flex flex-row gap-x-2">
              <Text className="font-psemibold text-sm text-black">Maintenance ID:</Text>
              <Text
                className="font-psemibold text-sm text-secondary"
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{ maxWidth: '50%' }}>
                {item.bookingid}
              </Text>
            </View>
            <Text className="font-pmedium text-gray-400">
              {moment(item.createdAt).format('Do MMMM, YYYY')}
            </Text>
          </View>
        </View>
      }>
      <HorizontalSeparator />
      <View className="mt-2 flex flex-row gap-x-2 px-2 pb-2">
        <Image source={icons.department} className="h-4 w-4" resizeMode="contain" />
        <Text className="font-pregular text-gray-400">Department:</Text>
        <Text className="font-pmedium text-black">{item.department}</Text>
      </View>
      <View className="flex flex-row gap-x-2 px-2 pb-2">
        <Image source={icons.marker} className="h-4 w-4" resizeMode="contain" />
        <Text className="font-pregular text-gray-400">place:</Text>
        <Text className="font-pmedium text-black">{item.area_of_work}</Text>
      </View>
      <View className="flex flex-row gap-x-2 overflow-hidden px-2" style={{ maxWidth: '90%' }}>
        <Image source={icons.description} className="h-4 w-4" resizeMode="contain" />
        <Text className="font-pregular text-gray-400">Details:</Text>
        <Text className="font-pmedium text-black">{item.work_detail}</Text>
      </View>
    </ExpandableItem>
  );

  const renderHeader = () => (
    <View className="flex-col">
      <PageHeader title="Maintenance History" />
      <View className="mx-4 mb-6">
        <CustomChipGroup
          chips={CHIPS}
          selectedChip={selectedChip}
          handleChipPress={(chip) => setSelectedChip(chip)}
        />
      </View>
    </View>
  );

  const renderFooter = () => (
    <View className="items-center">
      {(isFetchingNextPage || isLoading) && <ActivityIndicator />}
      {!hasNextPage && (data?.pages?.[0]?.length ?? 0) > 0 && (
        <Text>No more bookings at the moment</Text>
      )}
    </View>
  );

  if (isError)
    return (
      <Text className="items-center justify-center font-pregular text-lg text-red-500">
        An error occurred
      </Text>
    );

  return (
    <SafeAreaView className="h-full w-full bg-white">
      <FlashList
        className="flex-grow-1"
        contentContainerStyle={{ padding: 10 }}
        data={data?.pages?.flatMap((page) => page) || []}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        keyExtractor={(item: MaintenanceRequest, index: number) =>
          item?.bookingid?.toString() ?? `idx-${index}`
        }
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <CustomEmptyMessage message="You dont have any maintenance requests yet" />
        }
        onEndReachedThreshold={0.1}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      <TouchableOpacity
        className="absolute bottom-8 right-6 rounded-2xl bg-secondary p-4"
        onPress={() => {
          setIsModalVisible(!isModalVisible);
        }}>
        <Image
          source={icons.add}
          tintColor={colors.white}
          className="h-6 w-6"
          resizeMode="contain"
        />
      </TouchableOpacity>

      <CreateMaintenanceModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} />
    </SafeAreaView>
  );
};

export default MaintenanceListScreen;
