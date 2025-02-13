import { View, Text, Image, TouchableOpacity } from 'react-native';
import { icons, dropdowns } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import React from 'react';
import moment from 'moment';
import CustomDropdown from '../CustomDropdown';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import FormDisplayField from '../FormDisplayField';
import AddonItem from '../AddonItem';
import CustomMultiSelectDropdown from '../CustomMultiSelectDropdown';

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
  return (
    <AddonItem
      onCollapse={() => {
        setFoodForm({
          startDay: '',
          endDay: '',
          spicy: '',
          hightea: 'NONE',
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
      <TouchableOpacity
        onPress={() =>
          setDatePickerVisibility({
            ...isDatePickerVisible,
            foodStart: true,
          })
        }>
        <FormDisplayField
          text="Start Date"
          value={
            foodForm.startDay ? moment(foodForm.startDay).format('Do MMMM YYYY') : 'Start Date'
          }
          otherStyles="mt-5"
          backgroundColor="bg-gray-100"
        />
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isDatePickerVisible.foodStart}
        mode="date"
        onConfirm={(date: any) => {
          if (isNaN(date)) date = moment().add(1, 'days').toDate();
          setFoodForm({
            ...foodForm,
            startDay:
              moment(date).toDate() < moment().add(1, 'days').toDate()
                ? moment().add(1, 'days').format('YYYY-MM-DD')
                : moment(date).format('YYYY-MM-DD'),
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
        minimumDate={moment().add(1, 'days').toDate()}
      />

      <TouchableOpacity
        disabled={foodForm.startDay == ''}
        onPress={() =>
          setDatePickerVisibility({
            ...isDatePickerVisible,
            foodEnd: true,
          })
        }>
        <FormDisplayField
          text="End Date"
          value={foodForm.endDay ? moment(foodForm.endDay).format('Do MMMM YYYY') : 'End Date'}
          otherStyles="mt-5"
          backgroundColor="bg-gray-100"
        />
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isDatePickerVisible.foodEnd}
        mode="date"
        onConfirm={(date: any) => {
          if (isNaN(date)) date = moment(foodForm.startDay).toDate();
          setFoodForm({
            ...foodForm,
            endDay:
              moment(date).toDate() < moment().add(1, 'days').toDate()
                ? moment().add(1, 'days').format('YYYY-MM-DD')
                : moment(date).format('YYYY-MM-DD'),
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
        minimumDate={moment(foodForm.startDay).toDate()}
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
      />

      <CustomDropdown
        otherStyles="mt-5 w-full px-1"
        text={'Hightea'}
        placeholder={'Hightea'}
        data={dropdowns.HIGHTEA_LIST}
        defaultOption={{ key: 'NONE', value: 'None' }}
        setSelected={(val: any) => setFoodForm({ ...foodForm, hightea: val })}
      />
    </AddonItem>
  );
};

export default FoodAddon;
