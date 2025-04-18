import { View, Text, Image, TouchableOpacity } from 'react-native';
import { icons, dropdowns } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import React, { useEffect, useState } from 'react';
import CustomDropdown from '../CustomDropdown';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import FormDisplayField from '../FormDisplayField';
import AddonItem from '../AddonItem';
import CustomMultiSelectDropdown from '../CustomMultiSelectDropdown';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import moment from 'moment';

interface FoodAddonProps {
  foodForm: any;
  setFoodForm: any;
  setMeals: any;
  isDatePickerVisible: any;
  setDatePickerVisibility: any;
}

const FoodAddon: React.FC<FoodAddonProps> = ({
  foodForm,
  setFoodForm,
  setMeals,
  isDatePickerVisible,
  setDatePickerVisibility,
}) => {
  const { setData } = useGlobalContext();

  // Temporary state to hold the date for the checkin picker
  const [tempFoodStartDate, setTempFoodStartDate] = useState(new Date());

  // When the checkin picker is opened, initialize the temporary date
  useEffect(() => {
    if (isDatePickerVisible.foodStart) {
      setTempFoodStartDate(
        foodForm.startDay ? moment(foodForm.startDay).toDate() : moment().add(1, 'days').toDate()
      );
    }
  }, [isDatePickerVisible.foodStart]);

  return (
    <AddonItem
      onCollapse={() => {
        setFoodForm({
          startDay: '',
          endDay: '',
          spicy: dropdowns.SPICE_LIST[0].key,
          hightea: dropdowns.HIGHTEA_LIST[0].key,
        });
        setMeals([]);

        setData((prev: any) => {
          const { food, ...rest } = prev;
          return rest;
        });
      }}
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
        onPress={() =>
          setDatePickerVisibility({
            ...isDatePickerVisible,
            foodStart: true,
          })
        }
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
          setDatePickerVisibility({
            ...isDatePickerVisible,
            foodStart: false,
          });
        }}
        onCancel={() =>
          setDatePickerVisibility({
            ...isDatePickerVisible,
            foodStart: false,
          })
        }
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
            setDatePickerVisibility({
              ...isDatePickerVisible,
              foodEnd: true,
            });
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
          setDatePickerVisibility({
            ...isDatePickerVisible,
            foodEnd: false,
          });
        }}
        onCancel={() =>
          setDatePickerVisibility({
            ...isDatePickerVisible,
            foodEnd: false,
          })
        }
        minimumDate={foodForm.startDay ? moment(foodForm.startDay).toDate() : undefined}
      />

      <CustomMultiSelectDropdown
        otherStyles="mt-5 w-full px-1"
        text={'Food Type'}
        placeholder={'Select Food Type'}
        data={dropdowns.FOOD_TYPE_LIST}
        setSelected={(val: any) => setMeals(val)}
      />

      <CustomDropdown
        otherStyles="mt-5 w-full px-1"
        text={'Spice Level'}
        placeholder={'How much spice do you want?'}
        data={dropdowns.SPICE_LIST}
        setSelected={(val: any) => setFoodForm({ ...foodForm, spicy: val })}
        defaultOption={dropdowns.SPICE_LIST[0]}
      />

      <CustomDropdown
        otherStyles="mt-5 w-full px-1"
        text={'Hightea'}
        placeholder={'Hightea'}
        data={dropdowns.HIGHTEA_LIST}
        setSelected={(val: any) => setFoodForm({ ...foodForm, hightea: val })}
        defaultOption={dropdowns.HIGHTEA_LIST[2]}
      />
    </AddonItem>
  );
};

export default FoodAddon;
