import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import React from 'react';
import { View, Text } from 'react-native';

import type { Audience } from './useBookingParty';
import { verdictForType } from './validationVerdict';

import VerdictPill from '@/src/components/stay/VerdictPill';
import { colors, dropdowns } from '@/src/constants';

/**
 * What the member asked for, in one card per booking type.
 *
 * This replaces sixteen files — roughly six booking types times three audiences
 * — that each hard-coded their own layout for the same three things: a title, a
 * date line, and a handful of label/value rows. Adding a booking type meant
 * writing three more files.
 *
 * Each card carries its own answer — available, waitlist or unavailable — read
 * from the same /validate response the charges list reads. StayOutcomeBlock then
 * only appears when there is more to say than the pill already says.
 */

interface Row {
  label: string;
  value: string;
}

const label = (list: any[], key: any, fallback = '') =>
  list.find((o: any) => o.key === key || o.value === key)?.value ?? key ?? fallback;

const dateRange = (start?: string, end?: string) => {
  if (!start) return undefined;
  if (!end || start === end) return moment(start).format('ddd, D MMM YYYY');
  return `${moment(start).format('D MMM')} – ${moment(end).format('D MMM YYYY')}`;
};

/**
 * Every group in a slice, not just the first.
 *
 * People can be split across groups with different room types, meals or routes.
 * Reading only the first group would quietly show one person's choice as if it
 * were everyone's.
 */
const groupsOf = (slice: any): any[] => {
  const groups = slice?.mumukshuGroup || slice?.guestGroup;
  return Array.isArray(groups) && groups.length > 0 ? groups : [slice];
};

const joinDistinct = (values: (string | undefined | null)[]) =>
  Array.from(new Set(values.filter(Boolean) as string[])).join(', ');

const peopleCount = (slice: any, audience: Audience) => {
  if (audience === 'self') return undefined;
  const groups = slice?.guestGroup || slice?.mumukshuGroup || slice?.mumukshus || slice?.guests;
  if (!Array.isArray(groups)) return undefined;
  const total = groups.reduce((n: number, g: any) => {
    if (Array.isArray(g?.guests)) return n + g.guests.length;
    if (Array.isArray(g?.mumukshus)) return n + g.mumukshus.length;
    return n + 1;
  }, 0);
  return total > 0 ? `${total}` : undefined;
};

/** One descriptor per booking type: how to title it and what to list. */
const DESCRIPTORS: Record<
  string,
  {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    dates: (s: any) => string | undefined;
    rows: (s: any) => Row[];
  }
> = {
  room: {
    title: 'Raj Sharan',
    icon: 'bed-outline',
    dates: (s) => dateRange(s.startDay, s.endDay),
    rows: (s) => {
      const groups = groupsOf(s);
      const out: Row[] = [];
      const roomTypes = joinDistinct(
        groups.map((g) => (g?.roomType ? label(dropdowns.ROOM_TYPE_LIST, g.roomType) : undefined))
      );
      if (roomTypes) out.push({ label: 'Room type', value: roomTypes });
      const floors = joinDistinct(
        groups.map((g) =>
          g?.floorType ? label(dropdowns.FLOOR_TYPE_LIST, g.floorType) : undefined
        )
      );
      if (floors) out.push({ label: 'Floor', value: floors });
      return out;
    },
  },
  flat: {
    title: 'Flat',
    icon: 'home-outline',
    dates: (s) => dateRange(s.startDay, s.endDay),
    rows: () => [],
  },
  food: {
    title: 'Raj Prasad',
    icon: 'restaurant-outline',
    dates: (s) => dateRange(s.startDay, s.endDay),
    rows: (s) => {
      const groups = groupsOf(s);
      const out: Row[] = [];
      const meals = joinDistinct(
        groups.flatMap((g) =>
          (g?.meals || []).map((m: string) => label(dropdowns.FOOD_TYPE_LIST, m))
        )
      );
      if (meals) out.push({ label: 'Meals', value: meals });
      const spice = joinDistinct(
        groups.map((g) => (g?.spicy != null ? label(dropdowns.SPICE_LIST, g.spicy) : undefined))
      );
      if (spice) out.push({ label: 'Spice', value: spice });
      const hightea = joinDistinct(
        groups.map((g) => (g?.hightea ? label(dropdowns.HIGHTEA_LIST, g.hightea) : undefined))
      );
      if (hightea) out.push({ label: 'High tea', value: hightea });
      return out;
    },
  },
  travel: {
    title: 'Raj Pravas',
    icon: 'bus-outline',
    dates: (s) => dateRange(s.date),
    rows: (s) => {
      const groups = groupsOf(s);
      const out: Row[] = [];
      const pickup = joinDistinct(groups.map((g) => g?.pickup));
      if (pickup) out.push({ label: 'Pickup', value: pickup });
      const drop = joinDistinct(groups.map((g) => g?.drop));
      if (drop) out.push({ label: 'Drop', value: drop });
      const car = joinDistinct(groups.map((g) => g?.type));
      if (car) out.push({ label: 'Car', value: car });
      const arrival = joinDistinct(groups.map((g) => g?.arrival_time));
      if (arrival) out.push({ label: 'Arrival', value: arrival });
      return out;
    },
  },
  adhyayan: {
    title: 'Raj Adhyayan',
    icon: 'book-outline',
    dates: (s) => dateRange(s.adhyayan?.start_date, s.adhyayan?.end_date),
    rows: (s) => {
      const out: Row[] = [];
      if (s.adhyayan?.name) out.push({ label: 'Shibir', value: s.adhyayan.name });
      if (s.adhyayan?.speaker) out.push({ label: 'Swadhyay Karta', value: s.adhyayan.speaker });
      if (s.adhyayan?.location) out.push({ label: 'Location', value: s.adhyayan.location });
      return out;
    },
  },
  utsav: {
    title: 'Raj Utsav',
    icon: 'sparkles-outline',
    dates: (s) => dateRange(s.utsav?.utsav_start, s.utsav?.utsav_end),
    rows: (s) => {
      const out: Row[] = [];
      if (s.utsav?.utsav_name) out.push({ label: 'Utsav', value: s.utsav.utsav_name });
      if (s.utsav?.utsav_location) out.push({ label: 'Location', value: s.utsav.utsav_location });
      const first = s.mumukshus?.[0] || s.guests?.[0];
      if (first?.package_name) out.push({ label: 'Package', value: first.package_name });
      return out;
    },
  },
};

/** Booking types are shown in the order a member built them up. */
const ORDER = ['room', 'flat', 'adhyayan', 'utsav', 'food', 'travel'];

/**
 * One display name per booking type, so the summary card and the charges list
 * cannot call the same thing by two names.
 */
export const BOOKING_TYPE_TITLE: Record<string, string> = Object.fromEntries(
  Object.entries(DESCRIPTORS).map(([key, d]) => [key, d.title])
);

interface BookingSummaryProps {
  data: any;
  audience: Audience;
  /** The /validate answer, so each card can state its own verdict. */
  validationData?: any;
  /**
   * Extra detail to render inside one type's card, keyed by booking type. The
   * stay outcome goes here rather than beside the card: two surfaces both
   * headed by dates and a verdict pill read as the same thing said twice.
   */
  extras?: Record<string, React.ReactNode>;
  className?: string;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({
  data,
  audience,
  validationData,
  extras,
  className = '',
}) => {
  const present = ORDER.filter((key) => data?.[key] && DESCRIPTORS[key]);
  if (present.length === 0) return null;

  return (
    <View className={`gap-y-3 ${className}`}>
      {present.map((key) => {
        const slice = data[key];
        const d = DESCRIPTORS[key];
        const dates = d.dates(slice);
        const rows = d.rows(slice);
        const people = peopleCount(slice, audience);
        const verdict = verdictForType(validationData, key);

        return (
          <View
            key={key}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-200">
            <View className="flex-row items-start gap-x-3 px-4 pb-3 pt-4">
              <View className="h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-50">
                <Ionicons name={d.icon} size={24} color={colors.secondary_200} />
              </View>
              <View className="flex-1">
                <Text className="font-psemibold text-base text-gray-900">{d.title}</Text>
                {dates ? (
                  <Text className="mt-0.5 font-pregular text-xs text-gray-500">
                    {dates}
                    {people ? ` · ${people} people` : ''}
                  </Text>
                ) : null}
              </View>
              {/* The answer belongs on the thing it is about. */}
              {verdict ? <VerdictPill verdict={verdict} size="sm" /> : null}
            </View>

            {rows.length > 0 ? (
              <View className="border-t border-gray-200">
                {rows.map((r, i) => (
                  <View key={r.label}>
                    {i > 0 ? <View className="ml-4 h-px bg-gray-200" /> : null}
                    <View className="flex-row items-center justify-between gap-x-3 px-4 py-3">
                      <Text className="font-pregular text-sm text-gray-500">{r.label}</Text>
                      <Text
                        className="flex-1 text-right font-pmedium text-sm text-gray-800"
                        numberOfLines={2}>
                        {r.value}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Rendered bare: an extra that decides it has nothing to say
                returns null, and a wrapper here would still draw its divider
                and padding as an empty strip. The extra owns its own chrome. */}
            {extras?.[key] ?? null}
          </View>
        );
      })}
    </View>
  );
};

export default BookingSummary;
