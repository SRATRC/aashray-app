import {
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { colors, icons } from '@/constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useAuthStore } from '@/stores';
import PageHeader from '@/components/PageHeader';
import handleAPICall from '@/utils/HandleApiCall';
import CustomButton from '@/components/CustomButton';
import CustomErrorMessage from '@/components/CustomErrorMessage';

import moment from 'moment';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

const wifi = () => {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <SafeAreaView className="h-full items-center justify-center bg-white">
        <ActivityIndicator size="large" color={colors.orange} />
      </SafeAreaView>
    );
  }

  if (!user.cardno) {
    return (
      <SafeAreaView className="h-full items-center justify-center bg-white">
        <Text className="font-pregular text-lg text-red-500">Missing card number</Text>
      </SafeAreaView>
    );
  }

  // State management
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPermanentSubmitting, setIsPermanentSubmitting] = useState(false);

  // Fetch temporary WiFi passwords
  const fetchWifiPasswords = async () => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/wifi',
        {
          cardno: user.cardno,
        },
        null,
        (res: any) => {
          resolve(Array.isArray(res.data) ? res.data : []);
        },
        () => reject(new Error('Failed to fetch wifi passwords'))
      );
    });
  };

  // Fetch permanent WiFi code status
  const fetchPermanentWifiCode = async () => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/wifi/permanent',
        {
          cardno: user.cardno,
        },
        null,
        (res: any) => {
          resolve(Array.isArray(res.data) ? res.data : []);
        },
        () => reject(new Error('Failed to fetch permanent wifi code'))
      );
    });
  };

  const {
    isLoading,
    isError,
    error,
    data: wifiList,
    refetch,
  }: any = useQuery({
    queryKey: ['wifi', user.cardno],
    queryFn: fetchWifiPasswords,
    staleTime: 1000 * 60 * 30,
    enabled: !!user.cardno,
  });

  const {
    isLoading: isPermanentLoading,
    isError: isPermanentError,
    data: permanentWifiData,
    refetch: refetchPermanent,
  }: any = useQuery({
    queryKey: ['wifi-permanent', user.cardno],
    queryFn: fetchPermanentWifiCode,
    staleTime: 1000 * 60 * 30,
    enabled: !!user.cardno,
  });

  // Generate temporary WiFi code
  const generateNewWifiCode = async () => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/wifi/generate',
        { cardno: user.cardno },
        null,
        (res: any) => {
          resolve(res.data);
        },
        () => reject(new Error('Failed to generate new wifi code'))
      );
    });
  };

  // Request permanent WiFi code
  const requestPermanentWifiCode = async () => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'POST',
        '/wifi/permanent',
        null,
        { cardno: user.cardno },
        (res: any) => {
          resolve(res.data);
        },
        () => reject(new Error('Failed to request permanent wifi code'))
      );
    });
  };

  const handleGenerateCode = async () => {
    setIsSubmitting(true);
    try {
      await generateNewWifiCode();
      refetch();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to generate code',
        text2: error.message || 'Please try again',
        swipeable: false,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestPermanentCode = async () => {
    setIsPermanentSubmitting(true);
    try {
      await requestPermanentWifiCode();
      Toast.show({
        type: 'success',
        text1: 'Permanent WiFi code requested',
        text2: 'Your request is being reviewed',
        swipeable: false,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetchPermanent();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Request failed',
        text2: error.message || 'Please try again',
        swipeable: false,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsPermanentSubmitting(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([refetch(), refetchPermanent()]).finally(() => setRefreshing(false));
  }, [refetch, refetchPermanent]);

  // Render temporary WiFi code item with modern design
  const renderTemporaryItem = ({ item }: any) => {
    const copyToClipboard = async (text: any) => {
      await Clipboard.setStringAsync(text);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Toast.show({
        type: 'info',
        text1: 'WiFi code copied to clipboard',
        swipeable: false,
      });
    };

    return (
      <View
        className={`mx-4 mt-3 rounded-2xl bg-white ${Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'}`}>
        {/* Code Display */}
        <View className="rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="font-pregular text-sm text-gray-600">Temporary WiFi Code</Text>
              <Text className="font-psemibold text-lg text-black">{item.password}</Text>
            </View>
            <TouchableOpacity
              onPress={() => copyToClipboard(item.password)}
              className={`h-10 w-10 items-center justify-center rounded-full bg-white ${Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'}`}>
              <Image
                source={icons.copy}
                className="h-5 w-5"
                resizeMode="contain"
                tintColor={colors.gray_400}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Render permanent WiFi code section with modern design - FIXED VERSION
  const renderPermanentWifiSection = () => {
    const copyToClipboard = async (text: any) => {
      await Clipboard.setStringAsync(text);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Toast.show({
        type: 'info',
        text1: 'WiFi code copied to clipboard',
        swipeable: false,
      });
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'approved':
          return {
            bg: 'bg-green-50',
            text: 'text-green-600',
            border: 'border-green-200',
          };
        case 'rejected':
          return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' };
        case 'pending':
        default:
          return {
            bg: 'bg-amber-50',
            text: 'text-amber-600',
            border: 'border-amber-200',
          };
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'approved':
          return 'Approved';
        case 'rejected':
          return 'Rejected';
        case 'pending':
          return 'Pending Review';
      }
    };

    // Check if we should show the empty state (no requests at all)
    const shouldShowEmptyState = () => {
      return !permanentWifiData || permanentWifiData.length === 0;
    };

    // Check if we should show request button (no requests OR all rejected)
    const shouldShowRequestButton = () => {
      if (!permanentWifiData || permanentWifiData.length === 0) return true;

      // Show request button if all requests are rejected
      const allRejected = permanentWifiData.every((item: any) => item.status === 'rejected');
      return allRejected;
    };

    // Render individual permanent WiFi item
    const renderPermanentWifiItem = (item: any, index: number) => (
      <View
        key={item.id || index}
        className={`mb-4 rounded-2xl bg-white p-6 ${Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'}`}>
        <View className="mb-4 flex-row items-center justify-between">
          <View
            className={`flex-row items-center rounded-full px-3 py-1 ${getStatusColor(item.status).bg} ${getStatusColor(item.status).border} border`}>
            <Text className={`font-pmedium text-sm ${getStatusColor(item.status).text}`}>
              {getStatusText(item.status)}
            </Text>
          </View>
          {permanentWifiData.length > 1 && (
            <Text className="font-pregular text-xs text-gray-400">Request #{index + 1}</Text>
          )}
        </View>

        {item.status === 'approved' && item.code && (
          <>
            <View className="rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 py-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-pregular text-sm text-gray-600">Permanent WiFi Code</Text>
                  <Text className="font-psemibold text-lg text-black">{item.code}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => copyToClipboard(item.code)}
                  className={`h-10 w-10 items-center justify-center rounded-full bg-white ${Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'}`}>
                  <Image
                    source={icons.copy}
                    className="h-5 w-5"
                    resizeMode="contain"
                    tintColor={colors.gray_400}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View className="gap-y-3">
              <View className="flex-row items-center">
                <Text className="font-pregular text-sm text-gray-500">Approved on:</Text>
                <Text className="ml-2 font-pmedium text-sm text-black">
                  {moment(item.reviewed_at).format('Do MMMM, YYYY')}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="font-pregular text-sm text-gray-500">Validity:</Text>
                <View className="ml-2 rounded-full bg-green-100 px-2 py-1">
                  <Text className="font-pmedium text-xs text-green-700">Permanent</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {item.status === 'pending' && (
          <View className="gap-y-3">
            <Text className="font-pmedium text-black">
              Your permanent WiFi code request is being reviewed.
            </Text>
            <View className="flex-row items-center">
              <Text className="font-pregular text-sm text-gray-500">Requested on:</Text>
              <Text className="ml-2 font-pmedium text-sm text-black">
                {moment(item.requested_at).format('Do MMMM, YYYY')}
              </Text>
            </View>
          </View>
        )}

        {item.status === 'rejected' && (
          <View className="gap-y-3">
            <Text className="font-pmedium text-black">
              Your permanent WiFi code request was rejected.
            </Text>
            <View className="flex-row items-center">
              <Text className="font-pregular text-sm text-gray-500">Requested on:</Text>
              <Text className="ml-2 font-pmedium text-sm text-black">
                {moment(item.requested_at).format('Do MMMM, YYYY')}
              </Text>
            </View>
            {item.reviewed_at && (
              <View className="flex-row items-center">
                <Text className="font-pregular text-sm text-gray-500">Rejected on:</Text>
                <Text className="ml-2 font-pmedium text-sm text-black">
                  {moment(item.reviewed_at).format('Do MMMM, YYYY')}
                </Text>
              </View>
            )}
            {item.admin_comments && (
              <View className="mt-2 rounded-lg bg-red-50 p-3">
                <Text className="font-pregular text-sm text-gray-600">Admin Comments:</Text>
                <Text className="font-pmedium text-sm text-red-700">{item.admin_comments}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );

    return (
      <View>
        {/* Permanent Section Header */}
        <View className="mb-6 flex-row items-center px-4">
          <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-purple-100">
            <Text className="font-psemibold text-purple-600">🔒</Text>
          </View>
          <View className="flex-1">
            <Text className="font-psemibold text-lg text-black">Permanent WiFi Code</Text>
            <Text className="font-pregular text-sm text-gray-500">
              Long-term access without expiration
            </Text>
          </View>
        </View>

        {isPermanentLoading ? (
          <View
            className={`mx-4 items-center justify-center rounded-2xl bg-white p-8 ${Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'}`}>
            <ActivityIndicator size="large" color={colors.orange} />
            <Text className="mt-3 font-pregular text-sm text-gray-600">
              Loading permanent code...
            </Text>
          </View>
        ) : isPermanentError ? (
          <View
            className={`mx-4 rounded-2xl bg-white p-6 ${Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'}`}>
            <CustomErrorMessage />
          </View>
        ) : shouldShowEmptyState() ? (
          <View
            className={`mx-4 rounded-2xl bg-white p-6 ${Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'}`}>
            <View className="items-center">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Text className="text-2xl">📶</Text>
              </View>
              <Text className="mb-2 text-center font-pmedium text-black">
                No Permanent Code Yet
              </Text>
              <Text className="mb-6 text-center font-pregular text-sm text-gray-500">
                Request a permanent WiFi code for long-term access
              </Text>
              <CustomButton
                text={'Request Permanent Code'}
                handlePress={handleRequestPermanentCode}
                containerStyles={'px-6 py-3 min-h-[50px]'}
                textStyles={'text-sm font-pmedium text-white'}
                isLoading={isPermanentSubmitting}
              />
            </View>
          </View>
        ) : (
          <View className="mx-4">
            {/* Display all existing requests regardless of status */}
            {permanentWifiData &&
              permanentWifiData.map((item: any, index: number) =>
                renderPermanentWifiItem(item, index)
              )}

            {/* Show request button if user can request (new request or all are rejected) */}
            {shouldShowRequestButton() && (
              <View
                className={`mt-4 rounded-2xl bg-white p-6 ${Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'}`}>
                <View className="items-center">
                  <Text className="mb-4 text-center font-pmedium text-black">
                    {permanentWifiData.every((item: any) => item.status === 'rejected')
                      ? 'Request New Permanent Code'
                      : 'Request Permanent Code'}
                  </Text>
                  <CustomButton
                    text={
                      permanentWifiData.every((item: any) => item.status === 'rejected')
                        ? 'Request Again'
                        : 'Request Permanent Code'
                    }
                    handlePress={handleRequestPermanentCode}
                    containerStyles={'px-6 py-3 min-h-[50px]'}
                    textStyles={'text-sm font-pmedium text-white'}
                    isLoading={isPermanentSubmitting}
                  />
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderTemporarySection = () => (
    <View>
      {/* Temporary Code Section Header */}
      <View className="mt-2 flex-row items-center p-4">
        <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-blue-100">
          <Text className="font-psemibold text-blue-600">⏱️</Text>
        </View>
        <View className="flex-1">
          <Text className="font-psemibold text-lg text-black">Temporary WiFi Codes</Text>
          <Text className="font-pregular text-sm text-gray-500">
            {wifiList?.length > 0
              ? `${wifiList.length}/3 codes generated`
              : 'Generate temporary codes'}
          </Text>
        </View>
      </View>

      {wifiList?.length === 0 && (
        <View
          className={`mx-4 rounded-2xl bg-white p-6 ${Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'}`}>
          <View className="items-center">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Text className="text-2xl">📱</Text>
            </View>
            <Text className="mb-2 text-center font-pmedium text-black">No Temporary Codes Yet</Text>
            <Text className="mb-6 text-center font-pregular text-sm text-gray-500">
              Generate temporary WiFi codes for short-term access
            </Text>
            <CustomButton
              text={'Generate New Code'}
              handlePress={handleGenerateCode}
              containerStyles={'px-6 py-3 min-h-[50px]'}
              textStyles={'text-sm font-pmedium text-white'}
              isLoading={isSubmitting}
            />
          </View>
        </View>
      )}
    </View>
  );

  const renderTemporaryFooter = () => (
    <View className="mx-4 mt-4 pb-6">
      {isLoading && (
        <View className="items-center justify-center py-8">
          <ActivityIndicator size="large" color={colors.orange} />
          <Text className="mt-3 font-pregular text-sm text-gray-600">Loading codes...</Text>
        </View>
      )}
      {wifiList?.length !== 0 && !isLoading && (
        <View>
          <CustomButton
            text={'Generate WiFi Code'}
            handlePress={handleGenerateCode}
            containerStyles={'px-6 py-3 min-h-[50px]'}
            textStyles={'text-sm font-pmedium text-white'}
            isLoading={isSubmitting}
            isDisabled={wifiList?.length >= 3}
          />
          {wifiList?.length >= 3 && (
            <Text className="mt-2 text-center font-pregular text-xs text-gray-500">
              Maximum limit reached. Delete old codes to generate new ones.
            </Text>
          )}
        </View>
      )}
    </View>
  );

  const createUnifiedData = () => {
    const data = [];

    data.push({ type: 'permanent-section' });

    data.push({ type: 'temporary-header' });
    if (wifiList && wifiList.length > 0) {
      wifiList.forEach((item: any) => {
        data.push({ type: 'temporary-item', data: item });
      });
    }
    data.push({ type: 'temporary-footer' });

    return data;
  };

  const renderUnifiedItem = ({ item }: any) => {
    switch (item.type) {
      case 'temporary-header':
        return renderTemporarySection();
      case 'temporary-item':
        return renderTemporaryItem({ item: item.data });
      case 'temporary-footer':
        return renderTemporaryFooter();
      case 'permanent-section':
        return renderPermanentWifiSection();
      default:
        return null;
    }
  };

  if (isError && isPermanentError)
    return (
      <SafeAreaView className="h-full bg-white">
        <PageHeader title={'WiFi Passwords'} />
        <View className="flex-1 items-center justify-center px-4">
          <CustomErrorMessage />
        </View>
      </SafeAreaView>
    );

  return (
    <SafeAreaView className="h-full bg-gray-50">
      <PageHeader title={'WiFi Passwords'} />

      <FlashList
        className="flex-1"
        data={createUnifiedData()}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={200}
        renderItem={renderUnifiedItem}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
};

export default wifi;
