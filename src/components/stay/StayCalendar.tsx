import { Ionicons } from '@expo/vector-icons';
import { useQueries } from '@tanstack/react-query';
import moment from 'moment';
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { Calendar } from 'react-native-calendars';

import { colors } from '@/src/constants';
import { useAuthStore } from '@/src/stores';
import handleAPICall from '@/src/utils/HandleApiCall';

// The calendar answers exactly one question: can these dates be booked at all?
// It never guesses at availability, because a free bed depends on room type,
// floor and gender — all picked after the dates. Everything it shows as
// untappable is a hard no that no waitlist job would ever promote.
export type DayKind = 'closed' | 'utsav_out' | 'utsav_in' | 'own';

export interface DayInfo {
  /**
   * The precise cause. Sent by backends that know about attendance and the
   * member's own bookings.
   */
  kind?: DayKind;
  /**
   * Legacy field, still sent by the deployed backend: 'block' means nobody can
   * stay, 'utsav' means a festival overlaps with no attendance information.
   */
  type?: DayKind | 'block' | 'utsav';
  reason?: string;
  utsavName?: string;
}

export type DayMap = Record<string, DayInfo>;

/**
 * Resolves a day to its cause, whichever shape the backend speaks.
 *
 * A backend that only sends `type` cannot tell us whether the member attends an
 * overlapping Utsav, so 'utsav' maps to utsav_in — selectable, which is how the
 * app behaved before and is the safe direction: the booking call still rejects a
 * non-attendee. 'block' maps to closed, which is untappable.
 */
const kindOf = (info?: DayInfo): DayKind | undefined => {
  if (!info) return undefined;
  if (info.kind) return info.kind;
  if (info.type === 'block') return 'closed';
  if (info.type === 'utsav') return 'utsav_in';
  return info.type as DayKind | undefined;
};

const BLOCKING: DayKind[] = ['closed', 'utsav_out', 'own'];
const isBlocking = (info?: DayInfo) => {
  const k = kindOf(info);
  return Boolean(k && BLOCKING.includes(k));
};

const getMinDate = () => moment().add(1, 'days').format('YYYY-MM-DD');

const CALENDAR_THEME = {
  arrowColor: colors.orange,
  todayTextColor: colors.orange,
  textDisabledColor: colors.gray_400,
  // The library paints its own white sheet, which read as a card floating on
  // the page. The calendar is the page here, so it sits flush with it.
  calendarBackground: 'transparent',
};

const fmt = (d: string) => moment(d).format('D MMM');

/** One month of answers, plus the next, so paging forward is usually a cache hit. */
const fetchBlockedDates = (cardno: string, monthKey: string): Promise<DayMap> =>
  new Promise((resolve, reject) => {
    const anchor = moment(monthKey, 'YYYY-MM').startOf('month');
    handleAPICall(
      'GET',
      '/stay/blocked-dates',
      {
        from: anchor.format('YYYY-MM-DD'),
        to: anchor.clone().add(1, 'month').endOf('month').format('YYYY-MM-DD'),
        cardno,
      },
      null,
      (res: any) => resolve((res?.data || {}) as DayMap),
      () => {},
      () => reject(new Error('Failed to fetch blocked dates')),
      false
    );
  });

interface StayCalendarProps {
  mode?: 'period' | 'single';
  startDay?: string;
  setStartDay?: (day: string) => void;
  endDay?: string | null;
  setEndDay?: (day: string | null) => void;
  selectedDay?: string;
  setSelectedDay?: (day: string) => void;
  minDate?: string;
  // Injectable so the prototype and tests can drive it without the network.
  dayMapOverride?: DayMap;
}

const StayCalendar: React.FC<StayCalendarProps> = ({
  mode = 'period',
  startDay,
  setStartDay,
  endDay,
  setEndDay,
  selectedDay,
  setSelectedDay,
  minDate,
  dayMapOverride,
}) => {
  const [disableLeftArrow, setDisableLeftArrow] = useState(false);
  const [note, setNote] = useState<{ tone: 'info' | 'blocked'; text: string } | null>(null);

  const user = useAuthStore((state: any) => state.user);
  const cardno = user?.cardno;

  // Which months have been looked at. The answers themselves live in the query
  // cache, so leaving the screen and coming back does not refetch them.
  const [months, setMonths] = useState<string[]>(() => [
    moment(minDate || getMinDate())
      .startOf('month')
      .format('YYYY-MM'),
  ]);

  const results = useQueries({
    queries: months.map((monthKey) => ({
      queryKey: ['blockedDates', cardno, monthKey],
      queryFn: () => fetchBlockedDates(cardno, monthKey),
      enabled: Boolean(cardno) && !dayMapOverride,
    })),
  });

  // A month request covers the next one too, so consecutive months overlap and
  // the later answer simply wins.
  const signature = results.map((r) => r.dataUpdatedAt).join(',');
  const dayMap = useMemo(
    () => Object.assign({}, ...results.map((r) => r.data || {})) as DayMap,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signature]
  );

  const effectiveMap = dayMapOverride ?? dayMap;

  const rememberMonth = useCallback((anchorDateString: string) => {
    const monthKey = moment(anchorDateString).startOf('month').format('YYYY-MM');
    setMonths((prev) => (prev.includes(monthKey) ? prev : [...prev, monthKey]));
  }, []);

  // Last selectable day before the first blocking day at or after `from`.
  const lastSelectableFrom = useCallback(
    (from: string) => {
      const cursor = moment(from);
      let last = from;
      for (let i = 0; i < 120; i += 1) {
        cursor.add(1, 'days');
        const key = cursor.format('YYYY-MM-DD');
        if (isBlocking(effectiveMap[key])) return last;
        last = key;
      }
      return last;
    },
    [effectiveMap]
  );

  const firstBlockingFrom = useCallback(
    (from: string) => {
      const cursor = moment(from);
      for (let i = 0; i < 120; i += 1) {
        cursor.add(1, 'days');
        const key = cursor.format('YYYY-MM-DD');
        if (isBlocking(effectiveMap[key])) return { date: key, info: effectiveMap[key] };
      }
      return null;
    },
    [effectiveMap]
  );

  /**
   * The run of consecutive unbookable days starting at `from`, with the names of
   * whatever closes them.
   *
   * The backend reason says "closed on these dates" without giving any, which
   * leaves the member to hunt for the wall on the calendar. The day map already
   * holds the dates, so name them.
   */
  const blockedSpanFrom = useCallback(
    (from: string) => {
      const cursor = moment(from);
      const names: string[] = [];
      let end = from;
      for (let i = 0; i < 120; i += 1) {
        const key = cursor.format('YYYY-MM-DD');
        const info = effectiveMap[key];
        if (!isBlocking(info)) break;
        end = key;
        const name = info?.utsavName;
        if (name && !names.includes(name)) names.push(name);
        cursor.add(1, 'days');
      }
      return { start: from, end, names };
    },
    [effectiveMap]
  );

  /** "15 Aug" for one day, "15 Aug – 18 Aug" for a run. */
  const describeSpan = (span: { start: string; end: string }) =>
    span.start === span.end ? fmt(span.start) : `${fmt(span.start)} – ${fmt(span.end)}`;

  const utsavSpanInside = useCallback(
    (from: string, to: string) => {
      const days: string[] = [];
      const cursor = moment(from);
      while (cursor.isSameOrBefore(to)) {
        const key = cursor.format('YYYY-MM-DD');
        if (kindOf(effectiveMap[key]) === 'utsav_in') days.push(key);
        cursor.add(1, 'days');
      }
      if (days.length === 0) return null;
      return {
        start: days[0],
        end: days[days.length - 1],
        name: effectiveMap[days[0]]?.utsavName || 'Utsav',
      };
    },
    [effectiveMap]
  );

  const handleDayPress = (day: any) => {
    const key = day.dateString;
    const info = effectiveMap[key];

    // A blocked day explains itself in place. No toast: a toast disappears
    // before it is read, and two of them stack.
    if (isBlocking(info)) {
      const span = blockedSpanFrom(key);
      setNote({
        tone: 'blocked',
        text: span.names.length
          ? `${describeSpan(span)} cannot be booked: ${span.names.join(' & ')}.`
          : `${describeSpan(span)} cannot be booked. ${info?.reason ?? ''}`.trim(),
      });
      return;
    }

    if (mode === 'single') {
      setNote(null);
      setSelectedDay?.(key);
      return;
    }

    if (!startDay || endDay) {
      setNote(null);
      setStartDay?.(key);
      setEndDay?.(null);
      return;
    }

    if (key < startDay) {
      setNote(null);
      setStartDay?.(key);
      setEndDay?.(null);
      return;
    }

    // A range that would cross a blocked day CLAMPS to the last selectable day
    // and says so. The old behavior threw the end date away with a toast, which
    // made the member guess where the wall was.
    const blocker = firstBlockingFrom(startDay);
    if (blocker && blocker.date <= key) {
      const clamped = lastSelectableFrom(startDay);
      const span = blockedSpanFrom(blocker.date);
      setEndDay?.(clamped);
      setNote({
        tone: 'blocked',
        text: span.names.length
          ? `Your stay can run to ${fmt(clamped)}. ${describeSpan(span)} cannot be booked: ${span.names.join(' & ')}.`
          : `Your stay can run to ${fmt(clamped)}. ${describeSpan(span)} cannot be booked. ${
              blocker.info?.reason ?? ''
            }`.trim(),
      });
      return;
    }

    setEndDay?.(key);
    const utsav = utsavSpanInside(startDay, key);
    setNote(
      utsav
        ? {
            tone: 'info',
            text: `Your stay will split around ${utsav.name}, ${fmt(utsav.start)} – ${fmt(
              utsav.end
            )}. You will get two bookings.`,
          }
        : null
    );
  };

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    for (const [date, info] of Object.entries(effectiveMap)) {
      if (isBlocking(info)) {
        marks[date] = { disabled: true, disableTouchEvent: false };
      } else if (kindOf(info) === 'utsav_in') {
        marks[date] = { marked: true, dotColor: colors.orange };
      }
    }

    if (mode === 'single') {
      if (selectedDay) {
        // Marked as a one-day period rather than `selected`, so both modes use
        // the same marking type. Switching type swaps the day component the
        // library renders, and the cell height changes with it.
        marks[selectedDay] = {
          ...(marks[selectedDay] || {}),
          color: colors.orange,
          textColor: colors.white,
          startingDay: true,
          endingDay: true,
        };
      }
      return marks;
    }

    if (startDay) {
      const last = endDay || startDay;
      const cursor = moment(startDay);
      while (cursor.isSameOrBefore(last)) {
        const key = cursor.format('YYYY-MM-DD');
        marks[key] = {
          ...(marks[key] || {}),
          color: colors.orange,
          textColor: colors.white,
          ...(key === startDay ? { startingDay: true } : {}),
          ...(key === last ? { endingDay: true } : {}),
        };
        cursor.add(1, 'days');
      }
    }
    return marks;
  }, [effectiveMap, startDay, endDay, selectedDay, mode]);

  const legendNeeds = useMemo(() => {
    let blocking = false;
    let utsavIn = false;
    for (const info of Object.values(effectiveMap)) {
      if (isBlocking(info)) blocking = true;
      else if (kindOf(info) === 'utsav_in') utsavIn = true;
      if (blocking && utsavIn) break;
    }
    return { blocking, utsavIn };
  }, [effectiveMap]);
  const hasBlocking = legendNeeds.blocking;
  const hasUtsavIn = legendNeeds.utsavIn;

  const handleMonthChange = (month: any) => {
    const current = moment(month.dateString).startOf('month');
    const min = moment(minDate || getMinDate()).startOf('month');
    setDisableLeftArrow(current.isSameOrBefore(min));
    rememberMonth(month.dateString);
  };

  return (
    <View>
      <Calendar
        className="mt-5"
        minDate={minDate || getMinDate()}
        initialDate={minDate || getMinDate()}
        disableArrowLeft={disableLeftArrow}
        onMonthChange={handleMonthChange}
        onDayPress={handleDayPress}
        markedDates={markedDates}
        markingType="period"
        theme={CALENDAR_THEME}
      />

      {note && (
        <View
          className={`mt-3 flex-row items-start gap-x-3 rounded-xl border px-3.5 py-3.5 ${
            note.tone === 'blocked'
              ? 'border-red-200 bg-red-100'
              : 'border-secondary bg-secondary-50'
          }`}>
          <Ionicons
            name={note.tone === 'blocked' ? 'alert-circle' : 'git-branch'}
            size={20}
            color={note.tone === 'blocked' ? colors.red_200 : colors.secondary_200}
            style={{ marginTop: 1 }}
          />
          <View className="flex-1">
            <Text
              className={`font-psemibold text-sm ${
                note.tone === 'blocked' ? 'text-red-200' : 'text-gray-900'
              }`}>
              {note.tone === 'blocked' ? 'These dates are not available' : 'Your stay will split'}
            </Text>
            <Text className="mt-0.5 font-pregular text-xs leading-5 text-gray-700">
              {note.text}
            </Text>
          </View>
        </View>
      )}

      {/* Only legend the states actually on screen. A key for "Utsav you attend"
          when no Utsav falls in the visible months is noise the member has to
          rule out. Each swatch imitates the real day treatment: a dimmed number
          for a day that cannot be booked, a tinted cell for an attended Utsav. */}
      {(hasBlocking || hasUtsavIn) && (
        <View className="mt-3 flex-row flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
          {hasBlocking && (
            <View className="flex-row items-center gap-x-2">
              <View
                className="h-4 w-4 rounded-md"
                style={{
                  backgroundColor: colors.gray_200,
                  borderWidth: 1,
                  borderColor: colors.gray_300,
                }}
              />
              <Text className="font-pregular text-xs text-gray-500">Cannot be booked</Text>
            </View>
          )}
          {hasUtsavIn && (
            <View className="flex-row items-center gap-x-2">
              <View className="h-4 w-4 items-center justify-center">
                <View className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.orange }} />
              </View>
              <Text className="font-pregular text-xs text-gray-500">Utsav you attend</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default StayCalendar;
