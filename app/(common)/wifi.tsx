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
import { useGlobalContext } from '../../context/GlobalProvider';
import { useQuery } from '@tanstack/react-query';
import { colors, icons } from '../../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import PageHeader from '../../components/PageHeader';
import handleAPICall from '../../utils/HandleApiCall';
import CustomButton from '../../components/CustomButton';
import HorizontalSeparator from '../../components/HorizontalSeparator';
import moment from 'moment';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import CustomEmptyMessage from '../../components/CustomEmptyMessage';
import CustomErrorMessage from '../../components/CustomErrorMessage';

const wifi = () => {
  const { user } = useGlobalContext();

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

  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleGenerateCode = async () => {
    setIsSubmitting(true);
    try {
      const newCode = await generateNewWifiCode();
      wifiList.push(newCode);
      refetch();
    } catch (error) {
    } finally {
      if (wifiList.length < 4) setIsSubmitting(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const renderItem = ({ item }: any) => {
    const copyToClipboard = async (text: any) => {
      await Clipboard.setStringAsync(text);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    return (
      <View
        className={`mt-3 rounded-2xl bg-white p-4 ${
          Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'
        }`}>
        <View className="flex flex-row justify-between">
          <View className="flex flex-row items-center gap-x-2">
            <Text className="font-pregular text-gray-400">WiFi Code: </Text>
            <Text className="font-pmedium text-black">{item.password}</Text>
          </View>
          <TouchableOpacity onPress={() => copyToClipboard(item.password)}>
            <Image
              source={icons.copy}
              className="h-5 w-5"
              resizeMode="contain"
              tintColor={colors.gray_400}
            />
          </TouchableOpacity>
        </View>
        <HorizontalSeparator otherStyles={'my-4'} />
        <View className="flex flex-col gap-y-2">
          <View className="flex flex-row items-center gap-x-2">
            <Text className="font-pregular text-gray-400">Generated on:</Text>
            <Text className="font-pmedium text-black">
              {moment(item.createdAt).format('Do MMMM, YYYY')}
            </Text>
          </View>
          <View className="flex flex-row items-center gap-x-2">
            <Text className="font-pregular text-gray-400">Valid Till:</Text>
            <Text className="font-pmedium text-black">
              {moment(item.createdAt).add(15, 'days').format('Do MMMM, YYYY')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      {wifiList?.length > 0 && (
        <View>
          <Text className="font-psemibold text-sm text-gray-400">
            {wifiList?.length}/4 Codes Generated
          </Text>
        </View>
      )}

      {wifiList?.length == 0 && (
        <View className="h-full w-full flex-1 flex-col items-center justify-center gap-y-6 px-4">
          <CustomEmptyMessage message={'No WiFi code generated Yet!'} />
          <CustomButton
            text={'Generate new Code'}
            handlePress={handleGenerateCode}
            containerStyles={'px-4 py-2 mt-10 min-h-[56px]'}
            textStyles={'text-base font-pregular text-white'}
            isLoading={isSubmitting}
          />
        </View>
      )}
    </View>
  );

  const renderFooter = () => (
    <View className="h-full w-full">
      {isLoading && (
        <View className="items-center justify-center">
          <ActivityIndicator />
        </View>
      )}
      {wifiList?.length != 0 && !isLoading && (
        <CustomButton
          text={'Generate WiFi Code'}
          handlePress={handleGenerateCode}
          containerStyles={'px-4 py-2 mt-10 min-h-[56px]'}
          textStyles={'text-base font-pregular text-white'}
          isLoading={isSubmitting || wifiList?.length >= 4}
        />
      )}
    </View>
  );

  if (isError)
    return (
      <SafeAreaView className="h-full bg-white">
        <PageHeader title={'Wifi Passwords'} />
        <CustomErrorMessage />
      </SafeAreaView>
    );
  return (
    <SafeAreaView className="h-full bg-white">
      <PageHeader title={'Wifi Passwords'} />
      <FlashList
        className="flex-grow-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 32 }}
        data={wifiList}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={100}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReachedThreshold={0.1}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
};

export default wifi;
