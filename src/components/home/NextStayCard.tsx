import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import moment from 'moment';
import React from 'react';
import { View, Text, Pressable } from 'react-native';

import VerdictPill from '@/src/components/stay/VerdictPill';
import type { Verdict } from '@/src/components/stay/stayOutcome.types';
import { colors, status, surfaces } from '@/src/constants';
import { useAuthStore } from '@/src/stores';
import handleAPICall from '@/src/utils/HandleApiCall';

/**
 * The member's next stay. The one thing the home screen leads with.
 *
 * Home made no network calls at all, so a booking app opened on a screen that
 * said nothing about your booking. The dates are set as the largest text on the
 * screen because "when am I going" is the question being answered; everything
 * else on the card supports that one line.
 */

interface StayBooking {
  bookingid: string;
  checkin: string;
  checkout: string;
  roomno?: string;
  roomtype?: string;
  status?: string;
}

const ROOM_LABEL: Record<string, string> = { ac: 'AC room', nac: 'Non-AC room', NA: 'Day visit' };

const fetchStays = (cardno: string): Promise<StayBooking[]> =>
  new Promise((resolve, reject) => {
    handleAPICall(
      'GET',
      '/stay/bookings',
      { cardno, page: 1 },
      null,
      (res: any) => resolve(Array.isArray(res) ? res : (res?.data ?? [])),
      () => {},
      () => reject(new Error('Failed to fetch stays')),
      false
    );
  });

/** Key and fetcher together, so the launch prefetch in `app/_layout.tsx` cannot
 * warm a key this card does not read. */
export const nextStayQuery = (cardno: string) => ({
  queryKey: ['nextStay', cardno],
  queryFn: () => fetchStays(cardno),
});

const verdictOf = (booking: StayBooking): Verdict =>
  booking.status === status.STATUS_WAITING ? 'waitlist' : 'confirmed';

const dateRange = (start: string, end: string) =>
  moment(start).isSame(moment(end), 'day')
    ? moment(start).format('D MMM')
    : `${moment(start).format('D MMM')} – ${moment(end).format('D MMM')}`;

/** Countdown in plain words. A date alone makes the member do the arithmetic. */
const whenLabel = (checkin: string, checkout: string) => {
  const today = moment().startOf('day');
  const days = moment(checkin).startOf('day').diff(today, 'days');
  // Already checked in and not yet departed. The checkout day itself counts —
  // the member is still here that morning. Requiring checkout to be strictly
  // after today sent a stay ending today to the last line, which read
  // "Checking in in -3 days".
  if (days < 0 && moment(checkout).startOf('day').isSameOrAfter(today)) return 'Staying now';
  if (days === 0) return 'Checking in today';
  if (days === 1) return 'Checking in tomorrow';
  return `Checking in in ${days} days`;
};

const NextStayCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const router = useRouter();
  const user = useAuthStore((state: any) => state.user);
  const cardno = user?.cardno;

  const { data, isPending } = useQuery({
    ...nextStayQuery(cardno),
    enabled: Boolean(cardno),
  });

  const next = React.useMemo(() => {
    const today = moment().startOf('day');
    return (data ?? [])
      .filter(
        (b) =>
          b?.checkout &&
          moment(b.checkout).isSameOrAfter(today) &&
          b.status !== status.STATUS_CANCELLED &&
          b.status !== status.STATUS_ADMIN_CANCELLED
      )
      .sort((a, b) => moment(a.checkin).valueOf() - moment(b.checkin).valueOf())[0];
  }, [data]);

  // `isPending` rather than `isLoading`. While the query is disabled — the auth
  // store hydrates from storage a beat after mount, so there is no cardno yet —
  // `isLoading` is false and `data` is undefined, which rendered the empty
  // state first and only then a spinner: loading after it had apparently
  // loaded. `isPending` is true from the first frame until data arrives.
  //
  // The placeholder mirrors the resolved row so the card does not change height
  // underneath the sections below it.
  if (isPending) {
    return (
      <View className={`${surfaces.CARD} flex-row items-center gap-x-3 px-4 py-3.5 ${className}`}>
        <View className="h-11 w-11 shrink-0 rounded-full bg-gray-100" />
        <View className="flex-1 gap-y-2">
          <View className="h-3.5 w-32 rounded-full bg-gray-100" />
          <View className="h-3 w-48 rounded-full bg-gray-100" />
        </View>
      </View>
    );
  }

  // Having nothing booked is one short fact. Given a full card it became the
  // tallest thing on the screen, so the emptiest state looked like the most
  // important one. It gets a single row and an action.
  if (!next) {
    return (
      <Pressable
        onPress={() => router.push('/book-now?type=room')}
        android_ripple={{ color: colors.gray_200 }}
        className={`${surfaces.CARD} flex-row items-center gap-x-3 px-4 py-3.5 ${className}`}>
        <View className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary-50">
          <Ionicons name="bed-outline" size={22} color={colors.secondary_200} />
        </View>
        <View className="flex-1">
          <Text className="font-psemibold text-sm text-gray-900">No upcoming stay</Text>
          <Text className="mt-0.5 font-pregular text-xs text-gray-500">
            A few days here can change the year
          </Text>
        </View>
        <View className="min-h-[36px] items-center justify-center rounded-lg bg-secondary px-4">
          <Text className="font-psemibold text-xs text-white">Book</Text>
        </View>
      </Pressable>
    );
  }

  const nights = Math.max(
    0,
    moment(next.checkout).startOf('day').diff(moment(next.checkin).startOf('day'), 'days')
  );
  const room = next.roomtype ? ROOM_LABEL[next.roomtype] || next.roomtype : null;

  return (
    <Pressable
      onPress={() => router.push('/bookings')}
      android_ripple={{ color: colors.gray_200 }}
      className={`${surfaces.CARD} overflow-hidden ${className}`}>
      <View className="px-5 pb-4 pt-5">
        <View className="flex-row items-center justify-between gap-x-3">
          <Text className="font-pregular text-xs text-gray-500">
            {whenLabel(next.checkin, next.checkout)}
          </Text>
          <VerdictPill verdict={verdictOf(next)} size="sm" />
        </View>

        {/* The answer to the question, sized like an answer. */}
        <Text className="mt-2 font-psemibold text-2xl leading-8 text-gray-900">
          {dateRange(next.checkin, next.checkout)}
        </Text>
        <Text className="mt-1 font-pregular text-sm text-gray-500">
          {nights > 0 ? `${nights} night${nights === 1 ? '' : 's'}` : 'Day visit'}
          {room ? ` · ${room}` : ''}
        </Text>
      </View>

      <View className="flex-row items-center justify-between border-t border-gray-200 px-5 py-3.5">
        <View className="flex-row items-center gap-x-2">
          <Ionicons name="key-outline" size={16} color={colors.gray_400} />
          <Text className="font-pregular text-sm text-gray-600">
            {next.roomno ? `Room ${next.roomno}` : 'Room given on arrival'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.gray_400} />
      </View>
    </Pressable>
  );
};

export default NextStayCard;
