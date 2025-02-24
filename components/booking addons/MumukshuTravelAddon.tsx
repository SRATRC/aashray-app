import { View, Text, Image, TouchableOpacity } from 'react-native';
import { icons, colors, dropdowns } from '../../constants';
import CustomDropdown from '../CustomDropdown';
import CustomMultiSelectDropdowm from '../CustomMultiSelectDropdown';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import FormField from '../FormField';
import AddonItem from '../AddonItem';
import moment from 'moment';
import HorizontalSeparator from '../HorizontalSeparator';
import FormDisplayField from '../FormDisplayField';
import { useEffect, useState } from 'react';

interface MumukshuTravelAddonProps {
  travelForm: any;
  setTravelForm: any;
  addTravelForm: any;
  updateTravelForm: any;
  resetTravelForm: any;
  removeTravelForm: any;
  mumukshu_dropdown: any;
  isDatePickerVisible: any;
  setDatePickerVisibility: any;
}

const MumukshuTravelAddon: React.FC<MumukshuTravelAddonProps> = ({
  travelForm,
  setTravelForm,
  addTravelForm,
  updateTravelForm,
  resetTravelForm,
  removeTravelForm,
  mumukshu_dropdown,
  isDatePickerVisible,
  setDatePickerVisibility,
}) => {
  // Temporary state to hold the date for the checkin picker
  const [tempTravelDate, setTempTravelDate] = useState(new Date());

  // When the checkin picker is opened, initialize the temporary date
  useEffect(() => {
    if (isDatePickerVisible.travel) {
      setTempTravelDate(
        travelForm.date ? moment(travelForm.date).toDate() : moment().add(1, 'days').toDate()
      );
    }
  }, [isDatePickerVisible.travel]);
  return (
    <AddonItem
      onCollapse={() => {
        resetTravelForm();
      }}
      visibleContent={
        <View className="flex flex-row items-center gap-x-4">
          <Image source={icons.travel} className="h-10 w-10" resizeMode="contain" />
          <Text className="font-pmedium">Raj Pravas Booking</Text>
        </View>
      }
      containerStyles={'mt-3'}>
      <FormDisplayField
        text="Date"
        value={travelForm.date ? moment(travelForm.date).format('Do MMMM YYYY') : 'Date'}
        otherStyles="mt-7"
        backgroundColor="bg-gray-100"
        onPress={() =>
          setDatePickerVisibility({
            ...isDatePickerVisible,
            travel: true,
          })
        }
      />

      <DateTimePickerModal
        isVisible={isDatePickerVisible.travel}
        mode="date"
        date={tempTravelDate}
        onConfirm={(date: Date) => {
          // Ensure the selected date isn't before tomorrow
          const selectedMoment = moment(date);
          const tomorrow = moment().add(1, 'days');
          const validDate = selectedMoment.isBefore(tomorrow) ? tomorrow : selectedMoment;

          setTravelForm({
            ...travelForm,
            date: validDate.format('YYYY-MM-DD'),
          });
          setDatePickerVisibility({
            ...isDatePickerVisible,
            travel: false,
          });
        }}
        onCancel={() =>
          setDatePickerVisibility({
            ...isDatePickerVisible,
            travel: false,
          })
        }
        minimumDate={moment().add(1, 'days').toDate()}
      />

      {travelForm.mumukshuGroup.map((assignment: any, index: any) => (
        <View key={index} style={{ marginBottom: 15 }}>
          {index > 0 && (
            <View>
              <HorizontalSeparator otherStyles={'w-full mt-3'} />
              <TouchableOpacity
                onPress={removeTravelForm(index)}
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
          <CustomMultiSelectDropdowm
            otherStyles="mt-5"
            text={`Mumukshus for Seat ${index + 1}`}
            placeholder="Select Mumukshus"
            data={mumukshu_dropdown}
            value={assignment.mumukshuIndices}
            setSelected={(val: any) => {
              updateTravelForm(index, 'mumukshus', val);
            }}
            guest={true}
          />

          <CustomDropdown
            otherStyles="mt-5"
            text={'Pickup Location'}
            placeholder={'Select Location'}
            data={dropdowns.LOCATION_LIST}
            setSelected={(val: any) => updateTravelForm(index, 'pickup', val)}
          />

          <CustomDropdown
            otherStyles="mt-5"
            text={'Drop Location'}
            placeholder={'Select Location'}
            data={dropdowns.LOCATION_LIST}
            setSelected={(val: any) => updateTravelForm(index, 'drop', val)}
          />

          <CustomDropdown
            otherStyles="mt-5"
            text={'Luggage'}
            placeholder={'Select any luggage'}
            data={dropdowns.LUGGAGE_LIST}
            setSelected={(val: any) => updateTravelForm(index, 'luggage', val)}
          />

          <CustomDropdown
            otherStyles="mt-5"
            text={'Booking Type'}
            placeholder={'Select booking type'}
            data={dropdowns.BOOKING_TYPE_LIST}
            setSelected={(val: any) => updateTravelForm(index, 'type', val)}
          />

          <FormField
            text="Any Special Request?"
            value={travelForm.special_request}
            handleChangeText={(e: any) => updateTravelForm(index, 'special_request', e)}
            otherStyles="mt-7"
            containerStyles="bg-gray-100"
            keyboardType="default"
            placeholder="please specify your request here..."
          />
        </View>
      ))}

      <TouchableOpacity
        className="mt-4 w-full flex-row items-center justify-start gap-x-1"
        onPress={addTravelForm}>
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

export default MumukshuTravelAddon;
