import { useInfiniteQuery } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import moment from 'moment';
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, SectionList, RefreshControl, ActivityIndicator } from 'react-native';

import BookingShell from './shared/BookingShell';
import CatalogueCard from './shared/CatalogueCard';
import { isUtsavFull } from './shared/catalogueStatus';
import FieldGroup from './shared/FieldGroup';
import PartySection from './shared/PartySection';
import useBookingParty from './shared/useBookingParty';
import useBookingSubmit from './shared/useBookingSubmit';

import CustomEmptyMessage from '@/src/components/CustomEmptyMessage';
import { useTabBarPadding } from '@/src/hooks/useTabBarPadding';
import CustomSelectBottomSheet from '@/src/components/CustomSelectBottomSheet';
import FormField from '@/src/components/FormField';
import { status, types } from '@/src/constants';
import { useAuthStore } from '@/src/stores';
import handleAPICall from '@/src/utils/HandleApiCall';

/**
 * Raj Utsav. Pick an utsav, then say who is attending and how.
 *
 * Each attendee chooses a package, whether they arrive by car, and a seva they
 * can help with. Those questions are the same for the member, a guest and a
 * mumukshu, so they are written once.
 */

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

const ATTENDEE_DEFAULTS = {
  package: null,
  package_name: '',
  arrival: null,
  carno: '',
  volunteer: null,
  other: null,
};

/** A car number is only needed, and only valid, when arriving by car. */
const attendeeValid = (row: any) =>
  Boolean(row.package) &&
  Boolean(row.arrival) &&
  !(row.arrival === ARRIVAL[0].key && (!row.carno || row.carno.length !== 10));

const EventsBooking = () => {
  const router = useRouter();
  const user = useAuthStore((s: any) => s.user);

  const [selected, setSelected] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const tabBarPadding = useTabBarPadding();

  const party = useBookingParty({
    guestTemplate: { name: '', gender: '', mobno: '', type: '', ...ATTENDEE_DEFAULTS },
    mumukshuTemplate: { cardno: '', mobno: '', ...ATTENDEE_DEFAULTS },
    shared: { ...ATTENDEE_DEFAULTS },
    validateGuestRow: attendeeValid,
    validateMumukshuRow: attendeeValid,
  });

  const { submit, isSubmitting } = useBookingSubmit();

  useFocusEffect(
    useCallback(() => {
      setSelected(null);
      party.reset();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const fetchUtsavs = async ({ pageParam = 1 }: any) => {
    if (!user?.cardno) return [];
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/utsav/upcoming',
        { cardno: user.cardno, page: pageParam },
        null,
        (res: any) => resolve(Array.isArray(res.data) ? res.data : []),
        undefined,
        () => reject(new Error('Failed to fetch utsavs'))
      );
    });
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch }: any =
    useInfiniteQuery({
      queryKey: ['utsavs', user?.cardno],
      queryFn: fetchUtsavs,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 5,
      initialPageParam: 1,
      getNextPageParam: (lastPage: any, pages: any) =>
        !lastPage || !Array.isArray(lastPage) || lastPage.length === 0
          ? undefined
          : (pages?.length || 0) + 1,
      enabled: !!user?.cardno,
    });

  const sections = useMemo(() => {
    const flattened = data?.pages?.flatMap((page: any) => page) || [];
    return flattened.reduce((acc: any[], section: any) => {
      if (acc.length === 0) return [section];
      const last = acc[acc.length - 1];
      if (last.title === section.title) {
        acc[acc.length - 1] = { ...last, data: [...last.data, ...section.data] };
        return acc;
      }
      return [...acc, section];
    }, []);
  }, [data?.pages]);

  const packages = useMemo(
    () =>
      (selected?.packages || []).map((p: any) => ({
        key: p.package_id,
        value: `${p.package_name} · ₹${p.package_amount}`,
      })),
    [selected]
  );

  const isFull = isUtsavFull;
  const { form, audience } = party;

  const selfValid = audience === 'self' ? attendeeValid(form) : true;
  const canContinue = party.isPartyValid && selfValid;

  /** Package, arrival and seva. Reused for the member, guests and mumukshus. */
  const attendeeFields = (row: any, patch: (field: string, value: any) => void, title?: string) => (
    <View className="mt-4">
      <FieldGroup title={title}>
        <CustomSelectBottomSheet
          variant="row"
          label="Package"
          placeholder="Choose"
          options={packages}
          selectedValue={row.package}
          onValueChange={(v: any) => {
            patch('package', v);
            patch('package_name', packages.find((p: any) => p.key === v)?.value ?? '');
          }}
        />
        <CustomSelectBottomSheet
          variant="row"
          label="Arriving by car?"
          placeholder="Choose"
          options={ARRIVAL}
          selectedValue={row.arrival}
          onValueChange={(v: any) => {
            patch('arrival', v);
            if (v !== ARRIVAL[0].key) patch('carno', '');
          }}
        />
        <CustomSelectBottomSheet
          variant="row"
          label="Seva preference"
          placeholder="Choose"
          options={VOLUNTEER}
          selectedValue={row.volunteer}
          onValueChange={(v: any) => patch('volunteer', v)}
        />
      </FieldGroup>

      {row.arrival === ARRIVAL[0].key ? (
        <View className="mt-4">
          <FormField
            text="Car number *"
            value={row.carno}
            handleChangeText={(v: string) => patch('carno', v)}
            placeholder="e.g. MH01AB1234"
            maxLength={10}
            autoCapitalize="characters"
          />
        </View>
      ) : null}
    </View>
  );

  const handleConfirm = () =>
    submit({
      bookingType: types.EVENT_DETAILS_TYPE,
      audience,
      form,
      buildPayload: (f) =>
        audience === 'guest'
          ? { ...f, utsav: selected }
          : {
              utsav: selected,
              mumukshus:
                audience === 'mumukshu'
                  ? f.mumukshus
                  : [
                      {
                        cardno: user.cardno,
                        mobno: user.mobno,
                        issuedto: user.name,
                        gender: user.gender,
                        res_status: user.res_status,
                        package: f.package,
                        package_name: f.package_name,
                        arrival: f.arrival,
                        carno: f.carno,
                        volunteer: f.volunteer,
                        other: f.other,
                      },
                    ],
            },
      // An off-site utsav has no room or food to add on.
      onDone:
        selected?.utsav_location !== 'Research Centre'
          ? () => {
              const stack =
                audience === 'guest'
                  ? 'guestBooking'
                  : audience === 'mumukshu'
                    ? 'mumukshuBooking'
                    : 'booking';
              router.push(`/${stack}/bookingReview`);
            }
          : undefined,
    });

  // Step 2: who is attending, and how.
  if (selected) {
    return (
      <BookingShell
        embedded
        title={types.booking_type_event}
        caption={selected.utsav_name}
        progress={{ current: 2, total: 2 }}
        onBack={() => setSelected(null)}
        primaryLabel={isFull(selected) ? 'Join waitlist' : 'Continue'}
        onPrimary={handleConfirm}
        primaryDisabled={!canContinue}
        primaryLoading={isSubmitting}
        footerNote={
          isFull(selected)
            ? 'This utsav is full. You can still book, and you will be confirmed if a place frees up.'
            : !canContinue
              ? 'Choose a package and arrival for everyone attending.'
              : undefined
        }>
        <View className="px-4">
          <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
            <Text className="font-psemibold text-base text-gray-900">{selected.utsav_name}</Text>
            <Text className="mt-1 font-pregular text-xs text-gray-500">
              {moment(selected.utsav_start).isSame(moment(selected.utsav_end), 'day')
                ? moment(selected.utsav_start).format('D MMM YYYY')
                : `${moment(selected.utsav_start).format('D MMM')} – ${moment(
                    selected.utsav_end
                  ).format('D MMM YYYY')}`}
              {selected.utsav_location ? ` · ${selected.utsav_location}` : ''}
            </Text>
          </View>

          <PartySection
            audiences={party.audiences}
            audience={audience}
            onAudienceChange={party.setAudience}
            guestFormProps={party.guestFormProps}
            mumukshuFormProps={party.mumukshuFormProps}
            renderGuestExtras={(i) =>
              attendeeFields(form.guests[i] ?? {}, (field, v) =>
                party.guestFormProps.handleGuestFormChange(i, field, v)
              )
            }
            renderMumukshuExtras={(i) =>
              attendeeFields(form.mumukshus[i] ?? {}, (field, v) =>
                party.mumukshuFormProps.handleMumukshuFormChange(i, field, v)
              )
            }
          />

          {audience === 'self'
            ? attendeeFields(form, (field, v) => party.setSharedField(field, v), 'Your details')
            : null}
        </View>
      </BookingShell>
    );
  }

  // Step 1: choose an utsav.
  return (
    <BookingShell
      embedded
      title={types.booking_type_event}
      caption="Choose an utsav"
      progress={sections.length > 0 || isLoading ? { current: 1, total: 2 } : undefined}
      scrollBody={false}>
      <SectionList
        sections={sections}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: tabBarPadding + 24 }}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        keyExtractor={(item: any, index) => item?.utsav_id?.toString() || index.toString()}
        renderSectionHeader={({ section: { title } }: any) => (
          <Text className="mb-2 mt-4 px-1 font-psemibold text-base text-gray-800">{title}</Text>
        )}
        renderItem={({ item }: any) => (
          <CatalogueCard
            title={item.utsav_name}
            startDate={item.utsav_start}
            endDate={item.utsav_end}
            isWaitlist={isFull(item)}
            meta={[
              {
                icon: 'location-outline',
                label: 'Location',
                value: item.utsav_location || 'Not available',
              },
              {
                icon: 'pricetags-outline',
                label: 'Packages',
                value: `${item.packages?.length ?? 0} available`,
              },
            ]}
            onPress={() => setSelected(item)}
          />
        )}
        ListEmptyComponent={
          <View className="items-center justify-center pt-24">
            {isError ? (
              <CustomEmptyMessage message="Could not load Utsavs. Pull down to try again." />
            ) : isLoading ? (
              <ActivityIndicator />
            ) : (
              <CustomEmptyMessage message="No upcoming Utsavs at this moment!" />
            )}
          </View>
        }
        ListFooterComponent={
          <View className="items-center py-4">
            {isFetchingNextPage ? <ActivityIndicator /> : null}
            {!hasNextPage && sections.length > 0 ? (
              <Text className="font-pregular text-xs text-gray-400">
                No more utsavs at the moment
              </Text>
            ) : null}
          </View>
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage && !isError) fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={async () => {
              setIsRefreshing(true);
              await refetch();
              setIsRefreshing(false);
            }}
          />
        }
      />
    </BookingShell>
  );
};

export default EventsBooking;
