import { View, Text, Image, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useGlobalContext } from '../../context/GlobalProvider';
import { colors, icons, dropdowns } from '../../constants';
import CustomDropdown from '../CustomDropdown';
import moment from 'moment';
import AddonItem from '../AddonItem';
import CustomMultiSelectDropdown from '../CustomMultiSelectDropdown';
import HorizontalSeparator from '../HorizontalSeparator';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import FormDisplayField from '../FormDisplayField';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

interface GuestRoomAddonProps {
  roomForm: any;
  setRoomForm: any;
  addRoomForm: any;
  updateRoomForm: any;
  reomveRoomForm: any;
  guest_dropdown: any;
  INITIAL_ROOM_FORM: any;
  isDatePickerVisible: any;
  setDatePickerVisibility: any;
}

const GuestRoomAddon: React.FC<GuestRoomAddonProps> = ({
  roomForm,
  setRoomForm,
  addRoomForm,
  updateRoomForm,
  reomveRoomForm,
  guest_dropdown,
  INITIAL_ROOM_FORM,
  isDatePickerVisible,
  setDatePickerVisibility,
}) => {
  const { setGuestData } = useGlobalContext();

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

  // Function to get available guests for a specific group index
  const getAvailableGuests = (currentGroupIndex: number) => {
    // Get all selected guest indices from other groups
    const selectedIndices = roomForm.guestGroup.reduce((acc: number[], group: any, idx: number) => {
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
    const selectedIndices = roomForm.guestGroup.flatMap((group: any) => group.guestIndices);
    // Check if there are any unselected guests
    return guest_dropdown.some((guest: any) => !selectedIndices.includes(guest.value));
  };

  return (
    <AddonItem
      onCollapse={() => {
        setRoomForm(INITIAL_ROOM_FORM);
        setGuestData((prev: any) => {
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
        onConfirm={(date: any) => {
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
        minimumDate={
          roomForm.startDay ? moment(roomForm.startDay).add(1, 'days').toDate() : undefined
        }
      />

      {roomForm.guestGroup.map((assignment: any, index: any) => (
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
            text={`Guests for Room ${index + 1}`}
            placeholder="Select Guests"
            data={getAvailableGuests(index)}
            value={assignment.guestIndices}
            setSelected={(val: any) => updateRoomForm(index, 'guests', val)}
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
        className={`mt-4 w-full flex-row items-center justify-start gap-x-1 ${
          !hasAvailableGuests() ? 'opacity-50' : ''
        }`}
        onPress={hasAvailableGuests() ? addRoomForm : undefined}
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

export default GuestRoomAddon;
