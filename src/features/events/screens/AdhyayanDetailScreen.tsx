// src/features/events/screens/AdhyayanDetailScreen.tsx
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

import { createGuests, useAdhyayanDetail } from '../api';
import EventDetailHeader from '../components/EventDetailHeader';
import EventHeroInfo from '../components/EventHeroInfo';
import EventKeyDetails from '../components/EventKeyDetails';
import type { AvailabilityInfo } from '../components/EventKeyDetails';
import EventThingsToKnow from '../components/EventThingsToKnow';
import type { Adhyayan } from '../types';

import CustomAlert from '@/components/CustomAlert';
import CustomButton from '@/components/CustomButton';
import CustomChipGroup from '@/components/CustomChipGroup';
import GuestForm from '@/components/GuestForm';
import HorizontalSeparator from '@/components/HorizontalSeparator';
import OtherMumukshuForm from '@/components/OtherMumukshuForm';
import { icons, status, types } from '@/constants';
import { useAuthStore, useBookingStore } from '@/stores';

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

// Transform self adhyayan booking to mumukshu format
const transformSelfAdhyayanToMumukshu = (user: any, adhyayan: any) => {
  const selfMumukshu = {
    cardno: user.cardno,
    mobno: user.mobno,
    issuedto: user.name,
    gender: user.gender,
    res_status: user.res_status,
  };

  return {
    adhyayan,
    mumukshuGroup: [selfMumukshu],
  };
};

const AdhyayanDetailScreen = () => {
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
  const [guestForm, setGuestForm] = useState(INITIAL_GUEST_FORM);
  const [mumukshuForm, setMumukshuForm] = useState(INITIAL_MUMUKSHU_FORM);

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
    data: adhyayan,
    isLoading,
    isError,
    refetch,
  } = useAdhyayanDetail(id, user?.cardno) as {
    data: Adhyayan | undefined;
    isLoading: boolean;
    isError: boolean;
    refetch: () => Promise<unknown>;
  };

  // Share functionality
  const handleShare = async () => {
    if (!adhyayan) return;

    try {
      const shareContent = {
        title: adhyayan.name,
        message: `Join us for ${adhyayan.name} from ${moment(adhyayan.start_date).format(
          'MMM D'
        )} to ${moment(adhyayan.end_date).format('MMM D, YYYY')} at ${adhyayan.location}.\n\nhttps://aashray.vitraagvigyaan.org/adhyayan/${adhyayan.id}`,
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
      if (guest.cardno) return guest.mobno && guest.mobno?.length === 10;
      else
        return (
          guest.name && guest.gender && guest.type && guest.mobno && guest.mobno?.length === 10
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
      return mumukshu.mobno && mumukshu.mobno?.length === 10 && mumukshu.cardno;
    });
  };

  // Set adhyayan in forms when data is loaded
  useEffect(() => {
    if (adhyayan) {
      setGuestForm((prev: any) => ({
        ...prev,
        adhyayan,
      }));
      setMumukshuForm((prev: any) => ({
        ...prev,
        adhyayan,
      }));
    }
  }, [adhyayan]);

  const handleBookingConfirm = async () => {
    if (!adhyayan) return;

    setIsSubmitting(true);
    try {
      if (selectedChip === CHIPS[0]) {
        // Transform self booking to mumukshu format
        const mumukshuFormatData = transformSelfAdhyayanToMumukshu(user, adhyayan);
        await updateMumukshuBooking('adhyayan', mumukshuFormatData);
        if (adhyayan.location !== 'Research Centre') router.push('/booking/bookingReview');
        else router.push(`/booking/${types.ADHYAYAN_DETAILS_TYPE}`);
      }
      if (selectedChip === CHIPS[1]) {
        if (!isGuestFormValid()) {
          CustomAlert.alert('Fill all Fields');
          setIsSubmitting(false);
          return;
        }

        setGuestForm((prev: any) => ({
          ...prev,
          adhyayan,
        }));

        if (guestForm.guests.filter((guest: any) => !guest.cardno).length > 0) {
          try {
            const createdGuests = await createGuests(user.cardno, guestForm.guests);
            const transformedData = transformData({
              ...guestForm,
              guests: createdGuests,
              adhyayan,
            });

            await updateGuestBooking('adhyayan', transformedData);
            setGuestForm(INITIAL_GUEST_FORM);

            if (adhyayan.location !== 'Research Centre') router.push('/guestBooking/bookingReview');
            else router.push(`/guestBooking/${types.ADHYAYAN_DETAILS_TYPE}`);
          } catch {
            // Match legacy handleAPICall behavior: the create-guest error
            // callback was a no-op (apiClient already surfaces the toast),
            // so swallow here and let isSubmitting reset in `finally` below.
          }
        } else {
          const transformedData = transformData({
            ...guestForm,
            adhyayan,
          });

          await updateGuestBooking('adhyayan', transformedData);
          setGuestForm(INITIAL_GUEST_FORM);
          if (adhyayan.location !== 'Research Centre') router.push('/guestBooking/bookingReview');
          else router.push(`/guestBooking/${types.ADHYAYAN_DETAILS_TYPE}`);
          setIsSubmitting(false);
        }
      }
      if (selectedChip === CHIPS[2]) {
        if (!isMumukshuFormValid()) {
          CustomAlert.alert('Fill all Fields');
          setIsSubmitting(false);
          return;
        }

        const temp = transformMumukshuData({
          ...mumukshuForm,
          adhyayan,
        });

        await updateMumukshuBooking('adhyayan', temp);
        if (adhyayan.location !== 'Research Centre') router.push('/mumukshuBooking/bookingReview');
        else router.push(`/mumukshuBooking/${types.ADHYAYAN_DETAILS_TYPE}`);
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
    if (adhyayan?.status === status.STATUS_CLOSED || adhyayan?.available_seats === 0) {
      return {
        text: 'Waitlist only',
        shortText: 'Waitlist',
        color: '#DC2626',
        isWaitlist: true,
      };
    }
    if (adhyayan?.available_seats && adhyayan.available_seats <= 10) {
      return {
        text: `Only ${adhyayan.available_seats} spots left`,
        shortText: `${adhyayan.available_seats} left`,
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

  if (isError || !adhyayan) {
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
            We couldn't load this adhyayan. Please try again.
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
            {adhyayan.name}
          </Text>
          <Text className="font-pregular text-sm text-gray-500" numberOfLines={1}>
            {moment(adhyayan.start_date).format('MMM D')} -{' '}
            {moment(adhyayan.end_date).format('MMM D')}
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
            name={adhyayan.name}
            location={adhyayan.location}
            speaker={adhyayan.speaker}
          />

          {/* Divider */}
          <View className="mx-6 mb-6 h-[1px] bg-gray-200" />

          {/* Key Details Section */}
          <EventKeyDetails
            title="Adhyayan details"
            startDate={adhyayan.start_date}
            endDate={adhyayan.end_date}
            location={adhyayan.location}
            status={adhyayan.status}
            availableSeats={adhyayan.available_seats}
            foodAllowed={adhyayan.food_allowed}
            availabilityInfo={availabilityInfo}
          />

          {/* Comments Section if available */}
          {adhyayan.comments && adhyayan.comments.trim() !== '' && (
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
                      {adhyayan.comments}
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
            <Text className="mb-4 font-psemibold text-xl text-gray-900">Registration details</Text>
            <View className="rounded-xl border border-gray-200 p-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-pbold text-2xl text-gray-900">₹{adhyayan.amount}</Text>
                  <Text className="mt-1 font-pregular text-sm text-gray-600">per person</Text>
                </View>
                <View className="rounded-lg bg-gray-100 px-3 py-2">
                  <Text className="font-pmedium text-xs text-gray-700">Registration fee</Text>
                </View>
              </View>
              <View className="mt-4 gap-2">
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text className="ml-2 font-pregular text-sm text-gray-600">
                    All sessions included
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text className="ml-2 font-pregular text-sm text-gray-600">
                    Study materials provided
                  </Text>
                </View>
                {adhyayan.food_allowed && (
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    <Text className="ml-2 font-pregular text-sm text-gray-600">
                      Food arrangements available
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Divider */}
          <View className="mx-6 mb-6 h-[1px] bg-gray-200" />

          {/* Things to Know */}
          <EventThingsToKnow onContactPress={() => router.push('/contactInfo')} />
        </Animated.View>
      </Animated.ScrollView>

      {/* Sticky Bottom Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white"
        style={{ paddingBottom: insets.bottom }}>
        <View className="flex-row items-center justify-between px-6 py-3">
          <View>
            <View className="flex-row items-baseline">
              <Text className="font-pbold text-lg text-gray-900">₹{adhyayan.amount}</Text>
              <Text className="ml-1 font-pregular text-sm text-gray-600">per person</Text>
            </View>
            <TouchableOpacity>
              <Text className="font-pregular text-sm text-gray-900 underline">
                {moment(adhyayan.start_date).format('MMM D')} -{' '}
                {moment(adhyayan.end_date).format('D')}
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
                    {adhyayan?.name}
                  </Text>
                  <View className="flex-row gap-x-1">
                    <Text className="font-pregular text-xs text-gray-500">Date:</Text>
                    <Text className="font-pregular text-xs text-secondary">
                      {moment(adhyayan?.start_date).format('Do MMMM')} -{' '}
                      {moment(adhyayan?.end_date).format('Do MMMM')}
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
                  handlePress={handleBookingConfirm}
                  text="Confirm"
                  bgcolor="bg-secondary"
                  containerStyles="mt-4 p-2"
                  textStyles="text-sm text-white"
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
    </View>
  );
};

// Helper functions
function transformData(inputData: any) {
  const { adhyayan, guests } = inputData;

  return {
    adhyayan,
    guestGroup: guests.map((guest: any) => ({
      cardno: guest.cardno,
      issuedto: guest.issuedto || guest.name,
    })),
  };
}

function transformMumukshuData(inputData: any) {
  const { adhyayan, mumukshus } = inputData;

  return {
    adhyayan,
    mumukshuGroup: mumukshus.map((mumukshu: any) => mumukshu),
  };
}

export default AdhyayanDetailScreen;
