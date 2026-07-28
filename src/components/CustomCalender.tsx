import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { colors } from '../constants';
import { Calendar } from 'react-native-calendars';
import moment from 'moment';
import Toast from 'react-native-toast-message';
import handleAPICall from '../utils/HandleApiCall';
import { useAuthStore } from '../stores';

const MIN_DATE = moment(new Date()).add(1, 'days').format('YYYY-MM-DD');

// Subtle, distinct-from-orange marker for utsav (festival) days. Utsav days stay
// SELECTABLE — an attendee legitimately books a range spanning the festival; the
// booking engine splits pre/post or rejects a non-attendee. So we only hint them.
// Festival marker uses a design-system neutral (colors.gray_700) — a deliberate
// dark "note" dot, distinct from the light-gray disabled days and the orange
// selection. The app palette is orange + grays (no violet), so no ad-hoc hue.
const FESTIVAL_COLOR = colors.gray_700;

// Static theme — all values are module-level color tokens, so this object never
// changes. Hoisted out of render so <Calendar> receives a stable reference.
const CALENDAR_THEME = {
  arrowColor: colors.orange,
  todayTextColor: colors.orange,
  // Blocked/disabled days render in the app's muted gray (matches the
  // "Unavailable" legend swatch), not react-native-calendars' default.
  textDisabledColor: colors.gray_400,
};

type BlockInfo = { type: 'block' | 'utsav'; reason?: string };
type BlockMap = Record<string, BlockInfo>;

interface CustomCalenderProps {
  type?: any;
  startDay?: any;
  setStartDay?: any;
  endDay?: any;
  setEndDay?: any;
  selectedDay?: any;
  setSelectedDay?: any;
  minDate?: any;
  // Phase-2 (T1d): opt-in for the room date-picker. Fetches centre blocks/utsav
  // days for the visible month(s), DISABLES non-utsav blocked days, marks utsav
  // days informationally, and enforces no-straddle. Off for non-stay pickers.
  blockAware?: boolean;
}

const CustomCalender: React.FC<CustomCalenderProps> = ({
  type,
  startDay,
  setStartDay,
  endDay,
  setEndDay,
  selectedDay,
  setSelectedDay,
  minDate,
  blockAware = false,
}) => {
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [disableLeftArrow, setDisableLeftArrow] = useState(false);
  const [blockedInfo, setBlockedInfo] = useState<BlockMap>({});

  const user = useAuthStore((state: any) => state.user);
  const cardno = user?.cardno;
  const fetchedMonths = useRef<Set<string>>(new Set());

  // Fetch the block/utsav map for the visible month + the next month (so a
  // range that spills into the following month still knows about its blocks).
  const fetchBlockedDates = useCallback(
    (anchorDateString: string) => {
      if (!blockAware) return;
      const anchor = moment(anchorDateString).startOf('month');
      const monthKey = anchor.format('YYYY-MM');
      if (fetchedMonths.current.has(monthKey)) return;
      fetchedMonths.current.add(monthKey);

      const from = anchor.format('YYYY-MM-DD');
      const to = anchor.clone().add(1, 'month').endOf('month').format('YYYY-MM-DD');

      handleAPICall(
        'GET',
        '/stay/blocked-dates',
        { from, to, cardno },
        null,
        (res: any) => {
          const data: BlockMap = res?.data || {};
          setBlockedInfo((prev) => ({ ...prev, ...data }));
        },
        () => {},
        () => {
          // Prevention is best-effort; the Phase-1 booking reject is the backstop.
          // Allow a retry of this window on a later month-change.
          fetchedMonths.current.delete(monthKey);
        },
        false // don't toast on a background prefetch failure
      );
    },
    [blockAware, cardno]
  );

  useEffect(() => {
    if (blockAware) fetchBlockedDates(minDate ? minDate : MIN_DATE);
  }, [blockAware, minDate, fetchBlockedDates]);

  const handlePeriodPress = (day: any) => {
    if (startDay && !endDay) {
      // NO-STRADDLE: a stay may not span a disabled (non-utsav block) night.
      // Utsav days do NOT block straddling — attendees book across them.
      for (const d = moment(startDay); d.isSameOrBefore(day.dateString); d.add(1, 'days')) {
        if (blockedInfo[d.format('YYYY-MM-DD')]?.type === 'block') {
          Toast.show({
            type: 'error',
            text1: 'Unavailable dates in range',
            text2:
              "Those dates include unavailable days — pick a range that doesn't cross them.",
            swipeable: false,
          });
          return; // keep the start day selected; reject this end day
        }
      }

      const date: any = {};
      for (const d = moment(startDay); d.isSameOrBefore(day.dateString); d.add(1, 'days')) {
        date[d.format('YYYY-MM-DD')] = {
          color: colors.orange,
          textColor: 'white',
        };

        if (d.format('YYYY-MM-DD') === startDay) date[d.format('YYYY-MM-DD')].startingDay = true;
        if (d.format('YYYY-MM-DD') === day.dateString)
          date[d.format('YYYY-MM-DD')].endingDay = true;
      }

      setMarkedDates(date);
      setEndDay(day.dateString);
    } else {
      setStartDay(day.dateString);
      setEndDay(null);
      setMarkedDates({
        [day.dateString]: {
          color: colors.orange,
          textColor: 'white',
          startingDay: true,
          endingDay: true,
        },
      });
    }
  };

  const handleMonthChange = (month: any) => {
    const currentMonth = moment(month.dateString).startOf('month');
    const minMonth = moment(minDate ? minDate : MIN_DATE).startOf('month');

    setDisableLeftArrow(currentMonth.isSameOrBefore(minMonth));
    if (blockAware) fetchBlockedDates(month.dateString);
  };

  // Build the block/utsav markings, then overlay the existing selection so an
  // attendee selecting across a festival still sees the utsav dot. Memoized so
  // the marks are only rebuilt when the blocks/selection actually change (not
  // on every re-render), and <Calendar> gets a stable object identity.
  const computedMarkedDates = useMemo(() => {
    const base: Record<string, any> = {};
    for (const [date, info] of Object.entries(blockedInfo)) {
      if (info.type === 'block') {
        base[date] = { disabled: true, disableTouchEvent: true };
      } else if (info.type === 'utsav') {
        base[date] = { marked: true, dotColor: FESTIVAL_COLOR };
      }
    }

    if (type === 'period') {
      for (const [date, sel] of Object.entries(markedDates)) {
        base[date] = { ...(base[date] || {}), ...sel };
      }
      return base;
    }

    // Single-day mode.
    if (selectedDay) {
      base[selectedDay] = {
        ...(base[selectedDay] || {}),
        textColor: 'white',
        selected: true,
        disableTouchEvent: true,
        selectedColor: colors.orange,
      };
    }
    return base;
  }, [blockedInfo, markedDates, type, selectedDay]);

  return (
    <View>
      <Calendar
        className="mt-5"
        minDate={minDate ? minDate : MIN_DATE}
        initialDate={minDate ? minDate : MIN_DATE}
        disableArrowLeft={disableLeftArrow}
        onMonthChange={handleMonthChange}
        onDayPress={(day: any) => {
          if (type === 'period') {
            handlePeriodPress(day);
          } else {
            setSelectedDay(day.dateString);
          }
        }}
        markedDates={computedMarkedDates}
        markingType={type}
        theme={CALENDAR_THEME}
      />

      {blockAware && (
        <View className="mt-2 flex-row items-center justify-center">
          <View className="mr-5 flex-row items-center">
            <View
              className="mr-1.5 h-3 w-3 rounded-full"
              style={{ backgroundColor: colors.gray_200, borderWidth: 1, borderColor: colors.gray_400 }}
            />
            <Text className="font-pregular text-xs text-gray-500">Unavailable</Text>
          </View>
          <View className="flex-row items-center">
            <View
              className="mr-1.5 h-3 w-3 rounded-full"
              style={{ backgroundColor: FESTIVAL_COLOR }}
            />
            <Text className="font-pregular text-xs text-gray-500">Utsav</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default CustomCalender;
