import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { icons, dropdowns } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import CustomDropdown from '../CustomDropdown';
import AddonItem from '../AddonItem';
import FormDisplayField from '../FormDisplayField';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';

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
      <TouchableOpacity
        onPress={() =>
          setDatePickerVisibility({
            ...isDatePickerVisible,
            checkin: true,
          })
        }>
        <FormDisplayField
          text="Checkin Date"
          value={
            roomForm.startDay ? moment(roomForm.startDay).format('Do MMMM YYYY') : 'Checkin Date'
          }
          otherStyles="mt-5"
          backgroundColor="bg-gray-100"
        />
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isDatePickerVisible.checkin}
        mode="date"
        onConfirm={(date: any) => {
          if (isNaN(date)) date = moment().add(1, 'days').toDate();
          setRoomForm({
            ...roomForm,
            startDay:
              moment(date).toDate() < moment().add(1, 'days').toDate()
                ? moment().add(1, 'days').format('YYYY-MM-DD')
                : moment(date).format('YYYY-MM-DD'),
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

      <TouchableOpacity
        disabled={roomForm.startDay === ''}
        onPress={() =>
          setDatePickerVisibility({
            ...isDatePickerVisible,
            checkout: true,
          })
        }>
        <FormDisplayField
          text="Checkout Date"
          value={roomForm.endDay ? moment(roomForm.endDay).format('Do MMMM YYYY') : 'Checkout Date'}
          otherStyles="mt-5"
          backgroundColor="bg-gray-100"
        />
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isDatePickerVisible.checkout}
        mode="date"
        onConfirm={(date: any) => {
          if (isNaN(date)) date = moment(roomForm.startDay).toDate();
          setRoomForm({
            ...roomForm,
            endDay:
              moment(date).toDate() < moment().add(1, 'days').toDate()
                ? moment().add(1, 'days').format('YYYY-MM-DD')
                : moment(date).format('YYYY-MM-DD'),
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
        minimumDate={moment(roomForm.startDay).toDate()}
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
