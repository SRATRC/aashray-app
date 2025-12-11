import { View, Text, RefreshControl, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/stores';
import { status } from '@/src/constants';
import { FontAwesome5, Fontisto } from '@expo/vector-icons';
import PageHeader from '@/src/components/PageHeader';
import handleAPICall from '@/src/utils/HandleApiCall';
import CustomErrorMessage from '@/src/components/CustomErrorMessage';
import PermanentWifiSection from '@/src/components/PermanentWifiSection';
import TemporaryWifiSection from '@/src/components/TemporaryWifiSection';
import ExpandableItem from '@/src/components/ExpandableItem';
import Callout from '@/src/components/Callout';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';

const wifi = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isResident = user.res_status === status.STATUS_RESIDENT;

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
  const requestPermanentWifiCode = async (data: { username: string; deviceType: string }) => {
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
    data: { username: string; deviceType: string },
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

  // Delete permanent code mutation
  const deletePermanentCodeMutation = useMutation({
    mutationFn: (id: string) => {
      return new Promise((resolve, reject) => {
        handleAPICall(
          'DELETE',
          '/wifi/permanent',
          null,
          { cardno: user.cardno, id: id },
          resolve,
          () => reject(new Error('Failed to cancel booking'))
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['wifi-permanent', user.cardno],
      });
    },
  });

  const handleDeletePermanentCode = async (id: string) => {
    try {
      await deletePermanentCodeMutation.mutateAsync(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error deleting permanent code:', error);
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
              onDeleteCode={handleDeletePermanentCode}
              isDeletingCode={deletePermanentCodeMutation.isPending}
              isResident={isResident}
              res_status={user.res_status}
            />

            {!isResident && (
              <TemporaryWifiSection
                codes={wifiList}
                isLoading={isLoading}
                isGenerating={isSubmitting}
                isError={isError}
                maxCodes={3}
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
            <View className="gap-y-2">
              {/* Important Notice */}
              <Callout
                message="Please follow the instructions below VERY CAREFULLY for permanent WiFi codes."
                overrideStyle="mx-4"
                variant="error"
              />

              {/* Key Points Section */}
              <View className="mx-4">
                <Text className="font-psemibold text-base text-gray-900">Key Points</Text>
                <View className="gap-y-3 px-4 py-3">
                  <View className="flex-row gap-x-3">
                    <Text className="text-gray-400">•</Text>
                    <Text className="flex-1 font-pregular text-sm leading-5 text-gray-600">
                      Each password is for{' '}
                      <Text className="font-pbold text-gray-800">1 device only</Text>.
                    </Text>
                  </View>
                  <View className="flex-row gap-x-3">
                    <Text className="text-gray-400">•</Text>
                    <Text className="flex-1 font-pregular text-sm leading-5 text-gray-600">
                      If you do NOT activate within 7 days, your account will be{' '}
                      <Text className="font-pbold text-gray-800">PERMANENTLY DELETED</Text>.
                    </Text>
                  </View>
                  <View className="flex-row gap-x-3">
                    <Text className="text-gray-400">•</Text>
                    <Text className="flex-1 font-pregular text-sm leading-5 text-gray-600">
                      If absent from SRATRC for more than 7 days, you'll need to re-enter your
                      credentials.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Instructions Group */}
              <View className="flex-1 gap-y-3 p-4">
                <Text className="font-psemibold text-base text-gray-900">Setup Guides</Text>

                {/* Android Instructions */}
                <ExpandableItem
                  rootClassName="border-b border-gray-100"
                  visibleContent={
                    <View className="flex-row items-center gap-x-3 py-1">
                      <View className="h-8 w-8 items-center justify-center rounded-full bg-green-50">
                        <FontAwesome5 name="android" size={16} color="#16a34a" />
                      </View>
                      <Text className="font-pmedium text-base text-gray-900">Android Devices</Text>
                    </View>
                  }>
                  <View className="px-2 pb-4 pt-2">
                    <View className="gap-y-3">
                      <Text className="font-pregular text-sm leading-6 text-gray-600">
                        1. Connect to SRATRC Network (ignore any login page).
                      </Text>
                      <Text className="font-pregular text-sm leading-6 text-gray-600">
                        2. Go to Settings → WiFi.
                      </Text>
                      <Text className="font-pregular text-sm leading-6 text-gray-600">
                        3. Tap the 'i' or gear icon next to SRATRC.
                      </Text>
                      <Text className="font-pregular text-sm leading-6 text-gray-600">
                        4. Find "Randomized MAC" or "Private MAC".
                      </Text>
                      <Text className="font-pregular text-sm leading-6 text-gray-600">
                        5. Set to{' '}
                        <Text className="font-pbold text-gray-800">"Use Phone/Device MAC"</Text>.
                      </Text>
                      <Text className="font-pregular text-sm leading-6 text-gray-600">
                        6. Tap OK/Join and wait ~1 minute.
                      </Text>
                      <Text className="font-pregular text-sm leading-6 text-gray-600">
                        7. Go to{' '}
                        <Text
                          onPress={() => Linking.openURL('http://portal.ruijienetworks.com')}
                          className="font-pbold text-blue-600 underline">
                          portal.ruijienetworks.com
                        </Text>
                        .
                      </Text>
                      <Text className="font-pregular text-sm leading-6 text-gray-600">
                        8. Enter code & Login.
                      </Text>
                    </View>
                  </View>
                </ExpandableItem>

                {/* iOS Instructions */}
                <ExpandableItem
                  rootClassName="border-b border-gray-100"
                  visibleContent={
                    <View className="flex-row items-center gap-x-3 py-1">
                      <View className="h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                        <FontAwesome5 name="apple" size={18} color="#374151" />
                      </View>
                      <Text className="font-pmedium text-base text-gray-900">Apple Devices</Text>
                    </View>
                  }>
                  <View className="px-2 pb-4 pt-2">
                    <View className="gap-y-3">
                      <Text className="font-pregular text-sm leading-6 text-gray-600">
                        1. Connect to SRATRC Network.
                      </Text>
                      <Text className="font-pregular text-sm leading-6 text-gray-600">
                        2. Go to Settings → WiFi → 'i' next to SRATRC.
                      </Text>
                      <Text className="font-pregular text-sm leading-6 text-gray-600">
                        3. <Text className="font-pbold text-gray-800">UNCHECK</Text> "Private WiFi
                        Address".
                      </Text>
                      <Text className="font-pregular text-sm leading-6 text-gray-600">
                        4. <Text className="font-pbold text-gray-800">DISABLE</Text> "Limit IP
                        Address Tracking".
                      </Text>
                      <Text className="font-pregular text-sm leading-6 text-gray-600">
                        5. <Text className="font-pbold text-gray-800">ENABLE</Text> "Auto-Join" &
                        "Auto-Login".
                      </Text>
                      <Text className="font-pregular text-sm leading-6 text-gray-600">
                        6. Wait 10s, go back, open Safari.
                      </Text>
                      <Text className="font-pregular text-sm leading-6 text-gray-600">
                        7. Go to{' '}
                        <Text
                          onPress={() => Linking.openURL('http://portal.ruijienetworks.com')}
                          className="font-pbold text-blue-600 underline">
                          portal.ruijienetworks.com
                        </Text>
                        .
                      </Text>
                      <Text className="font-pregular text-sm leading-6 text-gray-600">
                        8. Enter code & Login.
                      </Text>
                    </View>
                  </View>
                </ExpandableItem>

                {/* Video Help */}
                <ExpandableItem
                  rootClassName="border-b border-gray-100"
                  visibleContent={
                    <View className="flex-row items-center gap-x-3 py-1">
                      <View className="h-8 w-8 items-center justify-center rounded-full bg-red-50">
                        <FontAwesome5 name="youtube" size={14} color="#dc2626" />
                      </View>
                      <Text className="font-pmedium text-base text-gray-900">Video Tutorial</Text>
                    </View>
                  }>
                  <View className="px-4 pb-4 pt-2">
                    <TouchableOpacity
                      onPress={() => {
                        Linking.openURL('https://rebrand.ly/SRATRCresidentsWiFi');
                      }}
                      className="flex-row items-center justify-center rounded-lg bg-red-50 py-3 active:bg-red-100">
                      <FontAwesome5
                        name="play"
                        size={12}
                        color="#dc2626"
                        style={{ marginRight: 8 }}
                      />
                      <Text className="font-pmedium text-sm text-red-700">Watch Video Guide</Text>
                    </TouchableOpacity>
                  </View>
                </ExpandableItem>

                {/* WiFi Code Types */}
                <ExpandableItem
                  rootClassName=""
                  visibleContent={
                    <View className="flex-row items-center gap-x-3 py-1">
                      <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                        <Fontisto name="wifi-logo" size={14} color="#0284c7" />
                      </View>
                      <Text className="font-pmedium text-base text-gray-900">Code Types Info</Text>
                    </View>
                  }>
                  <View className="gap-y-4 px-4 pb-4 pt-2">
                    <View className="flex-row gap-x-3">
                      <View className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                      <View className="flex-1">
                        <Text className="font-pmedium text-sm text-gray-900">Permanent Code</Text>
                        <Text className="mt-0.5 font-pregular text-xs leading-5 text-gray-500">
                          Long-term access, requires admin approval, valid indefinitely.
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row gap-x-3">
                      <View className="mt-1 h-2 w-2 rounded-full bg-cyan-500" />
                      <View className="flex-1">
                        <Text className="font-pmedium text-sm text-gray-900">Temporary Code</Text>
                        <Text className="mt-0.5 font-pregular text-xs leading-5 text-gray-500">
                          Short-term (24h), instant, max 3 codes allowed.
                        </Text>
                      </View>
                    </View>
                  </View>
                </ExpandableItem>
              </View>

              <View className="h-6" />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default wifi;
