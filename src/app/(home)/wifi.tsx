import { View, Text, RefreshControl, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/stores';
import { status } from '@/src/constants';
import { FontAwesome5 } from '@expo/vector-icons';
import PageHeader from '@/src/components/PageHeader';
import handleAPICall from '@/src/utils/HandleApiCall';
import CustomErrorMessage from '@/src/components/CustomErrorMessage';
import PermanentWifiSection from '@/src/components/PermanentWifiSection';
import TemporaryWifiSection from '@/src/components/TemporaryWifiSection';
import ExpandableItem from '@/src/components/ExpandableItem';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';

const wifiTutorials = {
  mumukshu: [
    {
      title: '1. Request a new password',
      apple: 'https://aashray.vitraagvigyaan.org/go/wifiit1',
      android: 'https://aashray.vitraagvigyaan.org/go/wifiat1',
    },
    {
      title: '2. Login',
      apple: 'https://aashray.vitraagvigyaan.org/go/wifiit2',
      android: 'https://aashray.vitraagvigyaan.org/go/wifiat2',
    },
    {
      title: '3. Troubleshooting/Reset password',
      apple: 'https://aashray.vitraagvigyaan.org/go/wifiit3',
      android: 'https://aashray.vitraagvigyaan.org/go/wifiat3',
    },
    {
      title: 'Full Tutorial Playlist',
      apple: 'https://aashray.vitraagvigyaan.org/go/wifiit',
      android: 'https://aashray.vitraagvigyaan.org/go/wifiat',
    },
  ],
  residents: [
    {
      title: '1. Request a new password',
      apple: 'https://aashray.vitraagvigyaan.org/go/wifiip1',
      android: 'https://aashray.vitraagvigyaan.org/go/wifiap1',
    },
    {
      title: '2. Login',
      apple: 'https://aashray.vitraagvigyaan.org/go/wifiip2',
      android: 'https://aashray.vitraagvigyaan.org/go/wifiap2',
    },
    {
      title: '3. Troubleshooting/Reset password',
      apple: 'https://aashray.vitraagvigyaan.org/go/wifiip3',
      android: 'https://aashray.vitraagvigyaan.org/go/wifiap3',
    },
    {
      title: 'Full Tutorial Playlist',
      apple: 'https://aashray.vitraagvigyaan.org/go/wifiip',
      android: 'https://aashray.vitraagvigyaan.org/go/wifiap',
    },
  ],
};

const Wifi = () => {
  const { user } = useAuthStore();
  const isResidentOrSevakutir =
    user.res_status === status.STATUS_RESIDENT || user.res_status === status.STATUS_SEVA_KUTIR;

  // State management
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPermanentSubmitting, setIsPermanentSubmitting] = useState(false);
  const [isResettingCode, setIsResettingCode] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

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
        () => { },
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
        () => { },
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
        () => {
          setIsSubmitting(false);
        },
        () => reject(new Error('Failed to generate new wifi code'))
      );
    });
  };

  // Request permanent WiFi code
  const requestPermanentWifiCode = async (data: { deviceType: string }) => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'POST',
        '/wifi/permanent',
        null,
        { cardno: user.cardno, ...data },
        (res: any) => {
          resolve(res.data);
        },
        () => {
          setIsPermanentSubmitting(false);
        }
      );
    });
  };

  // Reset permanent WiFi code
  const resetPermanentWifiCode = async (id: string) => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'POST',
        '/wifi/permanent/reset',
        null,
        {
          id: id,
          cardno: user.cardno,
        },
        (res: any) => {
          resolve(res.data);
        },
        () => {
          setIsResettingCode(false);
        }
      );
    });
  };

  // Handler for generating temporary code
  const handleGenerateCode = async () => {
    setIsSubmitting(true);
    try {
      await generateNewWifiCode();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();
    } catch (error) {
      console.error('Error generating code:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for requesting permanent code
  const handleRequestPermanentCode = async (
    data: { deviceType: string },
    onSuccess?: () => void
  ) => {
    setIsPermanentSubmitting(true);
    try {
      await requestPermanentWifiCode(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (onSuccess) onSuccess();
      refetchPermanent();
    } catch (error) {
      console.error('Error requesting permanent code:', error);
    } finally {
      setIsPermanentSubmitting(false);
    }
  };

  // Handler for resetting permanent code
  const handleResetPermanentCode = async (id: string) => {
    setIsResettingCode(true);
    try {
      await resetPermanentWifiCode(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetchPermanent();
    } catch (error) {
      console.error('Error resetting permanent code:', error);
    } finally {
      setIsResettingCode(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([refetch(), refetchPermanent()]).finally(() => setRefreshing(false));
  }, [refetch, refetchPermanent]);

  const handleInfoPress = () => {
    setShowInfoModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCloseModal = () => {
    setShowInfoModal(false);
  };

  const renderTutorialItem = (title: string, appleUrl: string, androidUrl: string) => {
    const handleOpenLink = (url: string) => {
      Linking.openURL(url);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    return (
      <View key={title} className="mb-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <Text className="font-psemibold text-sm text-gray-800 mb-3">{title}</Text>
        <View className="flex-row gap-x-3">
          <TouchableOpacity
            onPress={() => handleOpenLink(appleUrl)}
            className="flex-1 flex-row items-center justify-center gap-x-2 rounded-xl bg-gray-50 border border-gray-200 py-3 active:bg-gray-100">
            <FontAwesome5 name="apple" size={14} color="#374151" />
            <Text className="font-pmedium text-xs text-gray-700">Apple / iOS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleOpenLink(androidUrl)}
            className="flex-1 flex-row items-center justify-center gap-x-2 rounded-xl bg-green-50 border border-green-200 py-3 active:bg-green-100">
            <FontAwesome5 name="android" size={13} color="#16a34a" />
            <Text className="font-pmedium text-xs text-green-700">Android</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="h-full bg-white-100" edges={['top', 'left', 'right']}>
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <PageHeader title={'WiFi Passwords'} />

        {isError && isPermanentError && (
          <View className="flex-1 items-center justify-center px-4">
            <CustomErrorMessage errorTitle="An Error Occurred" errorMessage={error?.message} />
          </View>
        )}

        {!isError && !isPermanentError && (
          <>
            <PermanentWifiSection
              data={permanentWifiData}
              isLoading={isPermanentLoading}
              isError={isPermanentError}
              isSubmitting={isPermanentSubmitting}
              onRequestCode={handleRequestPermanentCode}
              onInfoPress={handleInfoPress}
              onResetCode={handleResetPermanentCode}
              isResettingCode={isResettingCode}
              isResidentOrSevakutir={isResidentOrSevakutir}
            />

            {!isResidentOrSevakutir && (
              <TemporaryWifiSection
                codes={wifiList}
                isLoading={isLoading}
                isGenerating={isSubmitting}
                isError={isError}
                maxCodes={1}
                onGenerateCode={handleGenerateCode}
              />
            )}
          </>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        visible={showInfoModal}
        presentationStyle="pageSheet"
        statusBarTranslucent={true}>
        <SafeAreaView className="flex-1">
          <PageHeader title={'WiFi Instructions'} iconName="times" onPress={handleCloseModal} />
          <ScrollView className="flex-1">
            <View className="gap-y-2 p-4">
              {/* Bullet Points Section */}
              <View className="gap-y-3 px-1 mb-4">
                <View className="flex-row items-start gap-x-2.5">
                  <Text className="text-gray-400 mt-0.5">•</Text>
                  <Text className="flex-1 font-pregular text-sm text-gray-600 leading-5">
                    Each password is for <Text className="font-psemibold text-gray-900">1 device only</Text>.
                  </Text>
                </View>

                <View className="flex-row items-start gap-x-2.5">
                  <Text className="text-gray-400 mt-0.5">•</Text>
                  <Text className="flex-1 font-pregular text-sm text-gray-600 leading-5">
                    Please allow us 7-10 days to process your request for permanent code.
                  </Text>
                </View>

                <View className="flex-row items-start gap-x-2.5">
                  <Text className="text-gray-400 mt-0.5">•</Text>
                  <Text className="flex-1 font-pregular text-sm text-gray-600 leading-5">
                    <Text className="font-psemibold text-gray-900">Permanent Code:</Text> Provides long-term network access (valid for 1 year). Requires administrator review and approval.
                  </Text>
                </View>

                <View className="flex-row items-start gap-x-2.5">
                  <Text className="text-gray-400 mt-0.5">•</Text>
                  <Text className="flex-1 font-pregular text-sm text-gray-600 leading-5">
                    <Text className="font-psemibold text-gray-900">Temporary Code:</Text> Provides immediate short-term access (valid for 2 weeks) with a data limit. Limit of 1 active request allowed.
                  </Text>
                </View>
              </View>

              {/* Setup Guides Subheader */}
              <View className="mt-2 mb-1">
                <Text className="font-psemibold text-base text-gray-900 px-1">Setup Guides</Text>
              </View>

              {/* Mumukshus Tutorials */}
              <ExpandableItem
                visibleContent={
                  <View className="flex-row items-center gap-x-3 py-1">
                    <View className="h-8 w-8 items-center justify-center rounded-full bg-orange-50">
                      <FontAwesome5 name="user-friends" size={16} color="#f97316" />
                    </View>
                    <Text className="font-psemibold text-base text-gray-900">Mumukshus</Text>
                  </View>
                }>
                <View className="px-1 pb-4 pt-2">
                  {wifiTutorials.mumukshu.map((item) =>
                    renderTutorialItem(item.title, item.apple, item.android)
                  )}
                </View>
              </ExpandableItem>

              {/* Permanent Residents Tutorials */}
              <ExpandableItem
                visibleContent={
                  <View className="flex-row items-center gap-x-3 py-1">
                    <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                      <FontAwesome5 name="home" size={16} color="#2563eb" />
                    </View>
                    <Text className="font-psemibold text-base text-gray-900">Permanent Residents</Text>
                  </View>
                }>
                <View className="px-1 pb-4 pt-2">
                  {wifiTutorials.residents.map((item) =>
                    renderTutorialItem(item.title, item.apple, item.android)
                  )}
                </View>
              </ExpandableItem>

              <View className="h-6" />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default Wifi;
