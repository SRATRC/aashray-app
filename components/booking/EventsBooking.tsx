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
import { colors, icons, status } from '../../constants';
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
import CustomDropdown from '../CustomDropdown';
import Toast from 'react-native-toast-message';
import OtherMumukshuForm from '../OtherMumukshuForm';
import CustomEmptyMessage from '../CustomEmptyMessage';
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
  carno: null,
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
      carno: null,
      other: null,
    },
  ],
};

const INITIAL_MUMUKSHU_FORM = {
  mumukshus: [
    {
      mobno: '',
      package: null,
      arrival: null,
      carno: null,
      other: null,
    },
  ],
};

const EventBooking = () => {
  const router: any = useRouter();
  const queryClient = useQueryClient();

  const { user } = useGlobalContext();

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
    setSelfForm(INITIAL_SELF_FORM);
    setGuestForm(INITIAL_GUEST_FORM);
  };

  const [selectedChip, setSelectedChip] = useState('Self');
  const handleChipClick = (chip: any) => {
    setSelectedChip(chip);
  };

  const [selfForm, setSelfForm] = useState(INITIAL_SELF_FORM);
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
          carno: null,
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
      if (guest.id) return guest.mobno && guest.mobno?.length == 10;
      else
        return (
          guest.name && guest.gender && guest.guestType && guest.mobno && guest.mobno?.length == 10
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
          mobno: '',
          package: null,
          arrival: null,
          carno: null,
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
    return mumukshuForm.mumukshus.every((mumukshu: any) => {
      if (mumukshu.arrival == ARRIVAL[0].key && !mumukshu.carno) {
        return false;
      }
      return (
        mumukshu.mobno &&
        mumukshu.mobno?.length == 10 &&
        mumukshu.cardno &&
        mumukshu.package &&
        mumukshu.arrival
      );
    });
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
            {moment(item.start_date).format('Do MMMM')} -{' '}
            {moment(item.end_date).format('Do MMMM, YYYY')}
          </Text>
          <Text className="font-pmedium text-gray-700">{item.name}</Text>
        </View>
      }>
      <HorizontalSeparator />
      <View className="mt-3">
        <Text className="font-psemibold text-gray-400">Available Packages:</Text>
        {item.UtsavPackagesDbs.map((packageitem: any) => (
          <View
            className="flex-row items-center justify-between font-pregular"
            key={packageitem.id}>
            <Text className="text-black">{packageitem.name}</Text>
            <Text className="text-black">₹ {packageitem.amount}</Text>
          </View>
        ))}
        <CustomButton
          text={item.status == status.STATUS_CLOSED ? 'Add to waitlist' : 'Register'}
          handlePress={() => {
            PACKAGES = item.UtsavPackagesDbs.map((item: any) => ({
              key: item.id,
              value: item.name,
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
                        {selectedChip == CHIPS[0] && (
                          <View>
                            <CustomDropdown
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
                            />

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
                                <CustomDropdown
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
                                />

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
                                    autoComplete={false}
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
                              <CustomDropdown
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
                                  setSelfForm({ ...selfForm, arrival: val });
                                }}
                              />

                              {selfForm.arrival == 'car' && (
                                <View>
                                  <FormField
                                    text="Enter Car Number"
                                    value={guestForm.guests[index].carno}
                                    handleChangeText={(e: any) =>
                                      setSelfForm({ ...selfForm, carno: e })
                                    }
                                    otherStyles="mt-7"
                                    inputStyles="font-pmedium text-base text-gray-400"
                                    containerStyles="bg-gray-100"
                                    placeholder="XX-XXX-XXXX"
                                    maxLength={10}
                                    autoComplete={false}
                                  />
                                </View>
                              )}

                              <FormField
                                text="Any other details?"
                                value={guestForm.guests[index].other}
                                handleChangeText={(e: any) =>
                                  setSelfForm({ ...selfForm, other: e })
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
                            const onSuccess = (data: any) => {
                              var options = {
                                key: `${process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID}`,
                                name: 'Vitraag Vigyaan',
                                image: 'https://vitraagvigyaan.org/img/logo.png',
                                description: 'Payment for Vitraag Vigyaan',
                                amount: `${data.data.amount}`,
                                currency: 'INR',
                                order_id: `${data.data.id}`,
                                prefill: {
                                  email: `${user.email}`,
                                  contact: `${user.mobno}`,
                                  name: `${user.issuedto}`,
                                },
                                theme: { color: colors.orange },
                              };
                              RazorpayCheckout.open(options)
                                .then((rzrpayData: any) => {
                                  // handle success
                                  setIsSubmitting(false);
                                  console.log(JSON.stringify(rzrpayData));
                                  router.replace('/booking/paymentConfirmation');
                                })
                                .catch((error: any) => {
                                  // handle failure
                                  setIsSubmitting(false);
                                  Toast.show({
                                    type: 'error',
                                    text1: 'An error occurred!',
                                    text2: error.reason,
                                  });
                                  console.log(JSON.stringify(error));
                                });
                            };

                            const onFinally = () => {
                              setIsSubmitting(false);
                              setIsModalVisible(false);
                            };

                            handleAPICall(
                              'POST',
                              '/utsav/booking',
                              null,
                              {
                                cardno: user.cardno,
                                utsavid: selectedItem.id,
                                packageid: selfForm.package,
                              },
                              onSuccess,
                              onFinally
                            );
                          }
                          if (selectedChip == CHIPS[1]) {
                            const onSuccess = (data: any) => {
                              var options = {
                                key: `${process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID}`,
                                name: 'Vitraag Vigyaan',
                                image: 'https://vitraagvigyaan.org/img/logo.png',
                                description: 'Payment for Vitraag Vigyaan',
                                amount: `${data.data.amount}`,
                                currency: 'INR',
                                order_id: `${data.data.id}`,
                                prefill: {
                                  email: `${user.email}`,
                                  contact: `${user.mobno}`,
                                  name: `${user.issuedto}`,
                                },
                                theme: { color: colors.orange },
                              };
                              RazorpayCheckout.open(options)
                                .then((rzrpayData: any) => {
                                  // handle success
                                  setIsSubmitting(false);
                                  console.log(JSON.stringify(rzrpayData));
                                  router.replace('/booking/paymentConfirmation');
                                })
                                .catch((error: any) => {
                                  // handle failure
                                  setIsSubmitting(false);
                                  Toast.show({
                                    type: 'error',
                                    text1: 'An error occurred!',
                                    text2: error.reason,
                                  });
                                  console.log(JSON.stringify(error));
                                });
                            };

                            const onFinally = () => {
                              setIsSubmitting(false);
                              setIsModalVisible(false);
                            };

                            handleAPICall(
                              'POST',
                              '/utsav/guest',
                              null,
                              {
                                cardno: user.cardno,
                                utsavid: selectedItem.id,
                                guests: guestForm.guests.map((guest: any) => ({
                                  id: guest.id,
                                  name: guest.name,
                                  gender: guest.gender,
                                  mobno: guest.mobno,
                                  type: guest.guestType,
                                  packageid: guest.package,
                                  arrival: guest.arrival,
                                  carno: guest.carno,
                                  other: guest.other,
                                })),
                              },
                              onSuccess,
                              onFinally
                            );
                          }
                          if (selectedChip == CHIPS[2]) {
                            if (!isMumukshuFormValid()) {
                              Alert.alert('Validation Error', 'Please fill all required fields');
                              setIsSubmitting(false);
                              return;
                            }

                            const onSuccess = (data: any) => {
                              var options = {
                                key: `${process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID}`,
                                name: 'Vitraag Vigyaan',
                                image: 'https://vitraagvigyaan.org/img/logo.png',
                                description: 'Payment for Vitraag Vigyaan',
                                amount: `${data.data.amount}`,
                                currency: 'INR',
                                order_id: `${data.data.id}`,
                                prefill: {
                                  email: `${user.email}`,
                                  contact: `${user.mobno}`,
                                  name: `${user.issuedto}`,
                                },
                                theme: { color: colors.orange },
                              };
                              RazorpayCheckout.open(options)
                                .then((rzrpayData: any) => {
                                  // handle success
                                  setIsSubmitting(false);
                                  console.log(JSON.stringify(rzrpayData));
                                  router.replace('/booking/paymentConfirmation');
                                })
                                .catch((error: any) => {
                                  // handle failure
                                  setIsSubmitting(false);
                                  Toast.show({
                                    type: 'error',
                                    text1: 'An error occurred!',
                                    text2: error.reason,
                                  });
                                  console.log(JSON.stringify(error));
                                });
                            };

                            const onFinally = () => {
                              setIsSubmitting(false);
                              setIsModalVisible(false);
                            };
                            handleAPICall(
                              'POST',
                              '/utsav/mumukshu',
                              null,
                              {
                                cardno: user.cardno,
                                utsavid: selectedItem.id,
                                mumukshus: mumukshuForm.mumukshus.map((mumukshu: any) => ({
                                  cardno: mumukshu.cardno,
                                  packageid: mumukshu.package,
                                  arrival: mumukshu.arrival,
                                  carno: mumukshu.carno,
                                  other: mumukshu.other,
                                })),
                              },
                              onSuccess,
                              onFinally
                            );
                          }
                          queryClient.invalidateQueries({
                            queryKey: ['utsavBooking', user.cardno],
                          });
                          setSelectedItem(null);
                          setSelectedChip('Self');
                          toggleModal();
                        }}
                        text={'Confirm'}
                        bgcolor="bg-secondary"
                        containerStyles="mt-4 p-2"
                        textStyles={'text-sm'}
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
        <CustomEmptyMessage
          lottiePath={require('../../assets/lottie/empty.json')}
          message={'No upcoming events at this moment!'}
        />
      )}
    </View>
  );
};

export default EventBooking;
