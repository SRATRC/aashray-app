import { View, Text, Image, TouchableOpacity } from 'react-native';
import { colors, icons, dropdowns } from '../../constants';
import CustomDropdown from '../CustomDropdown';
import moment from 'moment';
import AddonItem from '../AddonItem';
import CustomMultiSelectDropdown from '../CustomMultiSelectDropdown';
import HorizontalSeparator from '../HorizontalSeparator';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import FormDisplayField from '../FormDisplayField';
import { useEffect, useState } from 'react';
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
  setDatePickerVisibility: any;
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
        minimumDate={moment().add(1, 'days').toDate()}
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
          <CustomMultiSelectDropdown
            otherStyles="mt-5"
            text={`Mumukshus group - ${index + 1}`}
            placeholder="Select Mumukshus"
            data={getAvailableMumukshus(index)}
            value={assignment.mumukshuIndices}
            setSelected={(val: any) => updateFoodForm(index, 'mumukshus', val)}
            guest={true}
          />

          <CustomMultiSelectDropdown
            otherStyles="mt-5"
            text={`Select Meals`}
            placeholder="Select Meals"
            data={dropdowns.GUEST_FOOD_TYPE_LIST}
            value={assignment.meals}
            setSelected={(val: any) => updateFoodForm(index, 'meals', val)}
            guest={true}
          />

          <CustomDropdown
            otherStyles="mt-5 w-full px-1"
            text={'Spice Level'}
            placeholder={'How much spice do you want?'}
            data={dropdowns.SPICE_LIST}
            setSelected={(val: any) => updateFoodForm(index, 'spicy', val)}
            value={assignment.spicy}
            defaultOption={dropdowns.SPICE_LIST[0]}
          />

          <CustomDropdown
            otherStyles="mt-5 w-full px-1"
            text={'Hightea'}
            placeholder={'Hightea'}
            data={dropdowns.HIGHTEA_LIST}
            value={assignment.hightea}
            setSelected={(val: any) => updateFoodForm(index, 'hightea', val)}
            defaultOption={dropdowns.HIGHTEA_LIST[2]}
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
