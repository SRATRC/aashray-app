import {
  View,
  Text,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { colors, icons, status, types } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import PageHeader from '../../components/PageHeader';
import handleAPICall from '../../utils/HandleApiCall';
import CustomChipGroup from '../../components/CustomChipGroup';
import CustomTag from '../../components/CustomTag';
import ExpandableItem from '../../components/ExpandableItem';
import HorizontalSeparator from '../../components/HorizontalSeparator';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import CustomEmptyMessage from '../../components/CustomEmptyMessage';
import CustomSelectBottomSheet from '~/components/CustomSelectBottomSheet';
import moment from 'moment';

const CHIPS = [
  types.MAINTENANCE_TYPE_ALL,
  types.MAINTENANCE_TYPE_OPEN,
  types.MAINTENANCE_TYPE_CLOSED,
];

const DEPARTMENT_LIST = [
  { key: 'Electrical', value: 'Electrical' },
  { key: 'housekeeping', value: 'House Keeping' },
  { key: 'Maintenance', value: 'Maintenance' },
];

const maintenanceRequestList = () => {
  const { user } = useGlobalContext();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedChip, setSelectedChip] = useState(types.MAINTENANCE_TYPE_ALL);
  const [refreshing, setRefreshing] = useState(false);

  const [form, setForm] = useState({
    department: '',
    work_detail: '',
    area_of_work: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchMaintenance = async ({ pageParam = 1 }) => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/maintenance',
        {
          cardno: user.cardno,
          page: pageParam,
          status: selectedChip,
        },
        null,
        (res: any) => {
          resolve(Array.isArray(res.data) ? res.data : []);
        },
        () => reject(new Error('Failed to fetch transactions'))
      );
    });
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: queryStatus,
    isLoading,
    isError,
    refetch,
  }: any = useInfiniteQuery({
    queryKey: ['maintenance', user.cardno, selectedChip],
    queryFn: fetchMaintenance,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 30,
    getNextPageParam: (lastPage: any, pages: any) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      return pages.length + 1;
    },
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const renderItem = ({ item }: any) => (
    <ExpandableItem
      containerStyles={'mt-3'}
      visibleContent={
        <View className="flex flex-row items-center gap-x-4">
          <Image source={icons.id} className="h-10 w-10" resizeMode="contain" />
          <View className="flex-col gap-y-1">
            <View className="flex flex-row">
              <CustomTag
                text={item.status}
                textStyles={item.status == status.STATUS_OPEN ? 'text-red-200' : 'text-green-200'}
                containerStyles={item.status == status.STATUS_OPEN ? 'bg-red-100' : 'bg-green-100'}
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
      <PageHeader title={'Maintenance History'} />
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
      {!hasNextPage && data?.pages?.[0]?.length > 0 && <Text>No more bookings at the moment</Text>}
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
        data={data?.pages?.flatMap((page: any) => page) || []}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={115}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <CustomEmptyMessage message={'You dont have any maintenance requests yet'} />
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
          isModalVisible ? setIsModalVisible(false) : setIsModalVisible(true);
        }}>
        <Image
          source={icons.add}
          tintColor={colors.white}
          className="h-6 w-6"
          resizeMode="contain"
        />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        visible={isModalVisible}
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <PageHeader
              title="Maintenance Request"
              iconName="times"
              onPress={() => {
                setForm({
                  department: '',
                  work_detail: '',
                  area_of_work: '',
                });
                setIsModalVisible(false);
              }}
            />

            <View className="mt-6 flex-1 px-4">
              <Text className="font-pregular text-base text-gray-500">
                JSDV {user.issuedto}, please register your maintenance request
              </Text>

              <CustomSelectBottomSheet
                className="mt-7"
                label="Department"
                placeholder="Select Department"
                options={DEPARTMENT_LIST}
                selectedValue={form.department}
                onValueChange={(val: any) => setForm({ ...form, department: val })}
              />

              <FormField
                text="Detail of Work"
                value={form.work_detail}
                handleChangeText={(e: any) => setForm({ ...form, work_detail: e })}
                multiline={true}
                numberOfLines={4}
                otherStyles="mt-7"
                inputStyles="font-pmedium text-base text-gray-400"
                containerStyles={'bg-gray-100'}
                placeholder="Work Description"
              />

              <FormField
                text="Place where work is needed"
                value={form.area_of_work}
                handleChangeText={(e: any) => setForm({ ...form, area_of_work: e })}
                otherStyles="mt-7"
                inputStyles="font-pmedium text-base text-gray-400"
                containerStyles={'bg-gray-100'}
                placeholder="Place where work is needed"
              />

              <CustomButton
                text="Submit"
                handlePress={async () => {
                  setIsSubmitting(true);
                  if (
                    form.department.trim() == '' ||
                    form.work_detail.trim() == '' ||
                    form.area_of_work.trim() == ''
                  ) {
                    Alert.alert('Please fill all fields');
                    return;
                  }

                  const onSuccess = async (_data: any) => {
                    await queryClient.invalidateQueries({ queryKey: ['maintenance', user.cardno] });
                    setIsModalVisible(false);
                    setForm({
                      department: '',
                      work_detail: '',
                      area_of_work: '',
                    });
                  };
                  const onFinally = () => {
                    setIsSubmitting(false);
                  };
                  const onError = (error: any) => {
                    Alert.alert('Error', error.message);
                  };

                  await handleAPICall(
                    'POST',
                    '/maintenance/request',
                    null,
                    {
                      cardno: user.cardno,
                      department: form.department,
                      work_detail: form.work_detail,
                      area_of_work: form.area_of_work,
                    },
                    onSuccess,
                    onFinally,
                    onError
                  );
                }}
                containerStyles="min-h-[62px] mt-7"
                isLoading={isSubmitting}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default maintenanceRequestList;
