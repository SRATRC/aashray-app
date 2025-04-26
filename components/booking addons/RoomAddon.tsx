import React, { useState, useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { icons, dropdowns } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import CustomDropdown from '../CustomDropdown';
import AddonItem from '../AddonItem';
import FormDisplayField from '../FormDisplayField';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import CustomSelectBottomSheet from '../CustomSelectBottomSheet';

interface RoomAddonProps {
  roomForm: any;
  setRoomForm: any;
  isDatePickerVisible: any;
  setDatePickerVisibility: any;
  onToggle?: (isOpen: boolean) => void;
}

const RoomAddon: React.FC<RoomAddonProps> = ({
  roomForm,
  setRoomForm,
  isDatePickerVisible,
  setDatePickerVisibility,
  onToggle,
}) => {
  const { data, setData } = useGlobalContext();

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
      onToggle={onToggle}
      onCollapse={() => {
        setRoomForm({
          roomType: dropdowns.ROOM_TYPE_LIST[0].key,
          floorType: dropdowns.FLOOR_TYPE_LIST[0].key,
          startDay: data.travel?.date || (data.adhyayan && data.adhyayan[0]?.start_date) || '',
          endDay: (data.adhyayan && data.adhyayan[0]?.end_date) || '',
        });
        setData((prev: any) => {
          const { room, ...rest } = prev;
          return rest;
        });
      }}
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
        // Use the temporary state as the date prop
        date={tempCheckinDate}
        onConfirm={(date: Date) => {
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
              swipeable: false,
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
          const selectedMoment = moment(date);
          const tomorrow = moment(roomForm.startDay).add(1, 'days');
          const validDate = selectedMoment.isBefore(tomorrow) ? tomorrow : selectedMoment;

          setRoomForm({
            ...roomForm,
            endDay: moment(validDate).format('YYYY-MM-DD'),
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

      <CustomSelectBottomSheet
        className="mt-7"
        label="Room Type"
        placeholder="Select Room Type"
        options={dropdowns.ROOM_TYPE_LIST}
        selectedValue={roomForm.roomType}
        onValueChange={(val: any) => setRoomForm({ ...roomForm, roomType: val })}
      />

      <CustomSelectBottomSheet
        className="mt-7"
        label="Select Floor Type"
        placeholder="Select Floor Type"
        options={dropdowns.FLOOR_TYPE_LIST}
        selectedValue={roomForm.floorType}
        onValueChange={(val: any) => setRoomForm({ ...roomForm, floorType: val })}
      />
    </AddonItem>
  );
};

export default RoomAddon;
