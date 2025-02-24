import { View, Text, Image, TouchableOpacity } from 'react-native';
import { colors, icons, dropdowns } from '../../constants';
import CustomDropdown from '../CustomDropdown';
import moment from 'moment';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AddonItem from '../AddonItem';
import CustomMultiSelectDropdown from '../CustomMultiSelectDropdown';
import HorizontalSeparator from '../HorizontalSeparator';
import FormDisplayField from '../FormDisplayField';
import { useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

interface MumukshuRoomAddonProps {
  roomForm: any;
  setRoomForm: any;
  addRoomForm: any;
  updateRoomForm: any;
  resetRoomForm: any;
  reomveRoomForm: any;
  mumukshu_dropdown: any;
  isDatePickerVisible: any;
  setDatePickerVisibility: any;
}

const MumukshuRoomAddon: React.FC<MumukshuRoomAddonProps> = ({
  roomForm,
  setRoomForm,
  addRoomForm,
  updateRoomForm,
  resetRoomForm,
  reomveRoomForm,
  mumukshu_dropdown,
  isDatePickerVisible,
  setDatePickerVisibility,
}) => {
  // Temporary state to hold the date for the checkin picker
  const [tempCheckinDate, setTempCheckinDate] = useState(new Date());

  // When the checkin picker is opened, initialize the temporary date
  useEffect(() => {
    if (isDatePickerVisible.checkin) {
      setTempCheckinDate(
        roomForm.startDay ? moment(roomForm.startDay).toDate() : moment().add(1, 'days').toDate()
      );
    }
  }, [isDatePickerVisible.checkin]);

  return (
    <AddonItem
      onCollapse={resetRoomForm}
      visibleContent={
        <View className="flex flex-row items-center gap-x-4">
          <Image source={icons.room} className="h-10 w-10" resizeMode="contain" />
          <Text className="font-pmedium">Raj Sharan Booking</Text>
        </View>
      }
      containerStyles={'mt-3'}>
      <FormDisplayField
        text="Checkin Date"
        value={
          roomForm.startDay ? moment(roomForm.startDay).format('Do MMMM YYYY') : 'Checkin Date'
        }
        otherStyles="mt-5"
        backgroundColor="bg-gray-100"
        onPress={() =>
          setDatePickerVisibility({
            ...isDatePickerVisible,
            checkin: true,
          })
        }
      />
      <DateTimePickerModal
        isVisible={isDatePickerVisible.checkin}
        mode="date"
        date={tempCheckinDate}
        onConfirm={(date: any) => {
          // Ensure the selected date isn't before tomorrow
          const selectedMoment = moment(date);
          const tomorrow = moment().add(1, 'days');
          const validDate = selectedMoment.isBefore(tomorrow) ? tomorrow : selectedMoment;

          setRoomForm({
            ...roomForm,
            startDay: validDate.format('YYYY-MM-DD'),
            endDay: null,
          });
          setDatePickerVisibility({
            ...isDatePickerVisible,
            checkin: false,
          });
        }}
        onCancel={() =>
          setDatePickerVisibility({
            ...isDatePickerVisible,
            checkin: false,
          })
        }
        minimumDate={moment().add(1, 'days').toDate()}
      />

      <FormDisplayField
        text="Checkout Date"
        value={roomForm.endDay ? moment(roomForm.endDay).format('Do MMMM YYYY') : 'Checkout Date'}
        otherStyles="mt-5"
        backgroundColor="bg-gray-100"
        onPress={() => {
          if (roomForm.startDay) {
            setDatePickerVisibility({
              ...isDatePickerVisible,
              checkout: true,
            });
          } else {
            Toast.show({
              type: 'info',
              text1: 'Please select check-in date first',
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        }}
      />
      <DateTimePickerModal
        isVisible={isDatePickerVisible.checkout}
        mode="date"
        date={roomForm.endDay ? moment(roomForm.endDay).toDate() : new Date()}
        onConfirm={(date: Date) => {
          setRoomForm({
            ...roomForm,
            endDay: moment(date).format('YYYY-MM-DD'),
          });
          setDatePickerVisibility({
            ...isDatePickerVisible,
            checkout: false,
          });
        }}
        onCancel={() =>
          setDatePickerVisibility({
            ...isDatePickerVisible,
            checkout: false,
          })
        }
        minimumDate={
          roomForm.startDay ? moment(roomForm.startDay).add(1, 'days').toDate() : undefined
        }
      />

      {roomForm.mumukshuGroup.map((assignment: any, index: any) => (
        <View key={index} style={{ marginBottom: 15 }}>
          {index > 0 && (
            <View>
              <HorizontalSeparator otherStyles={'w-full mt-3'} />
              <TouchableOpacity
                onPress={reomveRoomForm(index)}
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
            text={`Mumukshus for Room ${index + 1}`}
            placeholder="Select Mumukshus"
            data={mumukshu_dropdown}
            value={assignment.mumukshuIndices}
            setSelected={(val: any) => updateRoomForm(index, 'mumukshus', val)}
            guest={true}
          />

          <CustomDropdown
            otherStyles="mt-5"
            text="Room Type"
            placeholder="Select Room Type"
            data={dropdowns.ROOM_TYPE_LIST}
            setSelected={(val: any) => updateRoomForm(index, 'roomType', val)}
          />

          <CustomDropdown
            otherStyles="mt-5"
            text="Floor Type"
            placeholder="Select Floor Type"
            data={dropdowns.FLOOR_TYPE_LIST}
            setSelected={(val: any) => updateRoomForm(index, 'floorType', val)}
          />
        </View>
      ))}

      <TouchableOpacity
        className="mt-4 w-full flex-row items-center justify-start gap-x-1"
        onPress={addRoomForm}>
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

export default MumukshuRoomAddon;
