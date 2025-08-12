import { View, Text, RefreshControl, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores';
import PageHeader from '@/components/PageHeader';
import handleAPICall from '@/utils/HandleApiCall';
import CustomErrorMessage from '@/components/CustomErrorMessage';
import PermanentWifiSection from '@/components/PermanentWifiSection';
import TemporaryWifiSection from '@/components/TemporaryWifiSection';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';

const wifi = () => {
  const { user } = useAuthStore();

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
        () => {},
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
        () => {},
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
        () => {
          setIsPermanentSubmitting(false);
        },
        () => reject(new Error('Failed to request permanent wifi code'))
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
        },
        () => reject(new Error('Failed to reset permanent wifi code'))
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
  const handleRequestPermanentCode = async () => {
    setIsPermanentSubmitting(true);
    try {
      await requestPermanentWifiCode();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    <SafeAreaView className="h-full bg-white">
      <PageHeader title={'WiFi Passwords'} />

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <PermanentWifiSection
          data={permanentWifiData}
          isLoading={isPermanentLoading}
          isError={isPermanentError}
          isSubmitting={isPermanentSubmitting}
          onRequestCode={handleRequestPermanentCode}
          onInfoPress={handleInfoPress}
          onResetCode={handleResetPermanentCode}
          isResettingCode={isResettingCode}
        />

        <TemporaryWifiSection
          codes={wifiList}
          isLoading={isLoading}
          isGenerating={isSubmitting}
          maxCodes={3}
          onGenerateCode={handleGenerateCode}
        />
      </ScrollView>

      <Modal
        animationType="slide"
        visible={showInfoModal}
        presentationStyle="pageSheet"
        statusBarTranslucent={true}>
        <SafeAreaView className="h-full w-full bg-white">
          <PageHeader title={'WiFi Instructions'} iconName="times" onPress={handleCloseModal} />
          <ScrollView>
            <View className="gap-y-8 p-4">
              {/* Important Notice */}
              <View className="rounded-xl border border-red-200 bg-red-50 p-4">
                <View className="mb-2 flex-row items-center gap-x-2">
                  <Text className="text-2xl">⚠️</Text>
                  <Text className="font-psemibold text-lg text-red-800">IMPORTANT NOTICE</Text>
                </View>
                <Text className="font-pregular text-sm leading-6 text-red-700">
                  Please follow the instructions below VERY CAREFULLY for permanent WiFi codes.
                </Text>
              </View>

              {/* Key Points */}
              <View className="gap-y-4">
                <View className="flex-row items-center gap-x-2">
                  <Text className="text-2xl">🔑</Text>
                  <Text className="font-psemibold text-lg text-gray-900">Key Points</Text>
                </View>
                <View className="gap-y-3 pl-2">
                  <Text className="font-pregular text-sm leading-6 text-gray-700">
                    • Each password is for <Text className="font-pbold">1 device only</Text>.
                  </Text>
                  <Text className="font-pregular text-sm leading-6 text-gray-700">
                    • If you do NOT activate within 7 days, your account will be{' '}
                    <Text className="font-pbold">PERMANENTLY DELETED</Text>.
                  </Text>
                  <Text className="font-pregular text-sm leading-6 text-gray-700">
                    • If absent from SRATRC for more than 7 days, you'll need to re-enter your
                    credentials.
                  </Text>
                </View>
              </View>

              {/* Android Instructions */}
              <View className="gap-y-4">
                <View className="flex-row items-center gap-x-2">
                  <Text className="text-2xl">🤖</Text>
                  <Text className="font-psemibold text-lg text-gray-900">Android Devices</Text>
                </View>
                <View className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <Text className="mb-3 font-pmedium text-base text-green-800">
                    Steps to Connect:
                  </Text>
                  <View className="gap-y-2">
                    <Text className="font-pregular text-sm leading-6 text-green-700">
                      1. Connect to SRATRC Network (ignore any login page).
                    </Text>
                    <Text className="font-pregular text-sm leading-6 text-green-700">
                      2. Go to Settings → WiFi.
                    </Text>
                    <Text className="font-pregular text-sm leading-6 text-green-700">
                      3. Tap the 'i' or gear icon next to SRATRC.
                    </Text>
                    <Text className="font-pregular text-sm leading-6 text-green-700">
                      4. Find the "Randomized MAC" or "Private MAC" option.
                    </Text>
                    <Text className="font-pregular text-sm leading-6 text-green-700">
                      5. Set it to <Text className="font-pbold">"Use Phone/Device MAC"</Text>.
                    </Text>
                    <Text className="font-pregular text-sm leading-6 text-green-700">
                      6. Tap OK/Join and wait for about 1 minute.
                    </Text>
                    <Text className="font-pregular text-sm leading-6 text-green-700">
                      7. Open a browser and go to{' '}
                      <Text className="font-pbold">portal.ruijienetworks.com</Text>.
                    </Text>
                    <Text className="font-pregular text-sm leading-6 text-green-700">
                      8. Enter your code.
                    </Text>
                    <Text className="font-pregular text-sm leading-6 text-green-700">
                      9. Agree to the terms and tap Login.
                    </Text>
                  </View>
                </View>
              </View>

              {/* iOS Instructions */}
              <View className="gap-y-4">
                <View className="flex-row items-center gap-x-2">
                  <Text className="text-2xl">🍎</Text>
                  <Text className="font-psemibold text-lg text-gray-900">Apple Devices</Text>
                </View>
                <View className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <Text className="mb-3 font-pmedium text-base text-blue-800">
                    Steps to Connect:
                  </Text>
                  <View className="gap-y-2">
                    <Text className="font-pregular text-sm leading-6 text-blue-700">
                      1. Connect to SRATRC Network.
                    </Text>
                    <Text className="font-pregular text-sm leading-6 text-blue-700">
                      2. Go to Settings → WiFi.
                    </Text>
                    <Text className="font-pregular text-sm leading-6 text-blue-700">
                      3. Tap the 'i' button next to SRATRC.
                    </Text>
                    <Text className="font-pregular text-sm leading-6 text-blue-700">
                      4. <Text className="font-pbold">UNCHECK</Text> "Private WiFi Address".
                    </Text>
                    <Text className="font-pregular text-sm leading-6 text-blue-700">
                      5. <Text className="font-pbold">DISABLE</Text> "Limit IP Address Tracking" (if
                      available).
                    </Text>
                    <Text className="font-pregular text-sm leading-6 text-blue-700">
                      6. <Text className="font-pbold">ENABLE</Text> "Auto-Join".
                    </Text>
                    <Text className="font-pregular text-sm leading-6 text-blue-700">
                      7. <Text className="font-pbold">ENABLE</Text> "Auto-Login".
                    </Text>
                    <Text className="font-pregular text-sm leading-6 text-blue-700">
                      8. Wait 10 seconds, then tap back.
                    </Text>
                    <Text className="font-pregular text-sm leading-6 text-blue-700">
                      9. Open Safari and go to{' '}
                      <Text className="font-pbold">portal.ruijienetworks.com</Text>.
                    </Text>
                    <Text className="font-pregular text-sm leading-6 text-blue-700">
                      10. Enter your code.
                    </Text>
                    <Text className="font-pregular text-sm leading-6 text-blue-700">
                      11. Agree to the terms and tap Login.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Video Help */}
              <View className="gap-y-4">
                <View className="flex-row items-center gap-x-2">
                  <Text className="text-2xl">🎥</Text>
                  <Text className="font-psemibold text-lg text-gray-900">Video Tutorial</Text>
                </View>
                <View className="rounded-xl border border-purple-200 bg-purple-50 p-4">
                  <Text className="mb-3 font-pregular text-sm leading-6 text-purple-700">
                    If you're having trouble, please watch our video tutorial:
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      Linking.openURL('https://rebrand.ly/SRATRCresidentsWiFi');
                    }}
                    className="rounded-lg bg-purple-100 p-3">
                    <Text className="text-center font-pmedium text-sm text-purple-800">
                      Watch Video Guide
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* WiFi Code Types */}
              <View className="gap-y-4">
                <View className="flex-row items-center gap-x-2">
                  <Text className="text-2xl">📶</Text>
                  <Text className="font-psemibold text-lg text-gray-900">WiFi Code Types</Text>
                </View>
                <View className="gap-y-3">
                  <View className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <Text className="mb-1 font-pmedium text-base text-amber-800">
                      🔒 Permanent Code
                    </Text>
                    <Text className="font-pregular text-sm leading-6 text-amber-700">
                      Long-term access, requires admin approval, and is valid indefinitely.
                    </Text>
                  </View>
                  <View className="mb-2 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                    <Text className="mb-1 font-pmedium text-base text-cyan-800">
                      ⏱️ Temporary Code
                    </Text>
                    <Text className="font-pregular text-sm leading-6 text-cyan-700">
                      Short-term access, instant generation, auto-expires, and a maximum of 3 codes
                      are allowed.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default wifi;
