import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';
import { icons, dropdowns } from '@/src/constants';
import { useBookingStore } from '@/src/stores';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import CustomSelectBottomSheet from '../CustomSelectBottomSheet';
import FormDisplayField from '../FormDisplayField';
import AddonItem from '../AddonItem';
import Toast from 'react-native-toast-message';
import moment from 'moment';
import * as Haptics from 'expo-haptics';

interface FoodAddonProps {
  foodForm: any;
  setFoodForm: any;
  isDatePickerVisible: any;
  setDatePickerVisibility: (pickerType: any, isVisible: any) => void;
  onToggle?: (isOpen: boolean) => void;
}

const FoodAddon: React.FC<FoodAddonProps> = ({
  foodForm,
  setFoodForm,
  isDatePickerVisible,
  setDatePickerVisibility,
  onToggle,
}) => {
  const mumukshuData = useBookingStore((state) => state.mumukshuData);
  const setMumukshuData = useBookingStore((state) => state.setMumukshuData);

  // Temporary state to hold the date for the checkin picker
  const [tempFoodStartDate, setTempFoodStartDate] = useState(
    foodForm.startDay ? moment(foodForm.startDay).toDate() : moment().add(1, 'days').toDate()
  );

  return (
    <AddonItem
      onCollapse={() => {
        setFoodForm({
          startDay:
            mumukshuData.room?.startDay ||
            (mumukshuData.adhyayan && mumukshuData.adhyayan.adhyayan?.start_date) ||
            mumukshuData.travel?.date ||
            mumukshuData.flat?.startDay ||
            mumukshuData.utsav?.utsav?.utsav_start ||
            '',
          endDay:
            mumukshuData.room?.endDay ||
            (mumukshuData.adhyayan && mumukshuData.adhyayan.adhyayan?.end_date) ||
            mumukshuData.flat?.endDay ||
            mumukshuData.utsav?.utsav?.utsav_end ||
            '',
          meals: ['breakfast', 'lunch', 'dinner'],
          spicy: dropdowns.SPICE_LIST[0].key,
          hightea: dropdowns.HIGHTEA_LIST[0].key,
        });

        setMumukshuData((prev: any) => {
          const { food, ...rest } = prev;
          return rest;
        });
      }}
      onToggle={onToggle}
      visibleContent={
        <View className="flex flex-row items-center gap-x-4">
          <Image source={icons.food} className="h-10 w-10" resizeMode="contain" />
          <Text className="font-pmedium">Raj Prasad Booking</Text>
        </View>
      }
      containerStyles={'mt-3'}>
      <FormDisplayField
        text="Start Date"
        value={foodForm.startDay ? moment(foodForm.startDay).format('Do MMMM YYYY') : 'Start Date'}
        otherStyles="mt-5"
        backgroundColor="bg-gray-100"
        onPress={() => setDatePickerVisibility('foodStart', true)}
      />
      <DateTimePickerModal
        isVisible={isDatePickerVisible.foodStart}
        mode="date"
        date={tempFoodStartDate}
        onConfirm={(date: Date) => {
          // Ensure the selected date isn't before tomorrow
          const selectedMoment = moment(date);
          const tomorrow =
            moment().hour() < 11
              ? moment(new Date()).add(1, 'days')
              : moment(new Date()).add(2, 'days');
          const validDate = selectedMoment.isBefore(tomorrow) ? tomorrow : selectedMoment;

          setFoodForm({
            ...foodForm,
            startDay: validDate.format('YYYY-MM-DD'),
            endDay: '',
          });
          setDatePickerVisibility('foodStart', false);
        }}
        onCancel={() => setDatePickerVisibility('foodStart', false)}
        minimumDate={
          moment().hour() < 11
            ? moment(new Date()).add(1, 'days').toDate()
            : moment(new Date()).add(2, 'days').toDate()
        }
      />

      <FormDisplayField
        text="End Date"
        value={foodForm.endDay ? moment(foodForm.endDay).format('Do MMMM YYYY') : 'End Date'}
        otherStyles="mt-5"
        backgroundColor="bg-gray-100"
        onPress={() => {
          if (foodForm.startDay) {
            setDatePickerVisibility('foodEnd', true);
          } else {
            Toast.show({
              type: 'info',
              text1: 'Please select start date first',
              swipeable: false,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        }}
      />
      <DateTimePickerModal
        isVisible={isDatePickerVisible.foodEnd}
        mode="date"
        date={foodForm.endDay ? moment(foodForm.endDay).toDate() : new Date()}
        onConfirm={(date: Date) => {
          const selectedMoment = moment(date);
          const tomorrow = moment(foodForm.startDay);
          const validDate = selectedMoment.isBefore(tomorrow) ? tomorrow : selectedMoment;

          setFoodForm({
            ...foodForm,
            endDay: moment(validDate).format('YYYY-MM-DD'),
          });
          setDatePickerVisibility('foodEnd', false);
        }}
        onCancel={() => setDatePickerVisibility('foodEnd', false)}
        minimumDate={foodForm.startDay ? moment(foodForm.startDay).toDate() : undefined}
      />

      <CustomSelectBottomSheet
        className="mt-5 w-full px-1"
        label="Food Type"
        placeholder="Select Meals"
        options={dropdowns.FOOD_TYPE_LIST}
        selectedValues={foodForm.meals}
        onValuesChange={(val) => setFoodForm({ ...foodForm, meals: val as string[] })}
        multiSelect={true}
        confirmButtonText="Select"
        maxSelectedDisplay={3}
      />

      <CustomSelectBottomSheet
        className="mt-5 w-full px-1"
        label="Spice Level"
        placeholder="How much spice do you want?"
        options={dropdowns.SPICE_LIST}
        selectedValue={foodForm.spicy}
        onValueChange={(val: any) => setFoodForm({ ...foodForm, spicy: val })}
      />

      <CustomSelectBottomSheet
        className="mt-5 w-full px-1"
        label="Hightea"
        placeholder="Hightea"
        options={dropdowns.HIGHTEA_LIST}
        selectedValue={foodForm.hightea}
        onValueChange={(val: any) => setFoodForm({ ...foodForm, hightea: val })}
      />
    </AddonItem>
  );
};

export default FoodAddon;
