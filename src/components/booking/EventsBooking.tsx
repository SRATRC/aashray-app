import {
  View,
  Text,
  SectionList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  Alert,
  RefreshControl,
  Keyboard,
} from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { status, types } from '@/src/constants';
import { useAuthStore, useBookingStore } from '@/src/stores';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useTabBarPadding } from '@/src/hooks/useTabBarPadding';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomButton from '../CustomButton';
import handleAPICall from '@/src/utils/HandleApiCall';
import moment from 'moment';
import CustomChipGroup from '../CustomChipGroup';
import GuestForm from '../GuestForm';
import FormField from '../FormField';
import OtherMumukshuForm from '../OtherMumukshuForm';
import CustomEmptyMessage from '../CustomEmptyMessage';
import CustomSelectBottomSheet from '../CustomSelectBottomSheet';

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
      type: '',
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

const EventBooking = () => {
  const router: any = useRouter();
  const tabBarPadding = useTabBarPadding();

  useEffect(() => {
    setIsSubmitting(false);
  }, []);

  const user = useAuthStore((state) => state.user);
  const updateGuestBooking = useBookingStore((state) => state.updateGuestBooking);
  const updateMumukshuBooking = useBookingStore((state) => state.updateMumukshuBooking);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const toggleModal = () => {
    setIsModalVisible((prev) => {
      const wasOpen = prev;
      const next = !prev;
      if (wasOpen) {
        // Only reset when closing the modal
        setSelfForm(INITIAL_SELF_FORM);
        setGuestForm(INITIAL_GUEST_FORM);
        setMumukshuForm(INITIAL_MUMUKSHU_FORM);
        setPackages([]);
      }
      return next;
    });
  };

  const [selectedChip, setSelectedChip] = useState('Self');

  // Reset transient UI state when the screen regains focus to avoid stale modals/forms causing issues
  useFocusEffect(
    useCallback(() => {
      setIsModalVisible(false);
      setSelectedItem(null);
      setSelfForm(INITIAL_SELF_FORM);
      setGuestForm(INITIAL_GUEST_FORM);
      setMumukshuForm(INITIAL_MUMUKSHU_FORM);
      setSelectedChip('Self');
      setIsSubmitting(false);
      return undefined;
    }, [])
  );
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
          type: '',
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
    const cardno = user?.cardno;
    if (!cardno) return [];
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/utsav/upcoming',
        {
          cardno,
          page: pageParam,
        },
        null,
        (res: any) => {
          resolve(Array.isArray(res.data) ? res.data : []);
        },
        () => reject(new Error('Failed to fetch utsavs'))
      );
    });
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch }: any =
    useInfiniteQuery({
      queryKey: ['utsavs', user?.cardno],
      queryFn: fetchUtsavs,
      initialPageParam: 1,
      staleTime: 1000 * 60 * 30,
      getNextPageParam: (lastPage: any, pages: any) => {
        if (!lastPage || lastPage.length === 0) return undefined;
        return pages.length + 1;
      },
      enabled: !!user?.cardno,
      gcTime: 1000 * 60 * 30,
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
              {moment(item.utsav_start).isSame(moment(item.utsav_end), 'day')
                ? moment(item.utsav_start).format('MMM DD, YYYY')
                : `${moment(item.utsav_start).format('MMM DD')} - ${moment(item.utsav_end).format('MMM DD, YYYY')}`}
            </Text>
          </View>
          {item.utsav_status == status.STATUS_CLOSED && (
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
                {item.packages.map((packageitem: any) => (
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
            text={item.utsav_status == status.STATUS_CLOSED ? 'Join Waitlist' : 'Register Now'}
            handlePress={() => {
              const packageOptions = item.packages.map((packageItem: any) => ({
                key: packageItem.package_id,
                value: packageItem.package_name,
              }));

              setPackages(packageOptions);
              setSelectedItem(item);
              setGuestForm((prev) => ({
                ...prev,
                utsav: item,
              }));
              toggleModal();
            }}
            containerStyles="min-h-[48px] rounded-xl"
            bgcolor={item.utsav_status == status.STATUS_CLOSED ? 'bg-orange-500' : 'bg-secondary'}
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
    <View className="mt-3 w-full flex-1">
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        statusBarTranslucent={true}
        transparent={false}
        onRequestClose={toggleModal}>
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
          <KeyboardAwareScrollView
            bottomOffset={62}
            style={{ flex: 1, backgroundColor: 'white' }}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled">
            <View className="flex-1 bg-white">
              <View className="flex-row items-start justify-between border-b border-gray-200 px-4 py-4">
                <View className="flex-1 gap-y-1.5 pr-4">
                  <Text className="font-psemibold text-xl leading-tight text-gray-800">
                    {selectedItem?.utsav_name}
                  </Text>
                  <View className="flex-row items-center gap-x-2">
                    <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                    <Text className="font-pregular text-sm text-gray-600">
                      {moment(selectedItem?.utsav_start).format('Do MMMM')} -{' '}
                      {moment(selectedItem?.utsav_end).format('Do MMMM')}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={toggleModal} className="rounded-full bg-gray-100 p-2">
                  <Ionicons name="close" size={22} color="#3f3f46" />
                </TouchableOpacity>
              </View>

              {/* --- Scrollable Form Content --- */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 24 }}>
                <View className="px-4">
                  <View className="mt-4">
                    <Text className="font-psemibold text-base text-gray-700">Book For</Text>
                    <CustomChipGroup
                      chips={CHIPS}
                      selectedChip={selectedChip}
                      handleChipPress={handleChipClick}
                      containerStyles={'mt-3'}
                      chipContainerStyles={'py-2 px-4'}
                      textStyles={'text-base'}
                    />
                  </View>

                  <View className="mt-6">
                    {/* --- Self Form --- */}
                    {selectedChip == CHIPS[0] && (
                      <View className="gap-y-5">
                        <CustomSelectBottomSheet
                          label="Package"
                          placeholder="Select Package"
                          options={packages}
                          selectedValue={selfForm.package}
                          onValueChange={(val: any) =>
                            setSelfForm({
                              ...selfForm,
                              package: val,
                              package_name: packages.find((item: any) => item.key == val)?.value,
                            })
                          }
                        />

                        <CustomSelectBottomSheet
                          label="Will you be arriving in your own car?"
                          placeholder="Select option"
                          options={ARRIVAL}
                          selectedValue={selfForm.arrival}
                          onValueChange={(val: any) => setSelfForm({ ...selfForm, arrival: val })}
                        />

                        {selfForm.arrival == 'yes' && (
                          <FormField
                            text="Enter Car Number"
                            value={selfForm.carno}
                            handleChangeText={(e: any) => setSelfForm({ ...selfForm, carno: e })}
                            inputStyles="font-pmedium text-base"
                            containerStyles="bg-gray-100"
                            placeholder="XX-XXX-XXXX"
                            maxLength={10}
                            autoCapitalize={'characters'}
                            autoComplete={'off'}
                          />
                        )}

                        <CustomSelectBottomSheet
                          label="Would you like to volunteer?"
                          placeholder="Select option"
                          options={VOLUNTEER}
                          selectedValue={selfForm.volunteer}
                          onValueChange={(val: any) => setSelfForm({ ...selfForm, volunteer: val })}
                          saveKeyInsteadOfValue={false}
                        />

                        <FormField
                          text="Any other details? (Optional)"
                          value={selfForm.other}
                          handleChangeText={(e: any) => setSelfForm({ ...selfForm, other: e })}
                          inputStyles="font-pmedium text-base"
                          containerStyles="bg-gray-100"
                          placeholder="Enter details here..."
                          multiline={true}
                          numberOfLines={3}
                        />
                      </View>
                    )}

                    {/* --- Guest Form --- */}
                    {selectedChip == CHIPS[1] && (
                      <GuestForm
                        guestForm={guestForm}
                        setGuestForm={setGuestForm}
                        handleGuestFormChange={handleGuestFormChange}
                        addGuestForm={addGuestForm}
                        removeGuestForm={removeGuestForm}>
                        {(index: any) => (
                          <View className="mt-7 gap-y-7">
                            <CustomSelectBottomSheet
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
                              label="Will you be arriving in your own car?"
                              placeholder="Select option"
                              options={ARRIVAL}
                              selectedValue={guestForm.guests[index].arrival}
                              onValueChange={(val: any) => {
                                handleGuestFormChange(index, 'arrival', val);
                              }}
                            />
                            {guestForm.guests[index].arrival == 'yes' && (
                              <FormField
                                text="Enter Car Number"
                                value={guestForm.guests[index].carno}
                                handleChangeText={(e: any) =>
                                  handleGuestFormChange(index, 'carno', e)
                                }
                                inputStyles="font-pmedium text-base"
                                containerStyles="bg-gray-100"
                                placeholder="XX-XXX-XXXX"
                                autoCapitalize={'characters'}
                                maxLength={10}
                              />
                            )}

                            <CustomSelectBottomSheet
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
                              text="Any other details? (Optional)"
                              value={guestForm.guests[index].other}
                              handleChangeText={(e: any) =>
                                handleGuestFormChange(index, 'other', e)
                              }
                              inputStyles="font-pmedium text-bases"
                              containerStyles="bg-gray-100"
                              placeholder="Enter details here..."
                              multiline={true}
                              numberOfLines={3}
                            />
                          </View>
                        )}
                      </GuestForm>
                    )}

                    {/* --- Mumukshu Form --- */}
                    {selectedChip == CHIPS[2] && (
                      <OtherMumukshuForm
                        mumukshuForm={mumukshuForm}
                        setMumukshuForm={setMumukshuForm}
                        handleMumukshuFormChange={handleMumukshuFormChange}
                        addMumukshuForm={addMumukshuForm}
                        removeMumukshuForm={removeMumukshuForm}>
                        {(index: any) => (
                          <View className="mt-7 gap-y-7">
                            <CustomSelectBottomSheet
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
                                inputStyles="font-pmedium text-base"
                                containerStyles="bg-gray-100"
                                placeholder="XX-XXX-XXXX"
                                maxLength={10}
                                autoCapitalize={'characters'}
                                autoComplete={'off'}
                              />
                            )}

                            <CustomSelectBottomSheet
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
                              text="Any other details? (Optional)"
                              value={mumukshuForm.mumukshus[index].other}
                              handleChangeText={(e: any) =>
                                handleMumukshuFormChange(index, 'other', e)
                              }
                              inputStyles="font-pmedium text-base"
                              containerStyles="bg-gray-100"
                              placeholder="Enter details here..."
                              multiline={true}
                              numberOfLines={3}
                            />
                          </View>
                        )}
                      </OtherMumukshuForm>
                    )}
                  </View>
                </View>
              </ScrollView>

              <View className="px-4 py-3">
                <CustomButton
                  handlePress={async () => {
                    Keyboard.dismiss();
                    setIsSubmitting(true);
                    if (selectedChip == CHIPS[0]) {
                      if (!isSelfFormValid()) {
                        Alert.alert('Validation Error', 'Please fill all required fields');
                        setIsSubmitting(false);
                        return;
                      }

                      const updatedForm = {
                        mumukshus: [
                          {
                            cardno: user.cardno,
                            mobno: user.mobno,
                            issuedto: user.name,
                            gender: user.gender,
                            res_status: user.res_status,
                            package: selfForm.package,
                            package_name: selfForm.package_name,
                            arrival: selfForm.arrival,
                            carno: selfForm.carno,
                            volunteer: selfForm.volunteer,
                            other: selfForm.other,
                          },
                        ],
                        utsav: selectedItem,
                      };
                      await updateMumukshuBooking('utsav', updatedForm);
                      router.push(`/booking/${types.EVENT_DETAILS_TYPE}`);
                    }
                    if (selectedChip == CHIPS[1]) {
                      if (!isGuestFormValid()) {
                        Alert.alert('Validation Error', 'Please fill all required fields');
                        setIsSubmitting(false);
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
                            const mergedGuests = guestForm.guests.map(
                              (guest: any, idx: number) => ({
                                ...guest,
                                ...(res.guests?.[idx] || {}),
                              })
                            );

                            setGuestForm((prev) => ({
                              ...prev,
                              guests: mergedGuests,
                            }));

                            await updateGuestBooking('utsav', {
                              ...guestForm,
                              guests: mergedGuests,
                            });

                            setGuestForm(INITIAL_GUEST_FORM);

                            if (selectedItem.utsav_location !== 'Research Centre')
                              router.push('/guestBooking/bookingConfirmation');
                            else router.push(`/guestBooking/${types.EVENT_DETAILS_TYPE}`);
                          },
                          () => {
                            setIsSubmitting(false);
                          }
                        );
                      } else {
                        await updateGuestBooking('utsav', guestForm);
                        setGuestForm(INITIAL_GUEST_FORM);
                        if (selectedItem.utsav_location !== 'Research Centre')
                          router.push('/guestBooking/guestBookingConfirmation');
                        else router.push(`/guestBooking/${types.EVENT_DETAILS_TYPE}`);
                        setIsSubmitting(false);
                      }
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
                  text={'Continue'}
                  bgcolor="bg-secondary"
                  containerStyles="mb-6 py-3 rounded-xl"
                  textStyles={'text-base text-white font-psemibold'}
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
              </View>
            </View>
          </KeyboardAwareScrollView>
        </SafeAreaView>
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
        keyExtractor={(item) =>
          item?.utsav_id != null ? String(item.utsav_id) : String(item?.id ?? '0')
        }
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

export default EventBooking;
