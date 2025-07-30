import {
  View,
  Text,
  SectionList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { icons, status, types } from '@/constants';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuthStore, useBookingStore } from '@/stores';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '../CustomButton';
import handleAPICall from '@/utils/HandleApiCall';
import HorizontalSeparator from '../HorizontalSeparator';
import moment from 'moment';
import CustomChipGroup from '../CustomChipGroup';
import GuestForm from '../GuestForm';
import OtherMumukshuForm from '../OtherMumukshuForm';
import CustomEmptyMessage from '../CustomEmptyMessage';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';

let CHIPS = ['Self', 'Guest', 'Mumukshus'];

const INITIAL_GUEST_FORM = {
  adhyayan: null,
  guests: [
    {
      name: '',
      gender: '',
      mobno: '',
      type: '',
    },
  ],
};

const INITIAL_MUMUKSHU_FORM = {
  adhyayan: null,
  mumukshus: [
    {
      cardno: '',
      mobno: '',
    },
  ],
};

const AdhyayanBooking = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateGuestBooking = useBookingStore((state) => state.updateGuestBooking);
  const updateMumukshuBooking = useBookingStore((state) => state.updateMumukshuBooking);
  const tabBarPadding = useTabBarPadding();

  const [isRefreshing, setIsRefreshing] = useState(false);

  if (user?.res_status == status.STATUS_GUEST) {
    CHIPS = ['Self'];
  }

  useEffect(
    useCallback(() => {
      setIsSubmitting(false);
    }, [])
  );

  // Reset forms when navigating back to this screen
  useFocusEffect(
    useCallback(() => {
      setGuestForm(INITIAL_GUEST_FORM);
      setMumukshuForm(INITIAL_MUMUKSHU_FORM);
      setSelectedChip('Self');
      setIsModalVisible(false);
      setSelectedItem(null);
    }, [])
  );

  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const [selectedChip, setSelectedChip] = useState('Self');
  const handleChipClick = (chip: any) => {
    setSelectedChip(chip);
  };

  const [guestForm, setGuestForm] = useState(INITIAL_GUEST_FORM);

  const addGuestForm = () => {
    setGuestForm((prev) => ({
      ...prev,
      guests: [
        ...prev.guests,
        {
          name: '',
          gender: '',
          mobno: '',
          type: '',
        },
      ],
    }));
  };

  const handleGuestFormChange = (index: any, field: any, value: any) => {
    const updatedForms = guestForm.guests.map((guest, i) =>
      i === index ? { ...guest, [field]: value } : guest
    );
    setGuestForm((prev) => ({ ...prev, guests: updatedForms }));
  };

  const removeGuestForm = (indexToRemove: any) => {
    setGuestForm((prev) => ({
      ...prev,
      guests: prev.guests.filter((_, index) => index !== indexToRemove),
    }));
  };

  const isGuestFormValid = () => {
    return guestForm.guests.every((guest: any) => {
      if (guest.cardno) return guest.mobno && guest.mobno?.length == 10;
      else
        return guest.name && guest.gender && guest.type && guest.mobno && guest.mobno?.length == 10;
    });
  };

  const [mumukshuForm, setMumukshuForm] = useState(INITIAL_MUMUKSHU_FORM);

  const addMumukshuForm = () => {
    setMumukshuForm((prev) => ({
      ...prev,
      mumukshus: [
        ...prev.mumukshus,
        {
          cardno: '',
          mobno: '',
        },
      ],
    }));
  };

  const removeMumukshuForm = (indexToRemove: any) => {
    setMumukshuForm((prev) => ({
      ...prev,
      mumukshus: prev.mumukshus.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleMumukshuFormChange = (index: any, key: any, value: any) => {
    setMumukshuForm((prev) => ({
      ...prev,
      mumukshus: prev.mumukshus.map((mumukshu, i) =>
        i === index ? { ...mumukshu, [key]: value } : mumukshu
      ),
    }));
  };

  const isMumukshuFormValid = () => {
    return mumukshuForm.mumukshus.every((mumukshu) => {
      return mumukshu.mobno && mumukshu.mobno?.length == 10 && mumukshu.cardno;
    });
  };

  const fetchAdhyayans: any = async ({ pageParam = 1 }) => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/adhyayan/getall',
        {
          cardno: user.cardno,
          page: pageParam,
        },
        null,
        (res: any) => {
          resolve(Array.isArray(res.data) ? res.data : []);
        },
        () => reject(new Error('Failed to fetch adhyayans'))
      );
    });
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch }: any =
    useInfiniteQuery({
      queryKey: ['adhyayans', user?.cardno],
      queryFn: fetchAdhyayans,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 5,
      initialPageParam: 1,
      getNextPageParam: (lastPage: any, pages: any) => {
        if (!lastPage || lastPage.length === 0) return undefined;
        return pages.length + 1;
      },
      enabled: !!user?.cardno,
    });

  const renderItem = ({ item }: { item: any }) => (
    <View
      className="mb-2 mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-400"
      style={{
        ...(Platform.OS === 'ios' && {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        }),
        ...(Platform.OS === 'android' && {
          elevation: 8,
        }),
      }}>
      <View className="px-5 py-4">
        <View className="mb-2 flex-row items-center justify-between">
          <View className="rounded-full bg-secondary/10 px-3 py-1">
            <Text className="font-psemibold text-xs uppercase tracking-wide text-secondary">
              {moment(item.start_date).isSame(moment(item.end_date), 'day')
                ? moment(item.start_date).format('MMM DD, YYYY')
                : `${moment(item.start_date).format('MMM DD')} - ${moment(item.end_date).format('MMM DD, YYYY')}`}
            </Text>
          </View>
          {(item.status == status.STATUS_CLOSED || item.available_seats == 0) && (
            <View className="rounded-full bg-orange-100 px-2 py-1">
              <Text className="font-pmedium text-xs text-orange-600">Waitlist</Text>
            </View>
          )}
        </View>
        <Text className="font-psemibold text-lg leading-6 text-gray-800" numberOfLines={2}>
          {item.name}
        </Text>
      </View>

      <View className="px-5 py-4">
        <View className="gap-y-3">
          <View className="flex-row items-start">
            <View className="mr-3 mt-0.5">
              <Ionicons name="person-outline" size={18} color="#6b7280" />
            </View>
            <View className="flex-1">
              <Text className="mb-1 font-pregular text-xs uppercase tracking-wide text-gray-500">
                Swadhyay Karta
              </Text>
              <Text className="font-pmedium text-gray-800">{item.speaker}</Text>
            </View>
          </View>

          {item.location && (
            <View className="flex-row items-start">
              <View className="mr-3 mt-0.5">
                <Ionicons name="location-outline" size={18} color="#6b7280" />
              </View>
              <View className="flex-1">
                <Text className="mb-1 font-pregular text-xs uppercase tracking-wide text-gray-500">
                  Location
                </Text>
                <Text className="font-pmedium text-gray-800">{item.location}</Text>
              </View>
            </View>
          )}

          <View className="flex-row items-start">
            <View className="mr-3 mt-0.5">
              <Ionicons name="card-outline" size={18} color="#6b7280" />
            </View>
            <View className="flex-1">
              <Text className="mb-1 font-pregular text-xs uppercase tracking-wide text-gray-500">
                Charges
              </Text>
              <Text className="font-psemibold text-gray-800">{item.amount}</Text>
            </View>
          </View>
        </View>

        <View className="mt-5 border-t border-gray-200 pt-4">
          <CustomButton
            text={
              item.status == status.STATUS_CLOSED || item.available_seats == 0
                ? 'Join Waitlist'
                : 'Register Now'
            }
            handlePress={() => {
              setSelectedItem(item);
              setGuestForm((prev) => ({
                ...prev,
                adhyayan: item,
              }));
              setMumukshuForm((prev) => ({
                ...prev,
                adhyayan: item,
              }));
              toggleModal();
            }}
            containerStyles="min-h-[48px] rounded-xl"
            bgcolor={
              item.status == status.STATUS_CLOSED || item.available_seats == 0
                ? 'bg-orange-500'
                : 'bg-secondary'
            }
            textStyles="font-psemibold text-white text-base"
            isLoading={isSubmitting}
          />
        </View>
      </View>
    </View>
  );

  const renderSectionHeader = ({ section: { title } }: { section: { title: any } }) => (
    <Text className="mt-2 font-psemibold text-lg">{title}</Text>
  );

  const renderFooter = () => (
    <View className="items-center">
      {(isFetchingNextPage || isLoading) && <ActivityIndicator />}
      {!hasNextPage && data?.pages?.[0]?.length > 0 && <Text>No more adhyayans at the moment</Text>}
    </View>
  );

  return (
    <View className="mt-3 w-full flex-1">
      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={toggleModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <View className="flex-1 items-center justify-center bg-black/50">
            <View className="max-h-[80%] w-[80%] max-w-[300px] rounded-lg bg-white p-5">
              <View className="mb-2 flex-row justify-between">
                <View className="flex-1 flex-col gap-y-1 pr-2">
                  <Text
                    className="font-pmedium text-sm text-black"
                    numberOfLines={2}
                    ellipsizeMode="tail">
                    {selectedItem?.name}
                  </Text>
                  <View className="flex-row gap-x-1">
                    <Text className="font-pregular text-xs text-gray-500">Date:</Text>
                    <Text className="font-pregular text-xs text-secondary">
                      {moment(selectedItem?.start_date).isSame(
                        moment(selectedItem?.end_date),
                        'day'
                      )
                        ? moment(selectedItem?.start_date).format('Do MMMM, YYYY')
                        : `${moment(selectedItem?.start_date).format('Do MMMM')} - ${moment(selectedItem?.end_date).format('Do MMMM')}`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={toggleModal}>
                  <Image
                    source={icons.remove}
                    tintColor={'black'}
                    className="h-4 w-4"
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>

              <HorizontalSeparator otherStyles={'w-full'} />

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}>
                {/* Book For Section */}
                <View className="mt-2 flex-col">
                  <Text className="font-pregular text-base text-black">Book For</Text>
                  <CustomChipGroup
                    chips={CHIPS}
                    selectedChip={selectedChip}
                    handleChipPress={handleChipClick}
                    containerStyles={'mt-1'}
                    chipContainerStyles={'py-1'}
                    textStyles={'text-sm'}
                  />
                </View>

                {/* Guest Form Section */}
                {selectedChip === CHIPS[1] && (
                  <View>
                    <GuestForm
                      guestForm={guestForm}
                      setGuestForm={setGuestForm}
                      handleGuestFormChange={handleGuestFormChange}
                      addGuestForm={addGuestForm}
                      removeGuestForm={removeGuestForm}
                    />
                  </View>
                )}

                {/* Mumukshu Form Section */}
                {selectedChip === CHIPS[2] && (
                  <View>
                    <OtherMumukshuForm
                      mumukshuForm={mumukshuForm}
                      setMumukshuForm={setMumukshuForm}
                      handleMumukshuFormChange={handleMumukshuFormChange}
                      addMumukshuForm={addMumukshuForm}
                      removeMumukshuForm={removeMumukshuForm}
                    />
                  </View>
                )}

                {/* Confirm Button Section */}
                <CustomButton
                  handlePress={async () => {
                    setIsSubmitting(true);
                    if (selectedChip == CHIPS[0]) {
                      const temp = transformMumukshuData({
                        adhyayan: selectedItem,
                        mumukshus: [
                          {
                            cardno: user.cardno,
                            mobno: user.mobno,
                            issuedto: user.name,
                            gender: user.gender,
                            res_status: user.res_status,
                          },
                        ],
                      });

                      await updateMumukshuBooking('adhyayan', temp);
                      if (selectedItem.location !== 'Research Centre')
                        router.push('/booking/bookingConfirmation');
                      else router.push(`/booking/${types.ADHYAYAN_DETAILS_TYPE}`);
                    }
                    if (selectedChip == CHIPS[1]) {
                      if (!isGuestFormValid()) {
                        Alert.alert('Fill all Fields');
                        return;
                      }

                      if (guestForm.guests.filter((guest: any) => !guest.cardno).length > 0) {
                        await handleAPICall(
                          'POST',
                          '/guest',
                          null,
                          {
                            cardno: user.cardno,
                            guests: guestForm.guests,
                          },
                          async (res: any) => {
                            guestForm.guests = res.guests;
                            const transformedData = transformGuestData(guestForm);

                            await updateGuestBooking('adhyayan', transformedData);
                            setGuestForm(INITIAL_GUEST_FORM);

                            if (selectedItem.location !== 'Research Centre')
                              router.push('/guestBooking/guestBookingConfirmation');
                            else router.push(`/guestBooking/${types.ADHYAYAN_DETAILS_TYPE}`);
                          },
                          () => {
                            setIsSubmitting(false);
                          }
                        );
                      } else {
                        const transformedData = transformGuestData(guestForm);

                        await updateGuestBooking('adhyayan', transformedData);
                        setGuestForm(INITIAL_GUEST_FORM);
                        if (selectedItem.location !== 'Research Centre')
                          router.push('/guestBooking/guestBookingConfirmation');
                        else router.push(`/guestBooking/${types.ADHYAYAN_DETAILS_TYPE}`);
                        setIsSubmitting(false);
                      }
                    }
                    if (selectedChip == CHIPS[2]) {
                      if (!isMumukshuFormValid()) {
                        Alert.alert('Fill all Fields');
                        return;
                      }

                      const temp = transformMumukshuData(mumukshuForm);

                      await updateMumukshuBooking('adhyayan', temp);
                      if (selectedItem.location !== 'Research Centre')
                        router.push('/mumukshuBooking/mumukshuBookingConfirmation');
                      else router.push(`/mumukshuBooking/${types.ADHYAYAN_DETAILS_TYPE}`);
                    }
                    setSelectedItem(null);
                    setSelectedChip('Self');
                    toggleModal();
                  }}
                  text={'Confirm'}
                  bgcolor="bg-secondary"
                  containerStyles="mt-4 p-2"
                  textStyles={'text-sm text-white'}
                  isDisabled={
                    selectedChip === CHIPS[1]
                      ? !isGuestFormValid()
                      : selectedChip === CHIPS[2]
                        ? !isMumukshuFormValid()
                        : false
                  }
                  isLoading={isSubmitting}
                />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <SectionList
        className="flex-grow-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: tabBarPadding,
        }}
        sections={data?.pages?.flatMap((page: any) => page) || []}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        nestedScrollEnabled={true}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={() => (
          <View className="h-full flex-1 items-center justify-center pt-40">
            {isError ? (
              <View className="items-center justify-center px-6">
                <Text className="mb-2 text-center text-lg font-semibold text-gray-800">
                  Oops! Something went wrong
                </Text>
                <Text className="mb-6 text-center text-gray-600">
                  Unable to load Adhyayans. Please check your connection and try again.
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
              <CustomEmptyMessage message={'No upcoming Adhyayans at this moment!'} />
            )}
          </View>
        )}
        ListFooterComponent={() => (
          <View>
            {renderFooter()}
            {isFetchingNextPage && isError && (
              <View className="items-center py-4">
                <Text className="mb-3 text-red-500">Failed to load more items</Text>
                <TouchableOpacity
                  onPress={() => fetchNextPage()}
                  className="rounded bg-red-500 px-4 py-2"
                  activeOpacity={0.7}>
                  <Text className="font-medium text-white">Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        onEndReachedThreshold={0.1}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage && !isError) {
            fetchNextPage();
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing || false}
            onRefresh={async () => {
              setIsRefreshing(true);
              await refetch();
              setIsRefreshing(false);
            }}
          />
        }
      />
    </View>
  );
};

function transformGuestData(inputData: any) {
  const { adhyayan, guests } = inputData;

  return {
    adhyayan: adhyayan,
    guestGroup: guests.map((guest: any) => ({
      cardno: guest.cardno,
      issuedto: guest.issuedto || guest.name,
    })),
  };
}

function transformMumukshuData(inputData: any) {
  const { adhyayan, mumukshus } = inputData;

  return {
    adhyayan: adhyayan,
    mumukshuGroup: mumukshus.map((mumukshu: any) => mumukshu),
  };
}

export default AdhyayanBooking;
