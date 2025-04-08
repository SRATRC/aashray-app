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

interface RoomAddonProps {
  roomForm: any;
  setRoomForm: any;
  isDatePickerVisible: any;
  setDatePickerVisibility: any;
}

const RoomAddon: React.FC<RoomAddonProps> = ({
  roomForm,
  setRoomForm,
  isDatePickerVisible,
  setDatePickerVisibility,
}) => {
  const { setData } = useGlobalContext();

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
      onCollapse={() => {
        setRoomForm({
          roomType: '',
          floorType: '',
          startDay: '',
          endDay: '',
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

      <CustomDropdown
        otherStyles="mt-7"
        text={'Room Type'}
        placeholder={'Select Room Type'}
        data={dropdowns.ROOM_TYPE_LIST}
        setSelected={(val: any) => setRoomForm({ ...roomForm, roomType: val })}
      />

      <CustomDropdown
        otherStyles="mt-7"
        text={'Book Only if Ground Floor is Available'}
        placeholder={'Select Floor Type'}
        data={dropdowns.FLOOR_TYPE_LIST}
        setSelected={(val: any) => setRoomForm({ ...roomForm, floorType: val })}
      />
    </AddonItem>
  );
};

export default RoomAddon;
