import { SectionList, type SectionListRef } from '@legendapp/list/section-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, RefreshControl, ActivityIndicator } from 'react-native';

import BookingShell from './shared/BookingShell';
import CatalogueCard from './shared/CatalogueCard';
import PartySection from './shared/PartySection';
import StepTransition from './shared/StepTransition';
import { adhyayanCardProps } from './shared/catalogueCards';
import { isShibirFull, waitlistCountOf } from './shared/catalogueStatus';
import useBookingParty from './shared/useBookingParty';
import useBookingSubmit from './shared/useBookingSubmit';
import useResetOnLeave from './shared/useResetOnLeave';

import CustomEmptyMessage from '@/src/components/CustomEmptyMessage';
import { types } from '@/src/constants';
import { useTabBarPadding } from '@/src/hooks/useTabBarPadding';
import { useAuthStore } from '@/src/stores';
import handleAPICall from '@/src/utils/HandleApiCall';
import { formatSectionMonth } from '@/src/utils/formatSectionMonth';

/**
 * Raj Adhyayan. Pick a shibir, then say who is attending.
 *
 * The party step used to live in a 300px-wide centred dialog with the guest
 * forms crammed inside it. It is now a second step in the shared shell, so it
 * gets a full screen, a real back gesture and the same footer action as every
 * other booking type.
 *
 * A shibir held away from the Research Centre needs no room or food, so it skips
 * the add-on step. That is a genuine difference in the booking, not in the UI.
 */

const AdhyayanBooking = () => {
  const router = useRouter();
  const user = useAuthStore((s: any) => s.user);

  const [selected, setSelected] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const tabBarPadding = useTabBarPadding();

  // Going back to step 1 remounts the list (StepTransition's whole trick), so
  // the scroll position has to be captured on tap and restored by hand.
  const listRef = useRef<SectionListRef>(null);
  const savedPositionRef = useRef<{ sectionIndex: number; itemIndex: number } | null>(null);

  const party = useBookingParty();
  const { submit, isSubmitting } = useBookingSubmit();

  useResetOnLeave(() => {
    setSelected(null);
    party.reset();
  });

  const fetchAdhyayans = async ({ pageParam = 1 }: any) =>
    new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/adhyayan/getall',
        { cardno: user.cardno, page: pageParam },
        null,
        (res: any) => resolve(Array.isArray(res.data) ? res.data : []),
        undefined,
        () => reject(new Error('Failed to fetch adhyayans'))
      );
    });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch }: any =
    useInfiniteQuery({
      queryKey: ['adhyayans', user?.cardno],
      queryFn: fetchAdhyayans,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 5,
      initialPageParam: 1,
      getNextPageParam: (lastPage: any, pages: any) =>
        !lastPage || !Array.isArray(lastPage) || lastPage.length === 0
          ? undefined
          : (pages?.length || 0) + 1,
      enabled: !!user?.cardno,
    });

  // The API returns pre-grouped sections; consecutive pages can repeat a title.
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

  const isFull = isShibirFull;

  const handleConfirm = () =>
    submit({
      bookingType: types.ADHYAYAN_DETAILS_TYPE,
      audience: party.audience,
      form: party.form,
      buildPayload: (f) =>
        party.audience === 'guest'
          ? {
              adhyayan: selected,
              guestGroup: f.guests.map((g: any) => ({
                cardno: g.cardno,
                issuedto: g.issuedto || g.name,
              })),
            }
          : {
              adhyayan: selected,
              mumukshuGroup:
                party.audience === 'mumukshu'
                  ? f.mumukshus
                  : [
                      {
                        cardno: user.cardno,
                        mobno: user.mobno,
                        issuedto: user.name,
                        gender: user.gender,
                        res_status: user.res_status,
                      },
                    ],
            },
      // An off-site shibir has no room or food to add, so it goes straight to
      // review. The stack still matches the audience.
      onDone:
        selected?.location !== 'Research Centre'
          ? () => {
              const stack =
                party.audience === 'guest'
                  ? 'guestBooking'
                  : party.audience === 'mumukshu'
                    ? 'mumukshuBooking'
                    : 'booking';
              router.push(`/${stack}/bookingReview`);
            }
          : undefined,
    });

  const renderSectionHeader = useCallback(
    ({ section }: any) => (
      <Text className="mb-2 mt-4 px-1 font-psemibold text-base text-gray-800">
        {formatSectionMonth(section?.title, section?.data?.[0]?.start_date)}
      </Text>
    ),
    []
  );

  const handleSelectItem = useCallback(
    (item: any, section: any) => {
      const sectionIndex = sections.indexOf(section);
      const itemIndex = section?.data?.indexOf(item) ?? 0;
      if (sectionIndex !== -1) {
        savedPositionRef.current = { sectionIndex, itemIndex };
      }
      setSelected(item);
    },
    [sections]
  );

  const renderItem = useCallback(
    ({ item, section }: any) => (
      <CatalogueCard {...adhyayanCardProps(item)} onPress={() => handleSelectItem(item, section)} />
    ),
    [handleSelectItem]
  );

  // Restore the position the member was at when they tapped a shibir, since
  // coming back to this step remounts the list from scratch.
  useEffect(() => {
    if (selected) return;
    const saved = savedPositionRef.current;
    if (!saved) return;
    savedPositionRef.current = null;
    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToLocation({ ...saved, animated: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [selected]);

  // Step 2: who is attending.
  if (selected) {
    return (
      <StepTransition stepKey="party" direction="forward">
        <BookingShell
          embedded
          title={types.booking_type_adhyayan}
          caption={selected?.name}
          progress={{ current: 2, total: 2 }}
          onBack={() => setSelected(null)}
          primaryLabel={isFull(selected) ? 'Join waitlist' : 'Continue'}
          onPrimary={handleConfirm}
          primaryDisabled={!party.isPartyValid}
          primaryLoading={isSubmitting}
          footerNote={
            isFull(selected)
              ? 'This shibir is full. You can still book, and you will be confirmed if a seat frees up.'
              : !party.isPartyValid
                ? party.audience === 'guest'
                  ? 'Fill in each guest’s details to continue.'
                  : 'Fill in each mumukshu’s details to continue.'
                : undefined
          }>
          <View className="px-4">
            <CatalogueCard {...adhyayanCardProps(selected)} className="mb-5" />

            <PartySection
              audiences={party.audiences}
              audience={party.audience}
              onAudienceChange={party.setAudience}
              guestFormProps={party.guestFormProps}
              mumukshuFormProps={party.mumukshuFormProps}
            />
          </View>
        </BookingShell>
      </StepTransition>
    );
  }

  // Step 1: choose a shibir.
  return (
    <StepTransition stepKey="list" direction="back">
      <BookingShell
        embedded
        title={types.booking_type_adhyayan}
        caption="Choose a shibir"
        progress={sections.length > 0 || isLoading ? { current: 1, total: 2 } : undefined}
        scrollBody={false}>
        <SectionList
          ref={listRef}
          sections={sections}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: tabBarPadding + 24 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          keyExtractor={(item: any) => item?.id?.toString()}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderItem}
          ListEmptyComponent={
            <View className="items-center justify-center pt-24">
              {isError ? (
                <CustomEmptyMessage message="Could not load Adhyayans. Pull down to try again." />
              ) : isLoading ? (
                <ActivityIndicator />
              ) : (
                <CustomEmptyMessage message="No upcoming Adhyayans at this moment!" />
              )}
            </View>
          }
          ListFooterComponent={
            <View className="items-center py-4">
              {isFetchingNextPage ? <ActivityIndicator /> : null}
              {!hasNextPage && sections.length > 0 ? (
                <Text className="font-pregular text-xs text-gray-400">
                  No more adhyayans at the moment
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
    </StepTransition>
  );
};

export default AdhyayanBooking;
