import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import FormDisplayField from './FormDisplayField';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';

interface CustomCalendarInputProps {
  openDatePicker: any;
  text: any;
  value: any;
  isDatePickerVisible: any;
  onDateSelect: any;
  onDateCancel: any;
  minimumDate?: any;
  isDisabled?: any;
  date?: any;
}

const CustomCalendarInput: React.FC<CustomCalendarInputProps> = ({
  openDatePicker,
  text,
  value,
  isDatePickerVisible,
  onDateSelect,
  onDateCancel,
  minimumDate = moment().add(1, 'days').toDate(),
  isDisabled = false,
  date,
}) => {
  const handleDateSelect = (date: any) => {
    if (isNaN(date)) date = new Date();
    onDateSelect(date);
  };
  return (
    <View>
      <TouchableOpacity onPress={openDatePicker} disabled={isDisabled}>
        <FormDisplayField
          text={text}
          value={value}
          otherStyles="mt-5"
          backgroundColor="bg-gray-100"
        />
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        date={date}
        onConfirm={handleDateSelect}
        onCancel={onDateCancel}
        minimumDate={minimumDate}
      />
    </View>
  );
};

export default CustomCalendarInput;
