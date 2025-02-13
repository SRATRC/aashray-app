import { useWindowDimensions } from 'react-native';
import React, { useState } from 'react';
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
}

const CustomCalender: React.FC<CustomCalenderProps> = ({
  type,
  startDay,
  setStartDay,
  endDay,
  setEndDay,
  selectedDay,
  setSelectedDay,
}) => {
  const { width } = useWindowDimensions();
  const [markedDates, setMarkedDates] = useState({});
  const [disableLeftArrow, setDisableLeftArrow] = useState(false);

  const handlePeriodPress = (day: any) => {
    if (startDay && !endDay) {
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
    const minMonth = moment(MIN_DATE).startOf('month');

    setDisableLeftArrow(currentMonth.isSameOrBefore(minMonth));
  };

  return (
    <Calendar
      className="mt-5"
      style={{
        width: width * 0.9,
      }}
      minDate={MIN_DATE}
      initialDate={MIN_DATE}
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
