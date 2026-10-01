import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';

import AddonItem from '../AddonItem';
import CustomEmptyMessage from '../CustomEmptyMessage';
import CustomSelectBottomSheet from '../CustomSelectBottomSheet';
import AddonHeader from '../booking/shared/AddonHeader';
import CatalogueCard from '../booking/shared/CatalogueCard';
import { isShibirFull, waitlistCountOf } from '../booking/shared/catalogueStatus';

import { icons } from '@/src/constants';
import { useAuthStore, useBookingStore } from '@/src/stores';
import handleAPICall from '@/src/utils/HandleApiCall';

interface GuestAdhyayanAddonProps {
  adhyayanForm: any;
  setAdhyayanForm: any;
  updateAdhyayanForm: any;
  INITIAL_ADHYAYAN_FORM: any;
  guest_dropdown: any;
}

const GuestAdhyayanAddon: React.FC<GuestAdhyayanAddonProps> = ({
  adhyayanForm,
  setAdhyayanForm,
  updateAdhyayanForm,
  INITIAL_ADHYAYAN_FORM,
  guest_dropdown,
}) => {
  const user = useAuthStore((store) => store.user);
  const guestData = useBookingStore((store) => store.guestData);
  const setGuestData = useBookingStore((store) => store.setGuestData);

  const fetchAdhyayans = async () => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/adhyayan/getrange',
        {
          cardno: user.cardno,
          start_date: guestData.room?.startDay || guestData.flat?.startDay,
          end_date: guestData.room?.endDay || guestData.flat?.endDay,
        },
        null,
        (res: any) => {
          resolve(Array.isArray(res.data) ? res.data : []);
        },
        () => reject(new Error('Failed to fetch rooms'))
      );
    });
  };

  const {
    isLoading,
    isError,
    error,
    data: adhyayanList,
  }: any = useQuery({
    queryKey: ['adhyayans', guestData.room?.startDay && guestData.room?.endDay],
    queryFn: fetchAdhyayans,
    staleTime: 1000 * 60 * 30,
  });

  // The same card the main Adhyayan screen uses, so a shibir reads identically
  // in both places — including whether it is full.
  const renderItem = useCallback(
    ({ item }: any) => {
      const isSelected = adhyayanForm.adhyayan?.id == item.id;

      return (
        <CatalogueCard
          title={item.name}
          startDate={item.start_date}
          endDate={item.end_date}
          isWaitlist={isShibirFull(item)}
          waitlistCount={waitlistCountOf(item)}
          selectable
          selected={isSelected}
          meta={[
            { icon: 'person-outline', label: 'Swadhyay Karta', value: item.speaker },
            ...(item.location
              ? [{ icon: 'location-outline' as const, label: 'Location', value: item.location }]
              : []),
            { icon: 'card-outline', label: 'Charges', value: `₹${item.amount}` },
          ]}
          onPress={() => {
            if (isSelected) {
              setAdhyayanForm((prev: any) => ({ ...prev, adhyayan: null }));
              setGuestData((prev: any) => {
                const { adhyayan, ...rest } = prev;
                return rest;
              });
            } else {
              setAdhyayanForm((prev: any) => ({ ...prev, adhyayan: item }));
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        />
      );
    },
    [adhyayanForm.adhyayan?.id, setAdhyayanForm, setGuestData]
  );

  const renderFooter = useCallback(
    () => (
      <View className="w-full items-center justify-center">
        {isLoading && <ActivityIndicator />}
        {isError && <Text>Error fetching data: {error.message}</Text>}
      </View>
    ),
    [isLoading, isError, error]
  );

  return (
    <AddonItem
      onCollapse={() => {
        setAdhyayanForm(INITIAL_ADHYAYAN_FORM);
        setGuestData((prev: any) => {
          const { adhyayan, ...rest } = prev;
          return rest;
        });
      }}
      visibleContent={
        <AddonHeader icon={icons.adhyayan} title="Raj Adhyayan" subtitle="Join a shibir" />
      }
      containerStyles="mt-3">
      {(adhyayanList?.length > 0 || isError) && (
        <View className="w-full flex-col items-center justify-center">
          <CustomSelectBottomSheet
            className="mt-5"
            label="Select Guests"
            placeholder="Select Guests"
            options={guest_dropdown}
            selectedValues={adhyayanForm.guestIndices}
            onValuesChange={(val) => updateAdhyayanForm('guestIndices', val)}
            multiSelect
            confirmButtonText="Select"
          />
        </View>
      )}
      <FlatList
        className="flex-grow-1 mt-2 w-full py-2"
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        data={adhyayanList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View className="mt-6 flex-1">
            <CustomEmptyMessage message="No Adhyayans available on selected dates!" />
          </View>
        }
        scrollEnabled={false}
      />
    </AddonItem>
  );
};

export default GuestAdhyayanAddon;
