import { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { colors, icons, dropdowns } from '../../constants';
import moment from 'moment';
import AddonItem from '../AddonItem';
import HorizontalSeparator from '../HorizontalSeparator';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import FormDisplayField from '../FormDisplayField';
import CustomSelectBottomSheet from '../CustomSelectBottomSheet';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

interface MumukshuFoodAddonProps {
  foodForm: any;
  setFoodForm: any;
  addFoodForm: any;
  resetFoodForm: any;
  updateFoodForm: any;
  reomveFoodForm: any;
  mumukshu_dropdown: any;
  isDatePickerVisible: any;
  setDatePickerVisibility: (pickerType: string, isVisible: boolean) => void;
  onToggle?: (isOpen: boolean) => void;
}

const MumukshuFoodAddon: React.FC<MumukshuFoodAddonProps> = ({
  foodForm,
  setFoodForm,
  addFoodForm,
  resetFoodForm,
  updateFoodForm,
  reomveFoodForm,
  mumukshu_dropdown,
  isDatePickerVisible,
  setDatePickerVisibility,
  onToggle,
}) => {
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

  const getAvailableMumukshus = (currentGroupIndex: number) => {
    // Get all selected mumukshu indices from other groups
    const selectedIndices = foodForm.mumukshuGroup.reduce(
      (acc: string[], group: any, idx: number) => {
        if (idx !== currentGroupIndex) {
          return [...acc, ...group.mumukshuIndices];
        }
        return acc;
      },
      []
    );

    // Filter out mumukshus that are already selected in other groups
    return mumukshu_dropdown.filter((mumukshu: any) => !selectedIndices.includes(mumukshu.value));
  };

  const hasAvailableMumukshus = () => {
    // Get all selected mumukshu indices from all groups
    const selectedIndices = foodForm.mumukshuGroup.flatMap((group: any) => group.mumukshuIndices);
    // Check if there are any unselected mumukshus
    return mumukshu_dropdown.some((mumukshu: any) => !selectedIndices.includes(mumukshu.value));
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
        minimumDate={foodForm.startDay ? moment(foodForm.startDay).toDate() : undefined}
      />

      {foodForm.mumukshuGroup.map((assignment: any, index: any) => (
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
            label={`Mumukshu group - ${index + 1}`}
            placeholder="Select Mumukshus"
            options={getAvailableMumukshus(index)}
            selectedValues={assignment.mumukshuIndices}
            onValuesChange={(val) => updateFoodForm(index, 'mumukshus', val)}
            multiSelect={true}
            confirmButtonText="Select"
          />

          <CustomSelectBottomSheet
            className="mt-5"
            label="Select Meals"
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
          !hasAvailableMumukshus() ? 'opacity-50' : ''
        }`}
        onPress={hasAvailableMumukshus() ? addFoodForm : undefined}
        disabled={!hasAvailableMumukshus()}>
        <Image
          source={icons.addon}
          tintColor={colors.black}
          className="h-4 w-4"
          resizeMode="contain"
        />
        <Text className="text-base text-black underline">Add More Mumukshus</Text>
      </TouchableOpacity>
    </AddonItem>
  );
};

export default MumukshuFoodAddon;
