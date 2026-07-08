// src/features/events/screens/UtsavDetailScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import moment from 'moment';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Animated,
  Modal,
  KeyboardAvoidingView,
  Image,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createGuests, useUtsavDetail } from '../api';
import EventDetailHeader from '../components/EventDetailHeader';
import EventHeroInfo from '../components/EventHeroInfo';
import EventKeyDetails from '../components/EventKeyDetails';
import type { AvailabilityInfo } from '../components/EventKeyDetails';
import EventPackageSelector from '../components/EventPackageSelector';
import EventThingsToKnow from '../components/EventThingsToKnow';
import type { Utsav } from '../types';

import CustomAlert from '@/components/CustomAlert';
import CustomButton from '@/components/CustomButton';
import CustomChipGroup from '@/components/CustomChipGroup';
import GuestForm from '@/components/GuestForm';
import HorizontalSeparator from '@/components/HorizontalSeparator';
import OtherMumukshuForm from '@/components/OtherMumukshuForm';
import { icons, status, types } from '@/constants';
import { useAuthStore, useBookingStore } from '@/stores';

let CHIPS = ['Self', 'Guest', 'Mumukshus'];

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
    utsav,
    mumukshus: [selfMumukshu],
  };
};

const UtsavDetailScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
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
  const [packages, setPackages] = useState<{ key: any; value: string }[]>([]);

  if (user?.res_status === status.STATUS_GUEST) {
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

  const {
    data: utsav,
    isLoading,
    isError,
    refetch,
  } = useUtsavDetail(id, user?.cardno) as {
    data: Utsav | undefined;
    isLoading: boolean;
    isError: boolean;
    refetch: () => Promise<unknown>;
  };

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
      CustomAlert.alert('Error', 'Failed to share. Please try again.');
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
      !(selfForm.arrival === 'yes' && (!selfForm.carno || selfForm.carno.length !== 10))
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
          guest.mobno?.length === 10 &&
          guest.package &&
          guest.arrival &&
          !(guest.arrival === 'yes' && (!guest.carno || guest.carno.length !== 10))
        );
      else
        return (
          guest.name &&
          guest.gender &&
          guest.type &&
          guest.mobno &&
          guest.mobno?.length === 10 &&
          guest.package &&
          guest.arrival &&
          !(guest.arrival === 'yes' && (!guest.carno || guest.carno.length !== 10))
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
        !(mumukshu.arrival === 'yes' && (!mumukshu.carno || mumukshu.carno.length !== 10))
    );
  };

  // Set utsav in forms when data is loaded
  useEffect(() => {
    if (utsav) {
      setGuestForm((prev: any) => ({
        ...prev,
        utsav,
      }));
      setMumukshuForm((prev: any) => ({
        ...prev,
        utsav,
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
      if (selectedChip === CHIPS[0]) {
        if (!isSelfFormValid()) {
          CustomAlert.alert('Validation Error', 'Please fill all required fields');
          setIsSubmitting(false);
          return;
        }

        // Transform self form to mumukshu format
        const mumukshuFormatData = transformSelfToMumukshu(user, selfForm, utsav);
        await updateMumukshuBooking('utsav', mumukshuFormatData);
        router.push(`/booking/${types.EVENT_DETAILS_TYPE}`);
      }
      if (selectedChip === CHIPS[1]) {
        if (!isGuestFormValid()) {
          CustomAlert.alert('Validation Error', 'Please fill all required fields');
          setIsSubmitting(false);
          return;
        }

        if (guestForm.guests.filter((guest: any) => !guest.cardno).length > 0) {
          try {
            const createdGuests = await createGuests(user.cardno, guestForm.guests);
            const mergedGuests = guestForm.guests.map((guest: any, idx: number) => ({
              ...guest,
              ...((createdGuests as any)?.[idx] || {}),
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
              router.push('/guestBooking/bookingReview');
            else router.push(`/guestBooking/${types.EVENT_DETAILS_TYPE}`);
          } catch {
            // Match legacy handleAPICall behavior: the create-guest error
            // callback only reset isSubmitting (handled by the outer
            // `finally` below), so swallow here and let the modal still
            // close via the fall-through at the end of this function.
          }
        } else {
          await updateGuestBooking('utsav', guestForm);
          setGuestForm(INITIAL_GUEST_FORM);
          if (utsav.utsav_location !== 'Research Centre')
            router.push('/guestBooking/bookingReview');
          else router.push(`/guestBooking/${types.EVENT_DETAILS_TYPE}`);
          setIsSubmitting(false);
        }
      }
      if (selectedChip === CHIPS[2]) {
        if (!isMumukshuFormValid()) {
          CustomAlert.alert('Validation Error', 'Please fill all required fields');
          setIsSubmitting(false);
          return;
        }

        const updatedForm = {
          ...mumukshuForm,
          utsav,
        };

        await updateMumukshuBooking('utsav', updatedForm);
        router.push(`/mumukshuBooking/${types.EVENT_DETAILS_TYPE}`);
      }
      setSelectedChip('Self');
      toggleModal();
    } catch (error) {
      console.error('Booking error:', error);
      CustomAlert.alert('Error', 'Failed to process booking. Please try again.');
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
  const getAvailabilityInfo = (): AvailabilityInfo => {
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

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (isLoading) {
    return (
      <View className="flex-1 bg-white">
        <EventDetailHeader insetsTop={insets.top} onBack={goBack}>
          <View className="items-center">
            <Text className="font-psemibold text-lg text-gray-900">Loading...</Text>
          </View>
        </EventDetailHeader>
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
        <EventDetailHeader insetsTop={insets.top} onBack={goBack}>
          <View className="items-center">
            <Text className="font-psemibold text-lg text-gray-900">Error</Text>
          </View>
        </EventDetailHeader>
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
      <EventDetailHeader insetsTop={insets.top} onBack={goBack} onShare={handleShare}>
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
            {moment(utsav.utsav_start).format('MMM D')} - {moment(utsav.utsav_end).format('MMM D')}
          </Text>
        </Animated.View>
      </EventDetailHeader>

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
        {/* Header Content */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <EventHeroInfo
            name={utsav.utsav_name}
            location={utsav.utsav_location}
            icon="bonfire-outline"
            categoryLabel="Utsav"
          />

          {/* Divider */}
          <View className="mx-6 mb-6 h-[1px] bg-gray-200" />

          {/* Key Details Section */}
          <EventKeyDetails
            title="Utsav details"
            startDate={utsav.utsav_start}
            endDate={utsav.utsav_end}
            location={utsav.utsav_location}
            status={utsav.utsav_status}
            availableSeats={utsav.available_seats}
            availabilityInfo={availabilityInfo}
          />

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
          <EventThingsToKnow
            entityLabel="utsav"
            guidelinesLabel="Utsav guidelines"
            onSchedulePress={() => router.push('/utsav/dailySchedule')}
            onGuidelinesPress={() => router.push('/utsav/utsavGuidelines')}
            onContactPress={() => router.push('/contactInfo')}
          />
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
        transparent
        statusBarTranslucent
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
                    tintColor="black"
                    className="h-4 w-4"
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>

              <HorizontalSeparator otherStyles="w-full" />

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
                    containerStyles="mt-1"
                    chipContainerStyles="py-1"
                    textStyles="text-sm"
                  />
                </View>

                {/* Self Form */}
                {selectedChip === CHIPS[0] && (
                  <EventPackageSelector
                    packages={packages}
                    packageValue={selfForm.package}
                    onPackageChange={(val, packageName) =>
                      setSelfForm({
                        ...selfForm,
                        package: val,
                        package_name: packageName as string,
                      })
                    }
                    arrivalValue={selfForm.arrival}
                    onArrivalChange={(val) => setSelfForm({ ...selfForm, arrival: val })}
                    carno={selfForm.carno}
                    onCarnoChange={(e) => setSelfForm({ ...selfForm, carno: e })}
                    volunteerValue={selfForm.volunteer}
                    onVolunteerChange={(val) => setSelfForm({ ...selfForm, volunteer: val })}
                    otherValue={selfForm.other}
                    onOtherChange={(e) => setSelfForm({ ...selfForm, other: e })}
                  />
                )}

                {/* Guest Form */}
                {selectedChip === CHIPS[1] && (
                  <View>
                    <GuestForm
                      guestForm={guestForm}
                      setGuestForm={setGuestForm}
                      handleGuestFormChange={handleGuestFormChange}
                      addGuestForm={addGuestForm}
                      removeGuestForm={removeGuestForm}>
                      {(index: any) => (
                        <EventPackageSelector
                          packages={packages}
                          packageValue={guestForm.guests[index].package}
                          onPackageChange={(val, packageName) => {
                            handleGuestFormChange(index, 'package', val);
                            handleGuestFormChange(index, 'package_name', packageName);
                          }}
                          arrivalValue={guestForm.guests[index].arrival}
                          onArrivalChange={(val) => handleGuestFormChange(index, 'arrival', val)}
                          carno={guestForm.guests[index].carno}
                          onCarnoChange={(e) => handleGuestFormChange(index, 'carno', e)}
                          volunteerValue={guestForm.guests[index].volunteer}
                          onVolunteerChange={(val) =>
                            handleGuestFormChange(index, 'volunteer', val)
                          }
                          otherValue={guestForm.guests[index].other}
                          onOtherChange={(e) => handleGuestFormChange(index, 'other', e)}
                          otherInputStyles="font-pmedium text-bases"
                        />
                      )}
                    </GuestForm>
                  </View>
                )}

                {/* Mumukshu Form */}
                {selectedChip === CHIPS[2] && (
                  <OtherMumukshuForm
                    mumukshuForm={mumukshuForm}
                    setMumukshuForm={setMumukshuForm}
                    handleMumukshuFormChange={handleMumukshuFormChange}
                    addMumukshuForm={addMumukshuForm}
                    removeMumukshuForm={removeMumukshuForm}>
                    {(index: any) => (
                      <EventPackageSelector
                        packages={packages}
                        packageValue={mumukshuForm.mumukshus[index].package}
                        onPackageChange={(val, packageName) => {
                          handleMumukshuFormChange(index, 'package', val);
                          handleMumukshuFormChange(index, 'package_name', packageName);
                        }}
                        arrivalValue={mumukshuForm.mumukshus[index].arrival}
                        onArrivalChange={(val) => handleMumukshuFormChange(index, 'arrival', val)}
                        carno={mumukshuForm.mumukshus[index].carno}
                        onCarnoChange={(e) => handleMumukshuFormChange(index, 'carno', e)}
                        volunteerValue={mumukshuForm.mumukshus[index].volunteer}
                        onVolunteerChange={(val) =>
                          handleMumukshuFormChange(index, 'volunteer', val)
                        }
                        otherValue={mumukshuForm.mumukshus[index].other}
                        onOtherChange={(e) => handleMumukshuFormChange(index, 'other', e)}
                      />
                    )}
                  </OtherMumukshuForm>
                )}

                {/* Confirm Button Section */}
                <CustomButton
                  handlePress={handleBookingConfirm}
                  text="Confirm"
                  bgcolor="bg-secondary"
                  containerStyles="mt-4 p-2"
                  textStyles="text-sm text-white"
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

export default UtsavDetailScreen;
