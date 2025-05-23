import { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { colors, icons, dropdowns } from '../../constants';
import CustomSelectBottomSheet from '../CustomSelectBottomSheet';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import HorizontalSeparator from '../HorizontalSeparator';
import FormDisplayField from '../FormDisplayField';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import AddonItem from '../AddonItem';
import moment from 'moment';

interface GuestFoodAddonProps {
  foodForm: any;
  setFoodForm: any;
  addFoodForm: any;
  resetFoodForm: any;
  updateFoodForm: any;
  reomveFoodForm: any;
  guest_dropdown: any;
  isDatePickerVisible: any;
  setDatePickerVisibility: (pickerType: string, isVisible: boolean) => void;
  onToggle?: (isOpen: boolean) => void;
}

const GuestFoodAddon: React.FC<GuestFoodAddonProps> = ({
  foodForm,
  setFoodForm,
  addFoodForm,
  resetFoodForm,
  updateFoodForm,
  reomveFoodForm,
  guest_dropdown,
  isDatePickerVisible,
  setDatePickerVisibility,
  onToggle,
}) => {
  const [tempFoodStartDate, setTempFoodStartDate] = useState(
    foodForm.startDay ? moment(foodForm.startDay).toDate() : moment().add(1, 'days').toDate()
  );

  // Function to get available guests for a specific group index
  const getAvailableGuests = (currentGroupIndex: number) => {
    // Get all selected guest indices from other groups
    const selectedIndices = foodForm.guestGroup.reduce((acc: number[], group: any, idx: number) => {
      if (idx !== currentGroupIndex) {
        return [...acc, ...group.guestIndices];
      }
      return acc;
    }, []);

    // Filter out guests that are already selected in other groups
    return guest_dropdown.filter((guest: any) => !selectedIndices.includes(guest.value));
  };

  // Add this function near the getAvailableGuests function
  const hasAvailableGuests = () => {
    // Get all selected guest indices from all groups
    const selectedIndices = foodForm.guestGroup.flatMap((group: any) => group.guestIndices);
    // Check if there are any unselected guests
    return guest_dropdown.some((guest: any) => !selectedIndices.includes(guest.value));
  };

  return (
    <AddonItem
      onCollapse={() => {
        resetFoodForm();
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
        minimumDate={moment().add(1, 'days').toDate()}
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
        minimumDate={
          foodForm.startDay ? moment(foodForm.startDay).add(1, 'days').toDate() : undefined
        }
      />

      {foodForm.guestGroup.map((assignment: any, index: any) => (
        <View key={index} style={{ marginBottom: 15 }}>
          {index > 0 && (
            <View>
              <HorizontalSeparator otherStyles={'w-full mt-3'} />
              <TouchableOpacity
                onPress={reomveFoodForm(index)}
                className="mt-3 flex-1 flex-row items-center justify-end gap-x-1">
                <Image
                  source={icons.remove}
                  tintColor={'red'}
                  className="h-3 w-3"
                  resizeMode="contain"
                />
                <Text className="font-pregular text-xs text-red-500">Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          <CustomSelectBottomSheet
            className="mt-5"
            label={`Guests group - ${index + 1}`}
            placeholder="Select Guests"
            options={getAvailableGuests(index)}
            selectedValues={assignment.guestIndices}
            onValuesChange={(val) => updateFoodForm(index, 'guests', val)}
            multiSelect={true}
            confirmButtonText="Select"
          />

          <CustomSelectBottomSheet
            className="mt-5"
            label="Food Type"
            placeholder="Select Meals"
            options={dropdowns.FOOD_TYPE_LIST}
            selectedValues={assignment.meals}
            onValuesChange={(val) => updateFoodForm(index, 'meals', val)}
            multiSelect={true}
            confirmButtonText="Select"
            maxSelectedDisplay={3}
          />

          <CustomSelectBottomSheet
            className="mt-5"
            label="Spice Level"
            placeholder="How much spice do you want?"
            options={dropdowns.SPICE_LIST}
            selectedValue={assignment.spicy}
            onValueChange={(val: any) => updateFoodForm(index, 'spicy', val)}
          />

          <CustomSelectBottomSheet
            className="mt-5"
            label="Hightea"
            placeholder="Hightea"
            options={dropdowns.HIGHTEA_LIST}
            selectedValue={assignment.hightea}
            onValueChange={(val: any) => updateFoodForm(index, 'hightea', val)}
          />
        </View>
      ))}

      <TouchableOpacity
        className={`mt-4 w-full flex-row items-center justify-start gap-x-1 ${
          !hasAvailableGuests() ? 'opacity-50' : ''
        }`}
        onPress={hasAvailableGuests() ? addFoodForm : undefined}
        disabled={!hasAvailableGuests()}>
        <Image
          source={icons.addon}
          tintColor={colors.black}
          className="h-4 w-4"
          resizeMode="contain"
        />
        <Text className="text-base text-black underline">Add More Guests</Text>
      </TouchableOpacity>
    </AddonItem>
  );
};

export default GuestFoodAddon;
