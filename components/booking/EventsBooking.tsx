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
} from 'react-native';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { colors, icons, status, types } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useRouter } from 'expo-router';
import CustomButton from '../CustomButton';
import handleAPICall from '../../utils/HandleApiCall';
import ExpandableItem from '../ExpandableItem';
import HorizontalSeparator from '../HorizontalSeparator';
import moment from 'moment';
import CustomChipGroup from '../CustomChipGroup';
import GuestForm from '../GuestForm';
import FormField from '../FormField';
import Toast from 'react-native-toast-message';
import OtherMumukshuForm from '../OtherMumukshuForm';
import CustomEmptyMessage from '../CustomEmptyMessage';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';

const CHIPS = ['Self', 'Guest', 'Mumukshus'];
const ARRIVAL = [
  { key: 'car', value: 'Self Car' },
  { key: 'raj pravas', value: 'Raj Pravas' },
  { key: 'other', value: 'Other' },
];

var PACKAGES: any = [];

const INITIAL_SELF_FORM = {
  package: null,
  arrival: null,
  carno: '',
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
      arrival: null,
      carno: '',
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
      arrival: null,
      carno: '',
      other: null,
    },
  ],
};

const EventBooking = () => {
  const router: any = useRouter();
  const queryClient = useQueryClient();

  const { user, updateBooking, updateMumukshuBooking } = useGlobalContext();

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
    setSelfForm(INITIAL_SELF_FORM);
    setGuestForm(INITIAL_GUEST_FORM);
    setMumukshuForm(INITIAL_MUMUKSHU_FORM);
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
          arrival: null,
          carno: '',
          other: null,
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
          guest.guestType &&
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
          arrival: null,
          carno: '',
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
    <ExpandableItem
      containerStyles={'mt-3'}
      visibleContent={
        <View className="flex basis-11/12">
          <Text className="font-psemibold text-secondary">
            {moment(item.utsav_start).format('Do MMMM')} -{' '}
            {moment(item.utsav_end).format('Do MMMM, YYYY')}
          </Text>
          <Text className="font-pmedium text-gray-700">{item.utsav_name}</Text>
        </View>
      }>
      <HorizontalSeparator />
      <View className="mt-3">
        <Text className="font-psemibold text-gray-400">Available Packages:</Text>
        {item.packages.map((packageitem: any) => (
          <View
            className="flex-row items-center justify-between font-pregular"
            key={packageitem.package_id}>
            <Text className="text-black">{packageitem.package_name}</Text>
            <Text className="text-black">₹ {packageitem.package_amount}</Text>
          </View>
        ))}
        <CustomButton
          text={item.status == status.STATUS_CLOSED ? 'Add to waitlist' : 'Register'}
          handlePress={() => {
            PACKAGES = item.packages.map((item: any) => ({
              key: item.package_id,
              value: item.package_name,
            }));

            setSelectedItem(item);
            setGuestForm((prev) => ({
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
                  <Text className="font-pmedium text-sm text-black">
                    {selectedItem?.utsav_name}
                  </Text>
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
                        {selectedChip == CHIPS[0] && (
                          <View>
                            {/* <CustomDropdown
                              otherStyles="mt-7"
                              text={'Package'}
                              placeholder={'Select Package'}
                              data={PACKAGES}
                              value={selfForm.package}
                              setSelected={(val: any) => {
                                setSelfForm({ ...selfForm, package: val });
                              }}
                            />

                            <CustomDropdown
                              otherStyles="mt-7"
                              text={'How will you arrive?'}
                              placeholder={'How will you arrive?'}
                              data={ARRIVAL}
                              value={selfForm.arrival}
                              setSelected={(val: any) => {
                                setSelfForm({ ...selfForm, arrival: val });
                              }}
                            /> */}

                            {selfForm.arrival == 'car' && (
                              <View>
                                <FormField
                                  text="Enter Car Number"
                                  value={selfForm.carno}
                                  handleChangeText={(e: any) =>
                                    setSelfForm({ ...selfForm, carno: e })
                                  }
                                  otherStyles="mt-7"
                                  inputStyles="font-pmedium text-base text-gray-400"
                                  containerStyles="bg-gray-100"
                                  placeholder="XX-XXX-XXXX"
                                  maxLength={10}
                                  autoComplete={'off'}
                                />
                              </View>
                            )}

                            <FormField
                              text="Any other details?"
                              value={selfForm.other}
                              handleChangeText={(e: any) => setSelfForm({ ...selfForm, other: e })}
                              otherStyles="mt-7"
                              inputStyles="font-pmedium text-base text-gray-400"
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
                                {/* <CustomDropdown
                                  otherStyles="mt-7"
                                  text={'Package'}
                                  placeholder={'Select Package'}
                                  data={PACKAGES}
                                  value={mumukshuForm.mumukshus[index].package}
                                  setSelected={(val: any) => {
                                    handleMumukshuFormChange(index, 'package', val);
                                  }}
                                />

                                <CustomDropdown
                                  otherStyles="mt-7"
                                  text={'How will you arrive?'}
                                  placeholder={'How will you arrive?'}
                                  data={ARRIVAL}
                                  value={mumukshuForm.mumukshus[index].arrival}
                                  setSelected={(val: any) => {
                                    handleMumukshuFormChange(index, 'arrival', val);
                                  }}
                                /> */}

                                {mumukshuForm.mumukshus[index].arrival == 'car' && (
                                  <FormField
                                    text="Enter Car Number"
                                    value={mumukshuForm.mumukshus[index].carno}
                                    handleChangeText={(e: any) =>
                                      handleMumukshuFormChange(index, 'carno', e)
                                    }
                                    otherStyles="mt-7"
                                    inputStyles="font-pmedium text-base text-gray-400"
                                    containerStyles="bg-gray-100"
                                    placeholder="XX-XXX-XXXX"
                                    maxLength={10}
                                    autoComplete={'off'}
                                  />
                                )}

                                <FormField
                                  text="Any other details?"
                                  value={mumukshuForm.mumukshus[index].other}
                                  handleChangeText={(e: any) =>
                                    handleMumukshuFormChange(index, 'other', e)
                                  }
                                  otherStyles="mt-7"
                                  inputStyles="font-pmedium text-base text-gray-400"
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
                              {/* <CustomDropdown
                                otherStyles="mt-7"
                                text={'Package'}
                                placeholder={'Select Package'}
                                data={PACKAGES}
                                value={guestForm.guests[index].package}
                                setSelected={(val: any) => {
                                  handleGuestFormChange(index, 'package', val);
                                }}
                              />

                              <CustomDropdown
                                otherStyles="mt-7"
                                text={'How will you arrive?'}
                                placeholder={'How will you arrive?'}
                                data={ARRIVAL}
                                value={guestForm.guests[index].arrival}
                                setSelected={(val: any) => {
                                  handleGuestFormChange(index, 'arrival', val);
                                }}
                              /> */}

                              {guestForm.guests[index].arrival == 'car' && (
                                <View>
                                  <FormField
                                    text="Enter Car Number"
                                    value={guestForm.guests[index].carno}
                                    handleChangeText={(e: any) =>
                                      handleGuestFormChange(index, 'carno', e)
                                    }
                                    otherStyles="mt-7"
                                    inputStyles="font-pmedium text-base text-gray-400"
                                    containerStyles="bg-gray-100"
                                    placeholder="XX-XXX-XXXX"
                                    maxLength={10}
                                  />
                                </View>
                              )}

                              <FormField
                                text="Any other details?"
                                value={guestForm.guests[index].other}
                                handleChangeText={(e: any) =>
                                  handleGuestFormChange(index, 'other', e)
                                }
                                otherStyles="mt-7"
                                inputStyles="font-pmedium text-base text-gray-400"
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

                            await updateBooking('utsav', mumukshuForm);
                            router.push(`/booking/${types.EVENT_DETAILS_TYPE}`);
                          }
                          if (selectedChip == CHIPS[1]) {
                            if (!isGuestFormValid()) {
                              Alert.alert('Validation Error', 'Please fill all required fields');
                              setIsSubmitting(false);
                              return;
                            }

                            const temp = transformMumukshuData(mumukshuForm);

                            await updateMumukshuBooking('utsav', temp);
                            router.push(`/mumukshuBooking/${types.EVENT_DETAILS_TYPE}`);
                          }
                          if (selectedChip == CHIPS[2]) {
                            if (!isMumukshuFormValid()) {
                              Alert.alert('Validation Error', 'Please fill all required fields');
                              setIsSubmitting(false);
                              return;
                            }
                          }
                          // queryClient.invalidateQueries({
                          //   queryKey: ['utsavBooking', user.cardno],
                          // });
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
        ListFooterComponent={renderFooter}
        onEndReachedThreshold={0.1}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
      />
      {!isFetchingNextPage && data?.pages?.[0]?.length == 0 && (
        <CustomEmptyMessage message={'No upcoming events at this moment!'} />
      )}
    </View>
  );
};

function transformMumukshuData(inputData: any) {
  const { utsav, mumukshus } = inputData;

  return {
    utsav: utsav,
    mumukshuGroup: mumukshus.map((mumukshu: any) => mumukshu),
  };
}

export default EventBooking;
