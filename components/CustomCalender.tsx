import { useWindowDimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { colors } from '../constants';
import { Calendar } from 'react-native-calendars';

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
  const { width } = useWindowDimensions();
  const [markedDates, setMarkedDates] = useState({});
  const [disableLeftArrow, setDisableLeftArrow] = useState(false);

  // Fixed useEffect to handle both single start date and date range
  useEffect(() => {
    if (type === 'period') {
      if (startDay && endDay) {
        // Both dates selected - show full range
        const date: any = {};
        for (const d = moment(startDay); d.isSameOrBefore(moment(endDay)); d.add(1, 'days')) {
          const key = d.format('YYYY-MM-DD');
          date[key] = {
            color: colors.orange,
            textColor: 'white',
          };

          if (key === startDay) date[key].startingDay = true;
          if (key === endDay) date[key].endingDay = true;
        }
        setMarkedDates(date);
      } else if (startDay && !endDay) {
        // Only start date selected - show single date
        setMarkedDates({
          [startDay]: {
            color: colors.orange,
            textColor: 'white',
            startingDay: true,
            endingDay: true,
          },
        });
      } else {
        // No dates selected
        setMarkedDates({});
      }
    }
  }, [startDay, endDay, type]);

  const handlePeriodPress = (day: any) => {
    if (startDay && !endDay) {
      // Second click - set end date
      if (moment(day.dateString).isBefore(moment(startDay))) {
        // If selected date is before start date, make it the new start date
        setStartDay(day.dateString);
        setEndDay(null);
      } else {
        // Normal case - set as end date
        setEndDay(day.dateString);
      }
    } else {
      // First click or reset - set start date
      setStartDay(day.dateString);
      setEndDay(null);
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
      style={{
        width: width * 0.9,
      }}
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
