import {
  View,
  Text,
  SectionList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { icons, status, types } from '../../constants';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useRouter } from 'expo-router';
import CustomButton from '../CustomButton';
import handleAPICall from '../../utils/HandleApiCall';
import ExpandableItem from '../ExpandableItem';
import HorizontalSeparator from '../HorizontalSeparator';
import moment from 'moment';
import CustomChipGroup from '../CustomChipGroup';
import GuestForm from '../GuestForm';
import OtherMumukshuForm from '../OtherMumukshuForm';
import CustomEmptyMessage from '../CustomEmptyMessage';

const CHIPS = ['Self', 'Guest', 'Mumukshus'];

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
  const { user, updateBooking, updateGuestBooking, updateMumukshuBooking } = useGlobalContext();

  useEffect(
    useCallback(() => {
      setIsSubmitting(false);
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

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError }: any =
    useInfiniteQuery({
      queryKey: ['adhyayans', user.cardno],
      queryFn: fetchAdhyayans,
      staleTime: 1000 * 60 * 30,
      initialPageParam: 1,
      getNextPageParam: (lastPage: any, pages: any) => {
        if (!lastPage || lastPage.length === 0) return undefined;
        return pages.length + 1;
      },
    });

  const renderItem: React.FC<{ item: any }> = ({ item }) => (
    <ExpandableItem
      containerStyles={'mt-3'}
      visibleContent={
        <View className="flex basis-11/12">
          <Text className="font-psemibold text-secondary">
            {moment(item.start_date).format('Do MMMM')} -{' '}
            {moment(item.end_date).format('Do MMMM, YYYY')}
          </Text>
          <Text className="font-pmedium text-gray-700">{item.name}</Text>
        </View>
      }>
      <HorizontalSeparator />
      <View className="mt-3">
        <View className="flex-row gap-x-2">
          <Text className="font-psemibold text-gray-400">Swadhyay Karta:</Text>
          <Text className="font-pregular">{item.speaker}</Text>
        </View>
        <View className="flex-row gap-x-2">
          <Text className="font-psemibold text-gray-400">Charges:</Text>
          <Text className="font-pregular">{item.amount}</Text>
        </View>
        <CustomButton
          text={item.status == status.STATUS_CLOSED ? 'Add to waitlist' : 'Register'}
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
          containerStyles="mt-3 min-h-[40px]"
          isLoading={isSubmitting}
        />
      </View>
    </ExpandableItem>
  );

  const renderSectionHeader = ({ section: { title } }: { section: { title: any } }) => (
    <Text className="mx-1 mb-2 font-psemibold text-lg">{title}</Text>
  );

  const renderFooter = () => (
    <View className="items-center">
      {(isFetchingNextPage || isLoading) && <ActivityIndicator />}
      {!hasNextPage && data?.pages?.[0]?.length > 0 && <Text>No more adhyayans at the moment</Text>}
    </View>
  );

  if (isError)
    return (
      <Text className="items-center justify-center font-pregular text-lg text-red-500">
        An error occurred
      </Text>
    );

  return (
    <View className="w-full">
      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={toggleModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <View className="flex-1 items-center justify-center bg-black/50">
            <View className="max-h-[80%] w-[80%] max-w-[300px] rounded-lg bg-white p-5">
              <View className="mb-2 flex-row justify-between">
                <View className="flex-col gap-y-1">
                  <Text className="font-pmedium text-sm text-black">{selectedItem?.name}</Text>
                  <View className="flex-row gap-x-1">
                    <Text className="font-pregular text-xs text-gray-500">Date:</Text>
                    <Text className="font-pregular text-xs text-secondary">
                      {moment(selectedItem?.start_date).format('Do MMMM')} -{' '}
                      {moment(selectedItem?.end_date).format('Do MMMM')}
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

              <FlatList
                data={[{ key: 'bookFor' }, { key: 'guestForm' }, { key: 'confirmButton' }]}
                renderItem={({ item }): any => {
                  if (item.key === 'bookFor') {
                    return (
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
                    );
                  } else if (item.key === 'guestForm') {
                    if (selectedChip == CHIPS[1]) {
                      return (
                        <View>
                          <GuestForm
                            guestForm={guestForm}
                            setGuestForm={setGuestForm}
                            handleGuestFormChange={handleGuestFormChange}
                            addGuestForm={addGuestForm}
                            removeGuestForm={removeGuestForm}
                          />
                        </View>
                      );
                    } else if (selectedChip == CHIPS[2]) {
                      return (
                        <View>
                          <OtherMumukshuForm
                            mumukshuForm={mumukshuForm}
                            setMumukshuForm={setMumukshuForm}
                            handleMumukshuFormChange={handleMumukshuFormChange}
                            addMumukshuForm={addMumukshuForm}
                            removeMumukshuForm={removeMumukshuForm}
                          />
                        </View>
                      );
                    }
                  } else if (item.key === 'confirmButton') {
                    return (
                      <CustomButton
                        handlePress={async () => {
                          setIsSubmitting(true);
                          if (selectedChip == CHIPS[0]) {
                            await updateBooking('adhyayan', [selectedItem]);
                            router.push(`/booking/${types.ADHYAYAN_DETAILS_TYPE}`);
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
                                  const transformedData = transformData(guestForm);

                                  await updateGuestBooking('adhyayan', transformedData);
                                  setGuestForm(INITIAL_GUEST_FORM);
                                  router.push(`/guestBooking/${types.ADHYAYAN_DETAILS_TYPE}`);
                                },
                                () => {
                                  setIsSubmitting(false);
                                }
                              );
                            } else {
                              const transformedData = transformData(guestForm);

                              await updateGuestBooking('adhyayan', transformedData);
                              setGuestForm(INITIAL_GUEST_FORM);
                              router.push(`/guestBooking/${types.ADHYAYAN_DETAILS_TYPE}`);
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
                            router.push(`/mumukshuBooking/${types.ADHYAYAN_DETAILS_TYPE}`);
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
                    );
                  }
                }}
                keyExtractor={(item) => item.key}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <SectionList
        className="flex-grow-1 px-2 py-2"
        sections={data?.pages?.flatMap((page: any) => page) || []}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        nestedScrollEnabled={true}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        renderSectionHeader={renderSectionHeader}
        ListFooterComponent={renderFooter}
        onEndReachedThreshold={0.1}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
      />
      {!isFetchingNextPage && data?.pages?.[0]?.length == 0 && (
        <CustomEmptyMessage message={'No upcoming Adhyayans at this moment!'} />
      )}
    </View>
  );
};

function transformData(inputData: any) {
  const { adhyayan, guests } = inputData;

  return {
    adhyayan: adhyayan,
    guestGroup: guests.map((guest: any) => ({
      id: guest.cardno,
      name: guest.issuedto || guest.name,
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
