import {
  View,
  Text,
  SectionList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { icons, status, types } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useRouter } from 'expo-router';
import CustomButton from '../CustomButton';
import handleAPICall from '../../utils/HandleApiCall';
import HorizontalSeparator from '../HorizontalSeparator';
import moment from 'moment';
import CustomChipGroup from '../CustomChipGroup';
import GuestForm from '../GuestForm';
import FormField from '../FormField';
import OtherMumukshuForm from '../OtherMumukshuForm';
import CustomEmptyMessage from '../CustomEmptyMessage';
import CustomSelectBottomSheet from '../CustomSelectBottomSheet';
import { Ionicons } from '@expo/vector-icons';

const CHIPS = ['Self', 'Guest', 'Mumukshus'];
const ARRIVAL = [
  { key: 'yes', value: 'Yes' },
  { key: 'no', value: 'No' },
];
const VOLUNTEER = [
  { key: 'admin', value: 'Admin' },
  { key: 'logistics', value: 'Logistics' },
  { key: 'kitchen', value: 'Kitchen' },
  { key: 'vv', value: 'Vitraag Vigyaan Bhavan' },
  { key: 'samadhi', value: 'Samadhi Sthal' },
  { key: 'none', value: 'Unable to Volunteer' },
];

const INITIAL_SELF_FORM = {
  package: null,
  package_name: '',
  arrival: null,
  carno: '',
  volunteer: null,
  other: null,
};

const INITIAL_GUEST_FORM = {
  guests: [
    {
      name: '',
      gender: '',
      mobno: '',
      guestType: '',
      package: null,
      package_name: '',
      arrival: null,
      carno: '',
      volunteer: null,
      other: null,
    },
  ],
};

const INITIAL_MUMUKSHU_FORM = {
  mumukshus: [
    {
      cardno: '',
      mobno: '',
      package: null,
      package_name: '',
      arrival: null,
      carno: '',
      volunteer: null,
      other: null,
    },
  ],
};

const EventBookingDirect = () => {
  const router: any = useRouter();

  useEffect(
    useCallback(() => {
      setIsSubmitting(false);
    }, [])
  );

  const { user, updateBooking, updateGuestBooking, updateMumukshuBooking } = useGlobalContext();

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
    if (isModalVisible) {
      // Only reset when closing the modal
      setSelfForm(INITIAL_SELF_FORM);
      setGuestForm(INITIAL_GUEST_FORM);
      setMumukshuForm(INITIAL_MUMUKSHU_FORM);
      setPackages([]);
    }
  };

  const [selectedChip, setSelectedChip] = useState('Self');
  const handleChipClick = (chip: any) => {
    setSelectedChip(chip);
  };

  const [selfForm, setSelfForm] = useState(INITIAL_SELF_FORM);

  const isSelfFormValid = () => {
    return (
      selfForm.package &&
      selfForm.arrival &&
      !(selfForm.arrival === ARRIVAL[0].key && (!selfForm.carno || selfForm.carno.length !== 10))
    );
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
          guestType: '',
          package: null,
          package_name: '',
          arrival: null,
          carno: '',
          volunteer: null,
          other: null,
        },
      ],
    }));
  };

  const handleGuestFormChange = (index: any, key: any, value: any) => {
    setGuestForm((prev) => ({
      ...prev,
      guests: prev.guests.map((guest, i) => (i === index ? { ...guest, [key]: value } : guest)),
    }));
  };

  const removeGuestForm = (indexToRemove: any) => {
    setGuestForm((prev) => ({
      ...prev,
      guests: prev.guests.filter((_, index) => index !== indexToRemove),
    }));
  };

  const isGuestFormValid = () => {
    return guestForm.guests.every((guest: any) => {
      if (guest.cardno)
        return (
          guest.mobno &&
          guest.mobno?.length == 10 &&
          guest.package &&
          guest.arrival &&
          !(guest.arrival === ARRIVAL[0].key && (!guest.carno || guest.carno.length !== 10))
        );
      else
        return (
          guest.name &&
          guest.gender &&
          guest.type &&
          guest.mobno &&
          guest.mobno?.length == 10 &&
          guest.package &&
          guest.arrival &&
          !(guest.arrival === ARRIVAL[0].key && (!guest.carno || guest.carno.length !== 10))
        );
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
          package: null,
          package_name: '',
          arrival: null,
          carno: '',
          volunteer: null,
          other: null,
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
    return mumukshuForm.mumukshus.every(
      (mumukshu: any) =>
        mumukshu.mobno?.length === 10 &&
        mumukshu.cardno &&
        mumukshu.package &&
        mumukshu.arrival &&
        !(mumukshu.arrival === ARRIVAL[0].key && (!mumukshu.carno || mumukshu.carno.length !== 10))
    );
  };

  const fetchUtsavs = async ({ pageParam = 1 }) => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/utsav/upcoming',
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
    queryKey: ['utsavs', user.cardno],
    queryFn: fetchUtsavs,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 30,
    getNextPageParam: (lastPage: any, pages: any) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      return pages.length + 1;
    },
  });

  const renderItem = ({ item }: any) => (
    <View
      className="mx-1 mb-2 mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-400"
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
              {moment(item.utsav_start).format('MMM DD')} -{' '}
              {moment(item.utsav_end).format('MMM DD, YYYY')}
            </Text>
          </View>
          {item.status == status.STATUS_CLOSED && (
            <View className="rounded-full bg-orange-100 px-2 py-1">
              <Text className="font-pmedium text-xs text-orange-600">Waitlist</Text>
            </View>
          )}
        </View>
        <Text className="font-psemibold text-lg leading-6 text-gray-800" numberOfLines={2}>
          {item.utsav_name}
        </Text>
      </View>

      <View className="px-5">
        <View className="mb-4 gap-y-2">
          <View className="flex-row items-center">
            <View className="mr-3 mt-0.5">
              <Ionicons name="location-outline" size={18} color="#6b7280" />
            </View>
            <View className="flex-row gap-x-2">
              <Text className="font-pmedium text-base tracking-wide text-gray-500">Location:</Text>
              <Text className="font-pregular text-base tracking-wide text-gray-500">
                {item.utsav_location ? item.utsav_location : 'Not Available'}
              </Text>
            </View>
          </View>
          <View className="mb-3 flex-row items-start">
            <View className="mr-3 mt-0.5">
              <Ionicons name="document-text-outline" size={18} color="#6b7280" />
            </View>
            <View className="flex-1">
              <Text className="mb-2 font-pmedium text-base tracking-wide text-gray-500">
                Available Packages
              </Text>
              <View className="gap-y-2">
                {item.packages.map((packageitem: any, index: number) => (
                  <View
                    className="flex-row items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                    key={packageitem.package_id}>
                    <Text className="flex-1 font-pmedium text-gray-800">
                      {packageitem.package_name}
                    </Text>
                    <Text className="ml-2 font-psemibold text-secondary">
                      ₹{packageitem.package_amount}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View className="mb-4 border-t border-gray-200 pt-4">
          <CustomButton
            text={item.status == status.STATUS_CLOSED ? 'Join Waitlist' : 'Register Now'}
            handlePress={() => {
              const packageOptions = item.packages.map((packageItem: any) => ({
                key: packageItem.package_id,
                value: packageItem.package_name,
              }));

              setPackages(packageOptions);
              setSelectedItem(item);
              setGuestForm((prev) => ({
                ...prev,
                adhyayan: item,
              }));
              toggleModal();
            }}
            containerStyles="min-h-[48px] rounded-xl"
            bgcolor={item.status == status.STATUS_CLOSED ? 'bg-orange-500' : 'bg-secondary'}
            textStyles="font-psemibold text-white text-base"
            isLoading={isSubmitting}
          />
        </View>
      </View>
    </View>
  );

  const renderSectionHeader = ({ section: { title } }: { section: { title: any } }) => (
    <Text className="mx-1 mt-2 font-psemibold text-lg">{title}</Text>
  );

  const renderFooter = () => (
    <View className="items-center">
      {(isFetchingNextPage || isLoading) && <ActivityIndicator />}
      {!hasNextPage && data?.pages?.[0]?.length > 0 && <Text>No more utsavs at the moment</Text>}
    </View>
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <View className="w-full">
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
                <View className="flex-col gap-y-1">
                  <Text className="font-pmedium text-sm text-black">
                    {selectedItem?.utsav_name}
                  </Text>
                  <View className="flex-row gap-x-1">
                    <Text className="font-pregular text-xs text-gray-500">Date:</Text>
                    <Text className="font-pregular text-xs text-secondary">
                      {moment(selectedItem?.utsav_start).format('Do MMMM')} -{' '}
                      {moment(selectedItem?.utsav_end).format('Do MMMM')}
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
                        {selectedChip == CHIPS[0] && (
                          <View>
                            <CustomSelectBottomSheet
                              className="mt-7"
                              label="Package"
                              placeholder="Select Package"
                              options={packages}
                              selectedValue={selfForm.package}
                              onValueChange={(val: any) =>
                                setSelfForm({
                                  ...selfForm,
                                  package: val,
                                  package_name: packages.find((item: any) => item.key == val)
                                    ?.value,
                                })
                              }
                            />

                            <CustomSelectBottomSheet
                              className="mt-7"
                              label="Will you be arriving in your own car?"
                              placeholder="Select option"
                              options={ARRIVAL}
                              selectedValue={selfForm.arrival}
                              onValueChange={(val: any) =>
                                setSelfForm({ ...selfForm, arrival: val })
                              }
                            />

                            {selfForm.arrival == 'yes' && (
                              <View>
                                <FormField
                                  text="Enter Car Number"
                                  value={selfForm.carno}
                                  handleChangeText={(e: any) =>
                                    setSelfForm({ ...selfForm, carno: e })
                                  }
                                  otherStyles="mt-7"
                                  inputStyles="font-pmedium text-base"
                                  containerStyles="bg-gray-100"
                                  placeholder="XX-XXX-XXXX"
                                  maxLength={10}
                                  autoCapitalize={'characters'}
                                  autoComplete={'off'}
                                />
                              </View>
                            )}

                            <CustomSelectBottomSheet
                              className="mt-7"
                              label="Would you like to volunteer?"
                              placeholder="Select option"
                              options={VOLUNTEER}
                              selectedValue={selfForm.volunteer}
                              onValueChange={(val: any) =>
                                setSelfForm({ ...selfForm, volunteer: val })
                              }
                              saveKeyInsteadOfValue={false}
                            />

                            <FormField
                              text="Any other details?"
                              value={selfForm.other}
                              handleChangeText={(e: any) => setSelfForm({ ...selfForm, other: e })}
                              otherStyles="mt-7"
                              inputStyles="font-pmedium text-base"
                              containerStyles="bg-gray-100"
                              placeholder="Enter details here..."
                            />
                          </View>
                        )}
                        {selectedChip == CHIPS[2] && (
                          <OtherMumukshuForm
                            mumukshuForm={mumukshuForm}
                            setMumukshuForm={setMumukshuForm}
                            handleMumukshuFormChange={handleMumukshuFormChange}
                            addMumukshuForm={addMumukshuForm}
                            removeMumukshuForm={removeMumukshuForm}>
                            {(index: any) => (
                              <View>
                                <CustomSelectBottomSheet
                                  className="mt-7"
                                  label="Package"
                                  placeholder="Select Package"
                                  options={packages}
                                  selectedValue={mumukshuForm.mumukshus[index].package}
                                  onValueChange={(val: any) => {
                                    handleMumukshuFormChange(index, 'package', val);
                                    handleMumukshuFormChange(
                                      index,
                                      'package_name',
                                      packages.find((item: any) => item.key == val)?.value
                                    );
                                  }}
                                />

                                <CustomSelectBottomSheet
                                  className="mt-7"
                                  label="Will you be arriving in your own car?"
                                  placeholder="Select option"
                                  options={ARRIVAL}
                                  selectedValue={mumukshuForm.mumukshus[index].arrival}
                                  onValueChange={(val: any) => {
                                    handleMumukshuFormChange(index, 'arrival', val);
                                  }}
                                />

                                {mumukshuForm.mumukshus[index].arrival == 'yes' && (
                                  <FormField
                                    text="Enter Car Number"
                                    value={mumukshuForm.mumukshus[index].carno}
                                    handleChangeText={(e: any) =>
                                      handleMumukshuFormChange(index, 'carno', e)
                                    }
                                    otherStyles="mt-7"
                                    inputStyles="font-pmedium text-base"
                                    containerStyles="bg-gray-100"
                                    placeholder="XX-XXX-XXXX"
                                    maxLength={10}
                                    autoCapitalize={'characters'}
                                    autoComplete={'off'}
                                  />
                                )}

                                <CustomSelectBottomSheet
                                  className="mt-7"
                                  label="Would you like to volunteer?"
                                  placeholder="Select option"
                                  options={VOLUNTEER}
                                  selectedValue={mumukshuForm.mumukshus[index].volunteer}
                                  onValueChange={(val: any) =>
                                    handleMumukshuFormChange(index, 'volunteer', val)
                                  }
                                  saveKeyInsteadOfValue={false}
                                />

                                <FormField
                                  text="Any other details?"
                                  value={mumukshuForm.mumukshus[index].other}
                                  handleChangeText={(e: any) =>
                                    handleMumukshuFormChange(index, 'other', e)
                                  }
                                  otherStyles="mt-7"
                                  inputStyles="font-pmedium text-base"
                                  containerStyles="bg-gray-100"
                                  placeholder="Enter details here..."
                                />
                              </View>
                            )}
                          </OtherMumukshuForm>
                        )}
                      </View>
                    );
                  } else if (item.key === 'guestForm' && selectedChip == CHIPS[1]) {
                    return (
                      <View>
                        <GuestForm
                          guestForm={guestForm}
                          setGuestForm={setGuestForm}
                          handleGuestFormChange={handleGuestFormChange}
                          addGuestForm={addGuestForm}
                          removeGuestForm={removeGuestForm}>
                          {(index: any) => (
                            <View>
                              <CustomSelectBottomSheet
                                className="mt-7"
                                label="Package"
                                placeholder="Select Package"
                                options={packages}
                                selectedValue={guestForm.guests[index].package}
                                onValueChange={(val: any) => {
                                  handleGuestFormChange(index, 'package', val);
                                  handleGuestFormChange(
                                    index,
                                    'package_name',
                                    packages.find((item: any) => item.key == val)?.value
                                  );
                                }}
                              />

                              <CustomSelectBottomSheet
                                className="mt-7"
                                label="Will you be arriving in your own car?"
                                placeholder="Select option"
                                options={ARRIVAL}
                                selectedValue={guestForm.guests[index].arrival}
                                onValueChange={(val: any) => {
                                  handleGuestFormChange(index, 'arrival', val);
                                }}
                              />
                              {guestForm.guests[index].arrival == 'yes' && (
                                <View>
                                  <FormField
                                    text="Enter Car Number"
                                    value={guestForm.guests[index].carno}
                                    handleChangeText={(e: any) =>
                                      handleGuestFormChange(index, 'carno', e)
                                    }
                                    otherStyles="mt-7"
                                    inputStyles="font-pmedium text-base"
                                    containerStyles="bg-gray-100"
                                    placeholder="XX-XXX-XXXX"
                                    autoCapitalize={'characters'}
                                    maxLength={10}
                                  />
                                </View>
                              )}

                              <CustomSelectBottomSheet
                                className="mt-7"
                                label="Would you like to volunteer?"
                                placeholder="Select option"
                                options={VOLUNTEER}
                                selectedValue={guestForm.guests[index].volunteer}
                                onValueChange={(val: any) =>
                                  handleGuestFormChange(index, 'volunteer', val)
                                }
                                saveKeyInsteadOfValue={false}
                              />

                              <FormField
                                text="Any other details?"
                                value={guestForm.guests[index].other}
                                handleChangeText={(e: any) =>
                                  handleGuestFormChange(index, 'other', e)
                                }
                                otherStyles="mt-7"
                                inputStyles="font-pmedium text-bases"
                                containerStyles="bg-gray-100"
                                placeholder="Enter details here..."
                              />
                            </View>
                          )}
                        </GuestForm>
                      </View>
                    );
                  } else if (item.key === 'confirmButton') {
                    return (
                      <CustomButton
                        handlePress={async () => {
                          setIsSubmitting(true);
                          if (selectedChip == CHIPS[0]) {
                            if (!isSelfFormValid()) {
                              Alert.alert('Validation Error', 'Please fill all required fields');
                              setIsSubmitting(false);
                              return;
                            }

                            const updatedForm = {
                              ...selfForm,
                              utsav: selectedItem,
                            };
                            await updateBooking('utsav', updatedForm);
                            router.push(`/booking/${types.EVENT_DETAILS_TYPE}`);
                          }
                          if (selectedChip == CHIPS[1]) {
                            if (!isGuestFormValid()) {
                              Alert.alert('Validation Error', 'Please fill all required fields');
                              setIsSubmitting(false);
                              return;
                            }

                            const updatedForm = {
                              ...guestForm,
                              utsav: selectedItem,
                            };

                            await updateGuestBooking('utsav', updatedForm);
                            router.push(`/guestBooking/${types.EVENT_DETAILS_TYPE}`);
                          }
                          if (selectedChip == CHIPS[2]) {
                            if (!isMumukshuFormValid()) {
                              Alert.alert('Validation Error', 'Please fill all required fields');
                              setIsSubmitting(false);
                              return;
                            }

                            const updatedForm = {
                              ...mumukshuForm,
                              utsav: selectedItem,
                            };

                            await updateMumukshuBooking('utsav', updatedForm);
                            router.push(`/mumukshuBooking/${types.EVENT_DETAILS_TYPE}`);
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
                          selectedChip === CHIPS[0]
                            ? !isSelfFormValid()
                            : selectedChip === CHIPS[1]
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
        keyExtractor={(item) => item.utsav_id.toString()}
        renderSectionHeader={renderSectionHeader}
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
              <CustomEmptyMessage message={'No upcoming Utsavs at this moment!'} />
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

export default EventBookingDirect;
