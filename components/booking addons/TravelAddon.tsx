import { View, Text, Image, TouchableOpacity } from 'react-native';
import { icons, colors, dropdowns } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import CustomDropdown from '../CustomDropdown';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import FormField from '../FormField';
import AddonItem from '../AddonItem';
import moment from 'moment';
import FormDisplayField from '../FormDisplayField';

interface TravelAddonProps {
  travelForm: any;
  setTravelForm: any;
  isDatePickerVisible: any;
  setDatePickerVisibility: any;
}

const TravelAddon: React.FC<TravelAddonProps> = ({
  travelForm,
  setTravelForm,
  isDatePickerVisible,
  setDatePickerVisibility,
}) => {
  const { setData } = useGlobalContext();
  return (
    <AddonItem
      onCollapse={() => {
        setTravelForm({
          date: '',
          pickup: '',
          drop: '',
          luggage: '',
          type: 'regular',
          special_request: '',
        });
        setData((prev: any) => {
          const { travel, ...rest } = prev;
          return rest;
        });
      }}
      visibleContent={
        <View className="flex flex-row items-center gap-x-4">
          <Image source={icons.travel} className="h-10 w-10" resizeMode="contain" />
          <Text className="font-pmedium">Raj Pravas Booking</Text>
        </View>
      }
      containerStyles={'mt-3'}>
      <TouchableOpacity
        onPress={() =>
          setDatePickerVisibility({
            ...isDatePickerVisible,
            travel: true,
          })
        }>
        <FormDisplayField
          text="Date"
          value={travelForm.date ? moment(travelForm.date).format('Do MMMM YYYY') : 'Date'}
          otherStyles="mt-7"
          backgroundColor="bg-gray-100"
        />
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isDatePickerVisible.travel}
        mode="date"
        onConfirm={(date: any) => {
          if (isNaN(date)) date = moment().add(1, 'days').toDate();

          setTravelForm({
            ...travelForm,
            date:
              moment(date).toDate() < moment().add(1, 'days').toDate()
                ? moment().add(1, 'days').format('YYYY-MM-DD')
                : moment(date).format('YYYY-MM-DD'),
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

      <CustomDropdown
        otherStyles="mt-7"
        text={'Pickup Location'}
        placeholder={'Select Location'}
        data={dropdowns.LOCATION_LIST}
        setSelected={(val: any) =>
          setTravelForm({
            ...travelForm,
            pickup: val,
          })
        }
        boxbg={colors.gray_100}
      />

      <CustomDropdown
        otherStyles="mt-7"
        text={'Drop Location'}
        placeholder={'Select Location'}
        data={dropdowns.LOCATION_LIST}
        setSelected={(val: any) =>
          setTravelForm({
            ...travelForm,
            drop: val,
          })
        }
        boxbg={colors.gray_100}
      />

      <CustomDropdown
        otherStyles="mt-7"
        text={'Luggage'}
        placeholder={'Select any luggage'}
        data={dropdowns.LUGGAGE_LIST}
        save={'value'}
        setSelected={(val: any) => setTravelForm({ ...travelForm, luggage: val })}
      />

      <CustomDropdown
        otherStyles="mt-7"
        text={'Booking Type'}
        placeholder={'Select booking type'}
        data={dropdowns.BOOKING_TYPE_LIST}
        save={'value'}
        defaultOption={{ key: 'regular', value: 'Regular' }}
        setSelected={(val: any) => setTravelForm({ ...travelForm, type: val })}
      />

      <FormField
        text="Any Special Request?"
        value={travelForm.special_request}
        handleChangeText={(e: any) =>
          setTravelForm({
            ...travelForm,
            special_request: e,
          })
        }
        otherStyles="mt-7"
        containerStyles="bg-gray-100"
        keyboardType="default"
        placeholder="please specify your request here..."
      />
    </AddonItem>
  );
};

export default TravelAddon;
