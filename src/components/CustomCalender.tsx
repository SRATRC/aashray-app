import React, { useState, useEffect } from 'react';
import { colors } from '../constants';
import { Calendar } from 'react-native-calendars';
import moment from 'moment';

// Builds the period markings for a start (and optional end) date.
const buildPeriodMarks = (startDay?: string, endDay?: string) => {
  if (!startDay) return {};
  if (startDay && endDay) {
    const marks: any = {};
    for (const d = moment(startDay); d.isSameOrBefore(endDay); d.add(1, 'days')) {
      const key = d.format('YYYY-MM-DD');
      marks[key] = { color: colors.orange, textColor: 'white' };
      if (key === startDay) marks[key].startingDay = true;
      if (key === endDay) marks[key].endingDay = true;
    }
    return marks;
  }
  return {
    [startDay]: { color: colors.orange, textColor: 'white', startingDay: true, endingDay: true },
  };
};

const MIN_DATE = moment(new Date()).add(1, 'days').format('YYYY-MM-DD');

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
  const [markedDates, setMarkedDates] = useState(() => buildPeriodMarks(startDay, endDay));
  const [disableLeftArrow, setDisableLeftArrow] = useState(false);

  // Keep the period highlight in sync with the start/end props so external changes (e.g. the
  // caller clearing the return date, or restarting the range) are reflected instead of leaving
  // a stale highlight.
  useEffect(() => {
    if (type === 'period') setMarkedDates(buildPeriodMarks(startDay, endDay));
  }, [type, startDay, endDay]);

  const handlePeriodPress = (day: any) => {
    if (startDay && !endDay) {
      setMarkedDates(buildPeriodMarks(startDay, day.dateString));
      setEndDay(day.dateString);
    } else {
      setStartDay(day.dateString);
      setEndDay(null);
      setMarkedDates(buildPeriodMarks(day.dateString));
    }
  };

  const handleMonthChange = (month: any) => {
    const currentMonth = moment(month.dateString).startOf('month');
    const minMonth = moment(minDate ? minDate : MIN_DATE).startOf('month');

    setDisableLeftArrow(currentMonth.isSameOrBefore(minMonth));
  };

  return (
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
      markedDates={
        type === 'period'
          ? markedDates
          : {
              [selectedDay]: {
                textColor: 'white',
                selected: true,
                disableTouchEvent: true,
                selectedColor: colors.orange,
              },
            }
      }
      markingType={type}
      theme={{
        arrowColor: colors.orange,
        todayTextColor: colors.orange,
      }}
    />
  );
};

export default CustomCalender;
