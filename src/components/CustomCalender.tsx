import moment from 'moment';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Calendar } from 'react-native-calendars';

import { colors } from '../constants';

// Plain date picker for the non-stay flows (food, travel). It has no idea about
// centre blocks, Utsavs or the member's own bookings, and it must not pretend to:
// anything that answers "can these dates be booked?" belongs in StayCalendar,
// which is the single stay picker.
const getMinDate = () => moment().add(1, 'days').format('YYYY-MM-DD');

const CALENDAR_THEME = {
  arrowColor: colors.orange,
  todayTextColor: colors.orange,
  textDisabledColor: colors.gray_400,
  // Flush with the page, same as the stay calendar. The library paints its own
  // white sheet otherwise.
  calendarBackground: 'transparent',
};

interface CustomCalenderProps {
  type?: any;
  startDay?: any;
  setStartDay?: any;
  endDay?: any;
  setEndDay?: any;
  selectedDay?: any;
  setSelectedDay?: any;
  minDate?: any;
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
}) => {
  const [disableLeftArrow, setDisableLeftArrow] = useState(false);

  const handlePeriodPress = (day: any) => {
    if (startDay && !endDay && day.dateString >= startDay) {
      setEndDay(day.dateString);
      return;
    }
    setStartDay(day.dateString);
    setEndDay(null);
  };

  const handleMonthChange = (month: any) => {
    const currentMonth = moment(month.dateString).startOf('month');
    const minMonth = moment(minDate ? minDate : getMinDate()).startOf('month');
    setDisableLeftArrow(currentMonth.isSameOrBefore(minMonth));
  };

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    if (type === 'period') {
      if (startDay) {
        const last = endDay || startDay;
        const cursor = moment(startDay);
        while (cursor.isSameOrBefore(last)) {
          const key = cursor.format('YYYY-MM-DD');
          marks[key] = {
            color: colors.orange,
            textColor: 'white',
            ...(key === startDay ? { startingDay: true } : {}),
            ...(key === last ? { endingDay: true } : {}),
          };
          cursor.add(1, 'days');
        }
      }
      return marks;
    }

    if (selectedDay) {
      marks[selectedDay] = {
        textColor: 'white',
        selected: true,
        selectedColor: colors.orange,
      };
    }
    return marks;
  }, [startDay, endDay, selectedDay, type]);

  return (
    <View>
      <Calendar
        className="mt-5"
        minDate={minDate ? minDate : getMinDate()}
        initialDate={minDate ? minDate : getMinDate()}
        disableArrowLeft={disableLeftArrow}
        onMonthChange={handleMonthChange}
        onDayPress={(day: any) => {
          if (type === 'period') handlePeriodPress(day);
          else setSelectedDay(day.dateString);
        }}
        markedDates={markedDates}
        markingType={type}
        theme={CALENDAR_THEME}
      />
    </View>
  );
};

export default CustomCalender;
