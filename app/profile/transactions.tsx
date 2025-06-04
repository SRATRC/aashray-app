import {
  View,
  Text,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useGlobalContext } from '../../context/GlobalProvider';
import { icons } from '../../constants';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../../components/PageHeader';
import CustomEmptyMessage from '../../components/CustomEmptyMessage';
import handleAPICall from '../../utils/HandleApiCall';
import CustomErrorMessage from '~/components/CustomErrorMessage';
import CustomSelectBottomSheet from '../../components/CustomSelectBottomSheet';
import moment from 'moment';

const Transactions = () => {
  const { user } = useGlobalContext();
  // State to manage both status and category filters
  const [filters, setFilters] = useState({ status: 'all', category: 'all' });
  const [refreshing, setRefreshing] = useState(false);

  // Define options for status filters - formatted for CustomSelectBottomSheet
  const statusOptions = useMemo(
    () => [
      {
        key: 'all',
        value: 'All Transactions',
      },
      {
        key: 'completed',
        value: 'Completed',
      },
      {
        key: 'pending',
        value: 'Pending',
      },
      {
        key: 'cancelled',
        value: 'Cancelled',
      },
      {
        key: 'failed',
        value: 'Failed',
      },
      {
        key: 'authorized',
        value: 'Authorized',
      },
      {
        key: 'credited',
        value: 'Credited',
      },
    ],
    []
  );

  // Define options for category filters - formatted for CustomSelectBottomSheet
  const categoryOptions = useMemo(
    () => [
      {
        key: 'all',
        value: 'All Categories',
      },
      {
        key: 'room',
        value: 'Room Booking',
      },
      {
        key: 'flat',
        value: 'Flat Booking',
      },
      {
        key: 'travel',
        value: 'Travel',
      },
      {
        key: 'adhyayan',
        value: 'Adhyayan',
      },
      {
        key: 'event',
        value: 'Event',
      },
      {
        key: 'breakfast',
        value: 'Breakfast',
      },
      {
        key: 'lunch',
        value: 'Lunch',
      },
      {
        key: 'dinner',
        value: 'Dinner',
      },
    ],
    []
  );

  const fetchTransactions = async ({ pageParam = 1 }) => {
    // Construct parameters based on current filters
    const params = {
      cardno: user.cardno,
      page: pageParam,
    };

    // Only add status to params if it's not 'all'
    if (filters.status !== 'all') {
      params.status = filters.status;
    }
    // Only add category to params if it's not 'all'
    if (filters.category !== 'all') {
      params.category = filters.category;
    }

    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/profile/transactions',
        params, // Pass the constructed params object
        null,
        (res: any) => {
          resolve(Array.isArray(res.data) ? res.data : []);
        },
        () => {},
        (error) => reject(new Error(error?.message || 'Failed to fetch transactions'))
      );
    });
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch }: any =
    useInfiniteQuery({
      // Update queryKey to include both status and category filters
      // This ensures data is refetched when filters change
      queryKey: ['transactions', user.cardno, filters.status, filters.category],
      queryFn: fetchTransactions,
      initialPageParam: 1,
      staleTime: 1000 * 60 * 30,
      getNextPageParam: (lastPage: any, pages: any) => {
        if (!lastPage || lastPage.length === 0) return undefined;
        return pages.length + 1;
      },
    });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // refetch will automatically use the current filters from the queryKey
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  // Handler for changing filter values - updated for bottom sheet
  const handleStatusChange = useCallback((value) => {
    setFilters((prev) => ({ ...prev, status: value }));
  }, []);

  const handleCategoryChange = useCallback((value) => {
    setFilters((prev) => ({ ...prev, category: value }));
  }, []);

  // Get display text for filter buttons
  const getStatusDisplayText = useCallback(() => {
    const option = statusOptions.find((opt) => opt.key === filters.status);
    return option ? option.value : 'All Transactions';
  }, [filters.status, statusOptions]);

  const getCategoryDisplayText = useCallback(() => {
    const option = categoryOptions.find((opt) => opt.key === filters.category);
    return option ? option.value : 'All Categories';
  }, [filters.category, categoryOptions]);

  // Beautiful Filter Card Component - FIXED FOR BEAUTY!
  const BeautifulFilterCard = ({ title, icon, isActive, displayText, children }) => {
    return (
      <View style={{ flex: 1 }}>
        <View
          // Combined Tailwind and inline styles for precise control
          className={`
            overflow-hidden rounded-2xl
            ${isActive ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white'}
            border-2
          `}
          style={{
            // Custom shadow for a more pronounced and beautiful effect when active
            shadowColor: isActive ? '#F1AC09' : '#000', // Active shadow color is amber, inactive is black
            shadowOffset: { width: 0, height: isActive ? 6 : 3 }, // More vertical lift for active state
            shadowOpacity: isActive ? 0.25 : 0.08, // Stronger opacity for active shadow
            shadowRadius: isActive ? 12 : 6, // Larger radius for active shadow
            elevation: isActive ? 10 : 4, // Increased elevation for Android
            position: 'relative', // Essential for the absolute overlay
          }}>
          {/* Icon Header */}
          <View className="flex-row items-center px-4 pb-2 pt-4">
            <View
              className={`
                h-9 w-9 rounded-full
                ${isActive ? 'bg-amber-500' : 'bg-gray-500'}
                mr-3 items-center justify-center
              `}>
              <Ionicons name={icon} size={20} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text
                className={`
                  text-xs font-semibold uppercase tracking-wide
                  ${isActive ? 'text-amber-700' : 'text-gray-600'}
                  mb-0.5
                `}
                numberOfLines={1}>
                {title}
              </Text>
              <Text
                className={`
                  text-base font-extrabold
                  ${isActive ? 'text-gray-900' : 'text-gray-800'}
                `}
                numberOfLines={1}>
                {displayText}
              </Text>
            </View>
            <Ionicons
              name="chevron-down" // Changed from 'chevron-down-circle' for a cleaner, modern look
              size={22}
              color={isActive ? '#F1AC09' : '#9CA3AF'}
            />
          </View>

          {/* Invisible overlay for CustomSelectBottomSheet
              This View with opacity: 0 allows the CustomSelectBottomSheet's internal
              TouchableOpacity to be rendered directly over the card visuals,
              making the entire card area clickable.
          */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0, // Cover the entire card area
              opacity: 0, // Makes it invisible but interactive
            }}>
            {children}
          </View>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: any }) => <TransactionItem item={item} />;

  return (
    <SafeAreaView className="h-full bg-gray-50" edges={['top']}>
      <FlashList
        className="flex-grow"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 20,
        }}
        data={data?.pages?.flatMap((page: any) => page) || []}
        estimatedItemSize={140}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        ListHeaderComponent={
          <View className="mb-4 flex-col">
            <View className="-mx-4 bg-white">
              <PageHeader title="Transaction History" />
            </View>
            {isError && <CustomErrorMessage />}

            {/* Modern Professional Filter Interface */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                marginTop: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 6,
                elevation: 2,
                borderWidth: 1,
                borderColor: '#F3F4F6',
              }}>
              {/* Filter Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                <Ionicons name="funnel-outline" size={18} color="#F1AC09" />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#1F2937',
                    marginLeft: 8,
                    flex: 1,
                  }}>
                  Filter Transactions
                </Text>

                {/* Clear Filters Button */}
                {(filters.status !== 'all' || filters.category !== 'all') && (
                  <TouchableOpacity
                    onPress={() => setFilters({ status: 'all', category: 'all' })}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      backgroundColor: '#FEF2F2',
                    }}
                    activeOpacity={0.7}>
                    <Ionicons name="refresh-outline" size={14} color="#EF4444" />
                    <Text
                      style={{
                        fontSize: 12,
                        color: '#EF4444',
                        marginLeft: 4,
                        fontWeight: '500',
                      }}>
                      Clear
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Beautiful Filter Cards Row */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: 12,
                }}>
                {/* Status Filter Card */}
                <BeautifulFilterCard
                  title="Status"
                  icon="pulse"
                  isActive={filters.status !== 'all'}
                  displayText={getStatusDisplayText()}>
                  <CustomSelectBottomSheet
                    options={statusOptions}
                    selectedValue={filters.status}
                    onValueChange={handleStatusChange}
                    placeholder="All Transactions"
                    label="Transaction Status"
                    saveKeyInsteadOfValue={true}
                    searchable={false}
                  />
                </BeautifulFilterCard>

                {/* Category Filter Card */}
                <BeautifulFilterCard
                  title="Category"
                  icon="apps"
                  isActive={filters.category !== 'all'}
                  displayText={getCategoryDisplayText()}>
                  <CustomSelectBottomSheet
                    options={categoryOptions}
                    selectedValue={filters.category}
                    onValueChange={handleCategoryChange}
                    placeholder="All Categories"
                    label="Transaction Category"
                    saveKeyInsteadOfValue={true}
                    searchable={false}
                  />
                </BeautifulFilterCard>
              </View>

              {/* Active Filters Summary */}
              {(filters.status !== 'all' || filters.category !== 'all') && (
                <View
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: '#F3F4F6',
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                    <View
                      style={{
                        backgroundColor: '#F1AC09',
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        marginRight: 8,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        color: '#6B7280',
                        flex: 1,
                      }}>
                      Active filters:{' '}
                      <Text style={{ fontWeight: '600', color: '#F1AC09' }}>
                        {[
                          filters.status !== 'all' ? getStatusDisplayText() : null,
                          filters.category !== 'all' ? getCategoryDisplayText() : null,
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </Text>
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        }
        ListFooterComponent={
          <View className="items-center pt-4">
            {(isFetchingNextPage || isLoading) && (
              <ActivityIndicator size="small" color="#6B7280" />
            )}
            {!hasNextPage && data?.pages?.[0]?.length > 0 && (
              <Text className="text-sm text-gray-500">No more transactions</Text>
            )}
          </View>
        }
        ListEmptyComponent={() => (
          <View className="h-full flex-1 items-center justify-center pt-40">
            {isError ? (
              <View className="items-center justify-center px-6">
                <Text className="mb-2 text-center text-lg font-semibold text-gray-800">
                  Oops! Something went wrong
                </Text>
                <Text className="mb-6 text-center text-gray-600">
                  Unable to load content. Please check your connection and try again.
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
                message="You don't have any transactions yet"
                containerClassName="py-12 items-center justify-center"
              />
            )}
          </View>
        )}
        onEndReachedThreshold={0.1}
        onEndReached={() => hasNextPage && fetchNextPage()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
};

const TransactionItem = ({ item }: { item: any }) => {
  const getCategoryIcon = useMemo(() => {
    const categoryIconMap: Record<string, any> = {
      room: icons.room,
      flat: icons.room,
      travel: icons.travel,
      adhyayan: icons.adhyayan,
      utsav: icons.events,
      event: icons.events,
      breakfast: icons.food,
      lunch: icons.food,
      dinner: icons.food,
      miscellaneous: icons.miscellaneousTransaction,
    };
    return categoryIconMap[item.category] || icons.miscellaneousTransaction;
  }, [item.category]);

  const getStatusStyles = useMemo(() => {
    const styleMap: Record<string, { textColor: string; bgColor: string; text: string }> = {
      pending: { textColor: 'text-amber-600', bgColor: 'bg-amber-50', text: 'Pending' },
      captured: { textColor: 'text-green-600', bgColor: 'bg-green-50', text: 'Completed' },
      completed: { textColor: 'text-green-600', bgColor: 'bg-green-50', text: 'Completed' },
      cancelled: { textColor: 'text-red-600', bgColor: 'bg-red-50', text: 'Cancelled' },
      failed: { textColor: 'text-red-600', bgColor: 'bg-red-50', text: 'Failed' },
      authorized: { textColor: 'text-blue-600', bgColor: 'bg-blue-50', text: 'Authorized' },
      credited: { textColor: 'text-green-600', bgColor: 'bg-green-50', text: 'Credited' },
    };
    return (
      styleMap[item.status] || {
        textColor: 'text-gray-600',
        bgColor: 'bg-gray-50',
        text: item.status || 'Unknown',
      }
    );
  }, [item.status]);

  const getCategoryName = useMemo(() => {
    const categoryNameMap: Record<string, string> = {
      room: 'Room Booking',
      flat: 'Flat Booking',
      travel: 'Travel',
      adhyayan: 'Adhyayan',
      utsav: 'Event',
      event: 'Event',
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      miscellaneous: 'Miscellaneous',
    };
    return categoryNameMap[item.category] || 'Transaction';
  }, [item.category]);

  const getItemTitle = useMemo(() => {
    return item.name || getCategoryName;
  }, [item.name, getCategoryName]);

  const formatDateRange = useMemo(() => {
    if (!item.start_day) return null;

    const startDate = moment(item.start_day);
    const endDate = moment(item.end_day);

    if (item.end_day && !startDate.isSame(endDate, 'day')) {
      return `${startDate.format('DD MMM')} - ${endDate.format('DD MMM YYYY')}`;
    }

    return startDate.format('DD MMM YYYY');
  }, [item.start_day, item.end_day]);

  const getDuration = useMemo(() => {
    if (!item.start_day || !item.end_day) return null;

    const start = moment(item.start_day);
    const end = moment(item.end_day);
    const days = end.diff(start, 'days') + 1;

    return days === 1 ? '1 day' : `${days} days`;
  }, [item.start_day, item.end_day]);

  const displayAmount = useMemo(() => {
    const finalAmount = item.amount - (item.discount || 0);
    const isCredit = item.status === 'credited' || finalAmount < 0;
    return {
      amount: Math.abs(finalAmount),
      isCredit,
      textColor: isCredit ? 'text-green-600' : 'text-gray-900',
      prefix: isCredit ? '+' : '',
    };
  }, [item.amount, item.discount, item.status]);

  const categoryColors = {
    bg: 'bg-secondary-50',
    text: 'text-gray-700',
    border: 'border-secondary-50',
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      className="mb-3 rounded-xl border border-gray-200 bg-white"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
      }}>
      <View className="p-4">
        <View className="mb-3 flex-row items-start justify-between">
          <View className="flex-1 flex-row items-start">
            <View
              className={`mr-3 rounded-full ${categoryColors.bg} ${categoryColors.border} border`}>
              <Image source={getCategoryIcon} className="h-10 w-10" resizeMode="contain" />
            </View>
            <View className="flex-1">
              <Text
                className="font-psemibold text-sm leading-tight text-gray-900"
                numberOfLines={2}>
                {getItemTitle}
              </Text>
              <Text className="mt-1 font-pbold text-lg text-gray-900">
                {displayAmount.prefix}₹{displayAmount.amount.toLocaleString()}
              </Text>
            </View>
          </View>

          <View className="ml-2">
            <View className={`rounded-full px-2 py-1 ${getStatusStyles.bgColor}`}>
              <Text className={`font-pmedium text-xs ${getStatusStyles.textColor}`}>
                {getStatusStyles.text}
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-3 h-px bg-gray-200" />

        <View className="gap-y-2">
          {formatDateRange && (
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={14} color="#6B7280" style={{ marginRight: 6 }} />
              <Text className="font-pregular text-xs text-gray-600">{formatDateRange}</Text>
              {getDuration && (
                <Text className="ml-2 font-pregular text-xs text-gray-500">• {getDuration}</Text>
              )}
            </View>
          )}

          {item.booked_for_name && (
            <View className="flex-row items-center">
              <Ionicons
                name="person-outline"
                size={14}
                color="#6B7280"
                style={{ marginRight: 6 }}
              />
              <Text className="font-pregular text-xs text-gray-600">
                Booked for {item.booked_for_name}
              </Text>
            </View>
          )}

          <View className="flex-row items-center">
            <Ionicons
              name="calendar-outline"
              size={14}
              color="#6B7280"
              style={{ marginRight: 6 }}
            />
            <Text className="font-pregular text-xs text-gray-600">
              Transaction on {moment(item.createdAt).format('DD MMM YYYY [at] hh:mm A')}
            </Text>
          </View>

          {item.description && (
            <View className="flex-row items-start">
              <Ionicons
                name="document-text-outline"
                size={14}
                color="#6B7280"
                style={{ marginRight: 6, marginTop: 1 }}
              />
              <Text className="flex-1 font-pregular text-xs text-gray-600">{item.description}</Text>
            </View>
          )}

          {item.discount > 0 && (
            <View className="flex-row items-center">
              <Ionicons
                name="pricetag-outline"
                size={14}
                color="#059669"
                style={{ marginRight: 6 }}
              />
              <Text className="font-pregular text-xs text-gray-600">
                Original: ₹{item.amount.toLocaleString()}
              </Text>
              <Text className="ml-2 font-pregular text-xs text-green-600">
                Saved: ₹{item.discount.toLocaleString()}
              </Text>
            </View>
          )}

          <View className="flex-row items-center justify-between pt-1">
            <View
              className={`rounded-full border px-2 py-1 ${categoryColors.bg} ${categoryColors.border}`}>
              <Text className={`font-pmedium text-xs capitalize ${categoryColors.text}`}>
                {item.category}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default Transactions;
