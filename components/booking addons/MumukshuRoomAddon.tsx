import { View, Text, Image, TouchableOpacity } from 'react-native';
import { colors, icons, dropdowns } from '../../constants';
import CustomDropdown from '../CustomDropdown';
import moment from 'moment';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AddonItem from '../AddonItem';
import CustomMultiSelectDropdown from '../CustomMultiSelectDropdown';
import HorizontalSeparator from '../HorizontalSeparator';
import FormDisplayField from '../FormDisplayField';

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
