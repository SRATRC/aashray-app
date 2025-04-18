import React, { useEffect, useState } from 'react';
import { View, Text, Image } from 'react-native';
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
        setTravelForm({
          date: '',
          pickup: '',
          drop: '',
          arrival_time: '',
          luggage: '',
          adhyayan: 0,
          type: dropdowns.BOOKING_TYPE_LIST[0].value,
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
        save={'value'}
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
        save={'value'}
      />

      {(travelForm.pickup &&
        dropdowns.LOCATION_LIST.find(
          (loc) =>
            loc.value === travelForm.pickup &&
            (loc.value.toLowerCase().includes('railway') ||
              loc.value.toLowerCase().includes('airport'))
        )) ||
      (travelForm.drop &&
        dropdowns.LOCATION_LIST.find(
          (loc) =>
            loc.value === travelForm.drop &&
            (loc.value.toLowerCase().includes('railway') ||
              loc.value.toLowerCase().includes('airport'))
        )) ? (
        <>
          <FormDisplayField
            text="Flight/Train Time"
            value={
              travelForm.arrival_time
                ? moment(travelForm.time).format('Do MMMM YYYY, h:mm a')
                : 'Flight/Train Time'
            }
            otherStyles="mt-5"
            inputStyles={'font-pmedium text-gray-400 text-lg'}
            backgroundColor="bg-gray-100"
            onPress={() =>
              setDatePickerVisibility({
                ...isDatePickerVisible,
                travel_time: true,
              })
            }
          />
          <DateTimePickerModal
            isVisible={isDatePickerVisible.travel_time}
            mode="datetime"
            date={travelForm.arrival_time ? moment(travelForm.arrival_time).toDate() : new Date()}
            onConfirm={(date: Date) => {
              setTravelForm((prev: any) => ({
                ...prev,
                arrival_time: date.toISOString(),
              }));
              setDatePickerVisibility({
                ...isDatePickerVisible,
                travel_time: false,
              });
            }}
            onCancel={() =>
              setDatePickerVisibility({
                ...isDatePickerVisible,
                travel_time: false,
              })
            }
            minimumDate={
              travelForm.arrival_time ? moment(travelForm.arrival_time).toDate() : moment().toDate()
            }
          />
        </>
      ) : null}

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
        text={'Leaving post adhyayan?'}
        placeholder={'Leaving post adhyayan?'}
        data={dropdowns.TRAVEL_ADHYAYAN_ASK_LIST}
        setSelected={(val: any) => setTravelForm({ ...travelForm, adhyayan: val })}
        defaultOption={{ key: 0, value: 'No' }}
      />

      <CustomDropdown
        otherStyles="mt-7"
        text={'Booking Type'}
        placeholder={'Select booking type'}
        data={dropdowns.BOOKING_TYPE_LIST}
        save={'value'}
        defaultOption={dropdowns.BOOKING_TYPE_LIST[0]}
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
