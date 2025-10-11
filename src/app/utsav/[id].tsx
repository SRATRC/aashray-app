import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
  Animated,
  Modal,
  KeyboardAvoidingView,
  Image,
  Share,
} from 'react-native';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { icons, status, types } from '@/src/constants';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore, useBookingStore } from '@/src/stores';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '@/src/components/CustomButton';
import handleAPICall from '@/src/utils/HandleApiCall';
import moment from 'moment';
import CustomChipGroup from '@/src/components/CustomChipGroup';
import GuestForm from '@/src/components/GuestForm';
import OtherMumukshuForm from '@/src/components/OtherMumukshuForm';
import HorizontalSeparator from '@/src/components/HorizontalSeparator';
import FormField from '@/src/components/FormField';
import CustomSelectBottomSheet from '@/src/components/CustomSelectBottomSheet';

// Types
type Package = {
  package_id: number;
  package_name: string;
  package_start: string;
  package_end: string;
  package_amount: number;
};

type Utsav = {
  utsav_id: number;
  utsav_name: string;
  utsav_start: string;
  utsav_end: string;
  utsav_month: string;
  utsav_location: string;
  utsav_status: string;
  packages: Package[];
  available_seats?: number;
  comments?: string;
};

let CHIPS = ['Self', 'Guest', 'Mumukshus'];

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
  utsav: null,
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
  utsav: null,
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

// Transform self form to mumukshu format
const transformSelfToMumukshu = (user: any, selfForm: any, utsav: any) => {
  const selfMumukshu = {
    cardno: user.cardno,
    issuedto: user.name || `${user.firstname} ${user.lastname}`.trim(),
    mobno: user.mobno || '',
    package: selfForm.package,
    package_name: selfForm.package_name,
    arrival: selfForm.arrival,
    carno: selfForm.carno,
    volunteer: selfForm.volunteer,
    other: selfForm.other,
  };

  return {
    utsav: utsav,
    mumukshus: [selfMumukshu],
  };
};

const UtsavPage = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);
  const updateMumukshuBooking = useBookingStore((state) => state.updateMumukshuBooking);
  const updateGuestBooking = useBookingStore((state) => state.updateGuestBooking);

  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedChip, setSelectedChip] = useState('Self');
  const [selfForm, setSelfForm] = useState(INITIAL_SELF_FORM);
  const [guestForm, setGuestForm] = useState(INITIAL_GUEST_FORM);
  const [mumukshuForm, setMumukshuForm] = useState(INITIAL_MUMUKSHU_FORM);
  const [packages, setPackages] = useState<any[]>([]);

  if (user?.res_status == status.STATUS_GUEST) {
    CHIPS = ['Self'];
  }

  // Reset isSubmitting state on component mount
  useEffect(
    useCallback(() => {
      setIsSubmitting(false);
    }, [])
  );

  // Animations
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Share functionality
  const handleShare = async () => {
    if (!utsav) return;

    try {
      const shareContent = {
        title: utsav.utsav_name,
        message: `Join us for ${utsav.utsav_name} from ${moment(utsav.utsav_start).format(
          'MMM D'
        )} to ${moment(utsav.utsav_end).format('MMM D, YYYY')} at ${utsav.utsav_location}.\n\nhttps://aashray.vitraagvigyaan.org/utsav/${utsav.utsav_id}`,
      };

      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share. Please try again.');
    }
  };

  // Modal toggle function
  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
    if (isModalVisible) {
      // Only reset when closing the modal
      setSelfForm(INITIAL_SELF_FORM);
      setGuestForm(INITIAL_GUEST_FORM);
      setMumukshuForm(INITIAL_MUMUKSHU_FORM);
    }
  };

  // Reset forms when navigating back to this screen
  useFocusEffect(
    useCallback(() => {
      setGuestForm(INITIAL_GUEST_FORM);
      setMumukshuForm(INITIAL_MUMUKSHU_FORM);
      setSelectedChip('Self');
      setIsModalVisible(false);
    }, [])
  );

  const handleChipClick = (chip: any) => {
    setSelectedChip(chip);
  };

  const isSelfFormValid = () => {
    return (
      selfForm.package &&
      selfForm.arrival &&
      !(selfForm.arrival === ARRIVAL[0].key && (!selfForm.carno || selfForm.carno.length !== 10))
    );
  };

  // Guest form handlers
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

  // Mumukshu form handlers
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

  // Fetch single utsav details
  const fetchUtsavDetails = async (): Promise<{ data: Utsav }> => {
    if (!id) {
      throw new Error('Utsav ID is required');
    }

    if (!user?.cardno) {
      throw new Error('User card number is required');
    }

    console.log('Fetching utsav details for id:', id);

    return new Promise((resolve, reject) => {
      const handleSuccess = (res: { data: Utsav }) => {
        try {
          if (!res?.data) {
            throw new Error('Invalid response format from server');
          }

          // Ensure packages array exists
          if (!Array.isArray(res.data.packages)) {
            console.warn('No packages found in the response');
            res.data.packages = [];
          }

          resolve(res);
        } catch (error) {
          console.error('Error processing utsav data:', error);
          reject(new Error('Failed to process utsav details'));
        }
      };

      const handleError = (error: any) => {
        console.error('API call failed:', error);
        reject(new Error(error.message || 'Failed to fetch utsav details'));
      };

      handleAPICall(
        'GET',
        `/utsav/${id}`,
        { cardno: user.cardno },
        null,
        handleSuccess,
        () => {},
        (error: Error) => handleError(error || new Error('Network request failed'))
      );
    });
  };

  const {
    data: utsavResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['utsavdeeplink', id, user?.cardno],
    queryFn: fetchUtsavDetails,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    enabled: !!id && !!user?.cardno,
  });

  const utsav = utsavResponse?.data;

  // Set utsav in forms when data is loaded
  useEffect(() => {
    if (utsav) {
      setGuestForm((prev: any) => ({
        ...prev,
        utsav: utsav,
      }));
      setMumukshuForm((prev: any) => ({
        ...prev,
        utsav: utsav,
      }));

      // Set package options
      if (utsav.packages) {
        const packageOptions = utsav.packages.map((packageItem) => ({
          key: packageItem.package_id,
          value: packageItem.package_name,
        }));
        setPackages(packageOptions);
      }
    }
  }, [utsav]);

  const handleBookingConfirm = async () => {
    if (!utsav) return;

    setIsSubmitting(true);
    try {
      if (selectedChip == CHIPS[0]) {
        if (!isSelfFormValid()) {
          Alert.alert('Validation Error', 'Please fill all required fields');
          setIsSubmitting(false);
          return;
        }

        // Transform self form to mumukshu format
        const mumukshuFormatData = transformSelfToMumukshu(user, selfForm, utsav);
        await updateMumukshuBooking('utsav', mumukshuFormatData);
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
              const mergedGuests = guestForm.guests.map((guest: any, idx: number) => ({
                ...guest,
                ...(res.guests?.[idx] || {}),
              }));

              setGuestForm((prev) => ({
                ...prev,
                guests: mergedGuests,
              }));

              console.log(
                'SETTING Guest Form Data: ',
                JSON.stringify({ ...guestForm, guests: mergedGuests })
              );

              await updateGuestBooking('utsav', {
                ...guestForm,
                guests: mergedGuests,
              });

              await updateGuestBooking('utsav', guestForm);
              setGuestForm(INITIAL_GUEST_FORM);

              if (utsav.utsav_location !== 'Research Centre')
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
          if (utsav.utsav_location !== 'Research Centre')
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
          utsav: utsav,
        };

        await updateMumukshuBooking('utsav', updatedForm);
        router.push(`/mumukshuBooking/${types.EVENT_DETAILS_TYPE}`);
      }
      setSelectedChip('Self');
      toggleModal();
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Failed to process booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Get availability status
  const getAvailabilityInfo = () => {
    if (utsav?.utsav_status === status.STATUS_CLOSED || utsav?.available_seats === 0) {
      return {
        text: 'Waitlist only',
        shortText: 'Waitlist',
        color: '#DC2626',
        isWaitlist: true,
      };
    }
    if (utsav?.available_seats && utsav.available_seats <= 10) {
      return {
        text: `Only ${utsav.available_seats} spots left`,
        shortText: `${utsav.available_seats} left`,
        color: '#DC2626',
        isWaitlist: false,
      };
    }
    return {
      text: 'Spots available',
      shortText: 'Available',
      color: '#059669',
      isWaitlist: false,
    };
  };

  // Header text animations
  const headerTextOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerTextTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [20, 0],
    extrapolate: 'clamp',
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-white">
        <View
          className="bg-white"
          style={{
            paddingTop: insets.top,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
            elevation: 5,
          }}>
          <View className="flex-row items-center justify-between px-4 py-4">
            <TouchableOpacity
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
              className="rounded-full bg-gray-50 p-3">
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>

            <View className="flex-1 items-center">
              <Text className="font-psemibold text-lg text-gray-900">Loading...</Text>
            </View>

            <View className="w-[44px]" />
          </View>
        </View>
        {/* Skeleton Loading */}
        <View className="animate-pulse p-6">
          <View className="mb-4 h-8 w-3/4 rounded-lg bg-gray-200" />
          <View className="mb-6 h-6 w-1/2 rounded-lg bg-gray-200" />
          <View className="mb-8 h-4 w-full rounded-lg bg-gray-200" />
          <View className="gap-4">
            <View className="h-24 rounded-xl bg-gray-200" />
            <View className="h-24 rounded-xl bg-gray-200" />
            <View className="h-32 rounded-xl bg-gray-200" />
          </View>
        </View>
      </View>
    );
  }

  if (isError || !utsav) {
    return (
      <View className="flex-1 bg-white">
        <View
          className="bg-white"
          style={{
            paddingTop: insets.top,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
            elevation: 5,
          }}>
          <View className="flex-row items-center justify-between px-4 py-4">
            <TouchableOpacity
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
              className="rounded-full bg-gray-50 p-3">
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>

            <View className="flex-1 items-center">
              <Text className="font-psemibold text-lg text-gray-900">Error</Text>
            </View>

            <View className="w-[44px]" />
          </View>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="warning-outline" size={48} color="#222" />
          <Text className="mb-2 mt-4 text-center font-psemibold text-xl text-gray-900">
            Something went wrong
          </Text>
          <Text className="mb-6 text-center text-base text-gray-600">
            We couldn't load this utsav. Please try again.
          </Text>
          <TouchableOpacity onPress={() => refetch()} className="rounded-lg bg-gray-900 px-6 py-3">
            <Text className="font-pmedium text-white">Try again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const availabilityInfo = getAvailabilityInfo();

  return (
    <View className="flex-1 bg-white">
      {/* Single Sticky Header */}
      <View
        className="bg-white"
        style={{
          paddingTop: insets.top,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3.84,
          elevation: 5,
        }}>
        <View className="flex-row items-center justify-between px-4 py-4">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
            className="rounded-full bg-gray-50 p-3 active:bg-gray-100"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}>
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </TouchableOpacity>

          <View className="flex-1 px-4">
            <Animated.View
              style={{
                opacity: headerTextOpacity,
                transform: [{ translateY: headerTextTranslateY }],
                alignItems: 'center',
              }}>
              <Text className="font-psemibold text-lg text-gray-900" numberOfLines={1}>
                {utsav.utsav_name}
              </Text>
              <Text className="font-pregular text-sm text-gray-500" numberOfLines={1}>
                {moment(utsav.utsav_start).format('MMM D')} -{' '}
                {moment(utsav.utsav_end).format('MMM D')}
              </Text>
            </Animated.View>
          </View>

          <TouchableOpacity
            onPress={handleShare}
            className="rounded-full bg-blue-50 p-3 active:bg-blue-100"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}>
            <Ionicons name="share-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
        {/* Header Content */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <View className="px-6">
            {/* Title Section */}
            <View className="my-6">
              <Text className="mb-2 font-pbold text-3xl leading-tight text-gray-900">
                {utsav.utsav_name}
              </Text>
              <View className="flex-row items-center gap-2">
                <Ionicons name="bonfire-outline" size={16} color="#EA580C" />
                <Text className="font-pmedium text-base text-gray-900">Utsav</Text>
                <Text className="text-gray-400">·</Text>
                <Text className="font-pmedium text-base text-gray-900 underline">
                  {utsav.utsav_location}
                </Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View className="mx-6 mb-6 h-[1px] bg-gray-200" />

          {/* Key Details Section */}
          <View className="px-6 pb-6">
            <Text className="mb-4 font-psemibold text-xl text-gray-900">Utsav details</Text>

            {/* Date & Time Card */}
            <View className="mb-4 rounded-xl border border-gray-200 p-4">
              <View className="mb-3 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="calendar-clear-outline" size={20} color="#222" />
                  <Text className="ml-2 font-psemibold text-base text-gray-900">
                    {moment(utsav.utsav_start).format('MMM D')} -{' '}
                    {moment(utsav.utsav_end).format('D, YYYY')}
                  </Text>
                </View>
                <View className="rounded-full bg-orange-100 px-3 py-1">
                  <Text className="font-pmedium text-xs text-orange-700">
                    {moment(utsav.utsav_end).diff(moment(utsav.utsav_start), 'days') + 1} days
                  </Text>
                </View>
              </View>
              <Text className="font-pregular text-sm text-gray-600">
                Full schedule will be shared after registration
              </Text>
            </View>

            {/* Location Card */}
            <View className="mb-4 rounded-xl border border-gray-200 p-4">
              <View className="flex-row items-start">
                <Ionicons name="location-outline" size={20} color="#222" />
                <View className="ml-2 flex-1">
                  <Text className="font-psemibold text-base text-gray-900">
                    {utsav.utsav_location}
                  </Text>
                  <Text className="mt-1 font-pregular text-sm text-gray-600">
                    {utsav.utsav_location === 'Research Centre'
                      ? 'Accommodation available at venue'
                      : 'Accommodation not available at venue'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Availability Status */}
            <View
              className={`mb-4 rounded-xl border p-4 ${
                availabilityInfo.isWaitlist ||
                (utsav.available_seats && utsav.available_seats <= 10)
                  ? 'border-red-200 bg-red-50'
                  : 'border-green-200 bg-green-50'
              }`}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons
                    name={availabilityInfo.isWaitlist ? 'time-outline' : 'checkmark-circle-outline'}
                    size={20}
                    color={availabilityInfo.color}
                  />
                  <Text
                    className="ml-2 font-psemibold text-base"
                    style={{ color: availabilityInfo.color }}>
                    {availabilityInfo.text}
                  </Text>
                </View>
                {utsav.utsav_status === 'open' && !availabilityInfo.isWaitlist && (
                  <View className="flex-row items-center">
                    <View className="mr-1 h-2 w-2 rounded-full bg-green-500" />
                    <Text className="font-pregular text-sm text-gray-600">Open</Text>
                  </View>
                )}
              </View>
              {availabilityInfo.isWaitlist && (
                <Text className="mt-2 font-pregular text-sm text-gray-600">
                  Join the waitlist to be notified if spots become available
                </Text>
              )}
            </View>
          </View>

          {/* Comments Section if available */}
          {utsav.comments && utsav.comments.trim() !== '' && (
            <>
              <View className="mx-6 mb-6 h-[1px] bg-gray-200" />
              <View className="px-6 pb-6">
                <Text className="mb-3 font-psemibold text-lg text-gray-900">
                  Additional Information
                </Text>
                <View className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <View className="flex-row items-start">
                    <Ionicons name="information-circle" size={20} color="#D97706" />
                    <Text className="ml-2 flex-1 font-pregular text-sm text-gray-700">
                      {utsav.comments}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Divider */}
          <View className="mx-6 mb-6 h-[1px] bg-gray-200" />

          {/* Pricing Section */}
          <View className="px-6 pb-6">
            <Text className="mb-4 font-psemibold text-xl text-gray-900">Package Details</Text>
            <View className="mb-3 flex-1 gap-y-3">
              {utsav.packages?.map((packageItem) => (
                <View
                  key={packageItem.package_id}
                  className="rounded-xl border border-gray-200 bg-white p-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="font-psemibold text-base text-gray-800">
                        {packageItem.package_name}
                      </Text>
                      <Text className="mt-1 font-pregular text-sm text-gray-500">
                        {moment(packageItem.package_start).format('MMM D')} -{' '}
                        {moment(packageItem.package_end).format('MMM D, YYYY')}
                      </Text>
                    </View>
                    <Text className="font-pbold text-xl text-secondary">
                      ₹{packageItem.package_amount}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Divider */}
          <View className="mx-6 mb-6 h-[1px] bg-gray-200" />

          {/* Things to Know */}
          <View className="mb-32 px-6 pb-6">
            <Text className="mb-4 font-psemibold text-xl text-gray-900">Things to know</Text>

            <View className="gap-4">
              {/* Timings */}
              <TouchableOpacity
                className="flex-row items-center justify-between"
                onPress={() => router.push('/utsav/dailySchedule')}>
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={20} color="#666" />
                  <View className="ml-3">
                    <Text className="font-psemibold text-base text-gray-900">Daily schedule</Text>
                    <Text className="font-pregular text-sm text-gray-600">
                      Timings will be shared before utsav
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>

              {/* Guidelines */}
              <TouchableOpacity
                className="flex-row items-center justify-between"
                onPress={() => router.push('/utsav/utsavGuidelines')}>
                <View className="flex-row items-center">
                  <Ionicons name="list-outline" size={20} color="#666" />
                  <View className="ml-3">
                    <Text className="font-psemibold text-base text-gray-900">Utsav guidelines</Text>
                    <Text className="font-pregular text-sm text-gray-600">
                      Discipline and conduct rules
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>

              {/* Contact */}
              <TouchableOpacity
                className="flex-row items-center justify-between"
                onPress={() => router.push('/contactInfo')}>
                <View className="flex-row items-center">
                  <Ionicons name="call-outline" size={20} color="#666" />
                  <View className="ml-3">
                    <Text className="font-psemibold text-base text-gray-900">Contact support</Text>
                    <Text className="font-pregular text-sm text-gray-600">
                      Get help with your booking
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.ScrollView>

      {/* Sticky Bottom Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white"
        style={{ paddingBottom: insets.bottom }}>
        <View className="flex-row items-center justify-between px-6 py-3">
          <View>
            <View className="flex-row items-baseline">
              <Text className="font-pregular text-sm text-gray-600">Starting from </Text>
              <Text className="font-pbold text-lg text-gray-900">
                {utsav.packages?.length
                  ? `₹${utsav.packages.reduce(
                      (min, pkg) => (pkg.package_amount < min ? pkg.package_amount : min),
                      utsav.packages[0]?.package_amount || 0
                    )}`
                  : 'N/A'}
              </Text>
            </View>
            <TouchableOpacity>
              <Text className="font-pregular text-sm text-gray-900 underline">
                {moment(utsav.utsav_start).format('MMM D')} - {moment(utsav.utsav_end).format('D')}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={toggleModal}
            className={`rounded-lg px-6 py-3 ${
              availabilityInfo.isWaitlist ? 'bg-gray-900' : 'bg-orange-600'
            }`}>
            <Text className="font-psemibold text-white">
              {availabilityInfo.isWaitlist ? 'Join waitlist' : 'Register now'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal */}
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
            <View className="max-h-[80%] w-[90%] max-w-[400px] rounded-lg bg-white p-5">
              <View className="mb-2 flex-row justify-between">
                <View className="flex-1 flex-col gap-y-1 pr-2">
                  <Text
                    className="font-pmedium text-sm text-black"
                    numberOfLines={2}
                    ellipsizeMode="tail">
                    {utsav?.utsav_name}
                  </Text>
                  <View className="flex-row gap-x-1">
                    <Text className="font-pregular text-xs text-gray-500">Date:</Text>
                    <Text className="font-pregular text-xs text-secondary">
                      {moment(utsav?.utsav_start).format('Do MMMM')} -{' '}
                      {moment(utsav?.utsav_end).format('Do MMMM')}
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

                {/* Self Form */}
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
                          package_name: packages.find((item: any) => item.key == val)?.value,
                        })
                      }
                    />

                    <CustomSelectBottomSheet
                      className="mt-7"
                      label="Will you be arriving in your own car?"
                      placeholder="Select option"
                      options={ARRIVAL}
                      selectedValue={selfForm.arrival}
                      onValueChange={(val: any) => setSelfForm({ ...selfForm, arrival: val })}
                    />

                    {selfForm.arrival == 'yes' && (
                      <View>
                        <FormField
                          text="Enter Car Number"
                          value={selfForm.carno}
                          handleChangeText={(e: any) => setSelfForm({ ...selfForm, carno: e })}
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
                      onValueChange={(val: any) => setSelfForm({ ...selfForm, volunteer: val })}
                      saveKeyInsteadOfValue={false}
                    />

                    <FormField
                      text="Any other details?"
                      value={selfForm.other}
                      handleChangeText={(e: any) => setSelfForm({ ...selfForm, other: e })}
                      otherStyles="mt-7 mb-4"
                      inputStyles="font-pmedium text-base"
                      containerStyles="bg-gray-100"
                      placeholder="Enter details here..."
                      multiline={true}
                      numberOfLines={3}
                    />
                  </View>
                )}

                {/* Guest Form */}
                {selectedChip == CHIPS[1] && (
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
                            handleChangeText={(e: any) => handleGuestFormChange(index, 'other', e)}
                            otherStyles="mt-7 mb-4"
                            inputStyles="font-pmedium text-bases"
                            containerStyles="bg-gray-100"
                            placeholder="Enter details here..."
                            multiline={true}
                            numberOfLines={3}
                          />
                        </View>
                      )}
                    </GuestForm>
                  </View>
                )}

                {/* Mumukshu Form */}
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
                          handleChangeText={(e: any) => handleMumukshuFormChange(index, 'other', e)}
                          otherStyles="mt-7 mb-4"
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

                {/* Confirm Button Section */}
                <CustomButton
                  handlePress={handleBookingConfirm}
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
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default UtsavPage;
