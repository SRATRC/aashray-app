import { View, Text } from 'react-native';
import React, { useState, useCallback, useEffect } from 'react';
import { types, dropdowns, status } from '../../constants';
import { useRouter } from 'expo-router';
import { useGlobalContext } from '../../context/GlobalProvider';
import CustomDropdown from '../CustomDropdown';
import CustomButton from '../CustomButton';
import CustomCalender from '../CustomCalender';
import FormField from '../FormField';
import CustomModal from '../CustomModal';
import CustomChipGroup from '../CustomChipGroup';
import OtherMumukshuForm from '../OtherMumukshuForm';
import FormDisplayField from '../FormDisplayField';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';

let CHIPS = ['Self', 'Mumukshus'];

const INITIAL_MUMUKSHU_FORM = {
  date: '',
  mumukshus: [
    {
      cardno: '',
      mobno: '',
      pickup: '',
      drop: '',
      luggage: '',
      adhyayan: 0,
      type: 'regular',
      special_request: '',
      arrival_time: '',
    },
  ],
};

const TravelBooking = () => {
  const router = useRouter();
  const { user, updateBooking, updateMumukshuBooking } = useGlobalContext();

  if (user.res_status == status.STATUS_GUEST) {
    CHIPS = ['Self'];
  }

  useEffect(
    useCallback(() => {
      setIsSubmitting(false);
    }, [])
  );

  const [selectedChip, setSelectedChip] = useState('Self');
  const handleChipClick = (chip: any) => {
    setSelectedChip(chip);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [activeMumukshuIndex, setActiveMumukshuIndex] = useState(null);

  const [travelForm, setTravelForm] = useState({
    date: '',
    pickup: '',
    drop: '',
    arrival_time: '',
    luggage: '',
    adhyayan: 0,
    type: 'regular',
    special_request: '',
  });

  const isSelfFormValid = () => {
    const requiresTime =
      (travelForm.pickup &&
        dropdowns.LOCATION_LIST.find(
          (loc: { value: string }) =>
            loc.value === travelForm.pickup &&
            (loc.value.toLowerCase().includes('railway') ||
              loc.value.toLowerCase().includes('airport'))
        )) ||
      (travelForm.drop &&
        dropdowns.LOCATION_LIST.find(
          (loc: { value: string }) =>
            loc.value === travelForm.drop &&
            (loc.value.toLowerCase().includes('railway') ||
              loc.value.toLowerCase().includes('airport'))
        ));

    return (
      travelForm.date &&
      travelForm.pickup &&
      travelForm.drop &&
      travelForm.luggage &&
      travelForm.type &&
      (!requiresTime || (requiresTime && travelForm.arrival_time)) &&
      !(
        (travelForm.pickup == dropdowns.LOCATION_LIST[0].value &&
          travelForm.drop == dropdowns.LOCATION_LIST[0].value) ||
        (travelForm.pickup != dropdowns.LOCATION_LIST[0].value &&
          travelForm.drop != dropdowns.LOCATION_LIST[0].value)
      )
    );
  };

  const [mumukshuForm, setMumukshuForm] = useState(INITIAL_MUMUKSHU_FORM);

  const addMumukshuForm = () => {
    setMumukshuForm((prev) => ({
      ...prev,
      mumukshus: [
        ...prev.mumukshus,
        {
          cardno: '',
          mobno: '',
          pickup: '',
          drop: '',
          luggage: '',
          adhyayan: 0,
          type: 'regular',
          special_request: '',
          arrival_time: '',
        },
      ],
    }));
  };

  const removeMumukshuForm = (indexToRemove: any) => {
    setMumukshuForm((prev) => ({
      ...prev,
      mumukshus: prev.mumukshus.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleMumukshuFormChange = (index: any, key: any, value: any) => {
    setMumukshuForm((prev) => ({
      ...prev,
      mumukshus: prev.mumukshus.map((mumukshu, i) =>
        i === index ? { ...mumukshu, [key]: value } : mumukshu
      ),
    }));
  };

  const isMumukshuFormValid = () => {
    return (
      mumukshuForm.date &&
      mumukshuForm.mumukshus.every((mumukshu) => {
        const requiresTime =
          (mumukshu.pickup &&
            dropdowns.LOCATION_LIST.find(
              (loc) =>
                loc.value === mumukshu.pickup &&
                (loc.key.toLowerCase().includes('railway') ||
                  loc.key.toLowerCase().includes('airport'))
            )) ||
          (mumukshu.drop &&
            dropdowns.LOCATION_LIST.find(
              (loc) =>
                loc.value === mumukshu.drop &&
                (loc.key.toLowerCase().includes('railway') ||
                  loc.key.toLowerCase().includes('airport'))
            ));
        return (
          mumukshu.mobno?.length === 10 &&
          mumukshu.cardno &&
          mumukshu.pickup &&
          mumukshu.drop &&
          mumukshu.luggage &&
          mumukshu.type &&
          (!requiresTime || (requiresTime && mumukshu.arrival_time)) &&
          !(
            (mumukshu.pickup === dropdowns.LOCATION_LIST[0].value &&
              mumukshu.drop === dropdowns.LOCATION_LIST[0].value) ||
            (mumukshu.pickup !== dropdowns.LOCATION_LIST[0].value &&
              mumukshu.drop !== dropdowns.LOCATION_LIST[0].value)
          )
        );
      })
    );
  };

  return (
    <View className="w-full flex-1">
      <CustomCalender
        selectedDay={travelForm.date}
        setSelectedDay={(day: any) => {
          setTravelForm((prev) => ({ ...prev, date: day }));
          setMumukshuForm((prev) => ({ ...prev, date: day }));
        }}
      />

      <View className="mt-7 flex w-full flex-col">
        <Text className="font-pmedium text-base text-gray-600">Book for</Text>
        <CustomChipGroup
          chips={CHIPS}
          selectedChip={selectedChip}
          handleChipPress={handleChipClick}
          containerStyles={'mt-1'}
          chipContainerStyles={'py-2'}
          textStyles={'text-sm'}
        />
      </View>

      {selectedChip == CHIPS[0] && (
        <View>
          <CustomDropdown
            otherStyles="mt-7"
            text={'Pickup Location'}
            placeholder={'Select Location'}
            save={'value'}
            data={dropdowns.LOCATION_LIST}
            setSelected={(val: any) => setTravelForm({ ...travelForm, pickup: val })}
          />
          <CustomDropdown
            otherStyles="mt-7"
            text={'Drop Location'}
            placeholder={'Select Location'}
            data={dropdowns.LOCATION_LIST}
            save={'value'}
            setSelected={(val: any) => setTravelForm({ ...travelForm, drop: val })}
          />
          {(travelForm.pickup &&
            dropdowns.LOCATION_LIST.find(
              (loc: { value: string }) =>
                loc.value === travelForm.pickup &&
                (loc.value.toLowerCase().includes('railway') ||
                  loc.value.toLowerCase().includes('airport'))
            )) ||
          (travelForm.drop &&
            dropdowns.LOCATION_LIST.find(
              (loc: { value: string }) =>
                loc.value === travelForm.drop &&
                (loc.value.toLowerCase().includes('railway') ||
                  loc.value.toLowerCase().includes('airport'))
            )) ? (
            <>
              <FormDisplayField
                text="Flight/Train Time"
                value={
                  travelForm.arrival_time
                    ? moment(travelForm.arrival_time).format('Do MMMM YYYY, h:mm a')
                    : 'Flight/Train Time'
                }
                otherStyles="mt-5"
                inputStyles={'font-pmedium text-gray-400 text-lg'}
                backgroundColor="bg-gray-100"
                onPress={() => setDatePickerVisibility(true)}
              />
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="datetime"
                date={
                  travelForm.arrival_time ? moment(travelForm.arrival_time).toDate() : new Date()
                }
                onConfirm={(date: Date) => {
                  setTravelForm((prev) => ({
                    ...prev,
                    arrival_time: date.toISOString(),
                  }));
                  setDatePickerVisibility(false);
                }}
                onCancel={() => setDatePickerVisibility(false)}
                minimumDate={
                  travelForm.arrival_time
                    ? moment(travelForm.arrival_time).toDate()
                    : moment().toDate()
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
            defaultOption={{ key: 'regular', value: 'Regular' }}
            setSelected={(val: any) => setTravelForm({ ...travelForm, type: val })}
          />
          <FormField
            text="Any Special Request?"
            value={travelForm.special_request}
            handleChangeText={(e: any) => setTravelForm({ ...travelForm, special_request: e })}
            otherStyles="mt-7"
            containerStyles="bg-gray-100"
            keyboardType="default"
            placeholder="please specify your request here..."
            inputStyles={'font-pmedium text-gray-400 text-lg'}
          />
        </View>
      )}

      {selectedChip == CHIPS[1] && (
        <View>
          <OtherMumukshuForm
            mumukshuForm={mumukshuForm}
            setMumukshuForm={setMumukshuForm}
            handleMumukshuFormChange={handleMumukshuFormChange}
            addMumukshuForm={addMumukshuForm}
            removeMumukshuForm={removeMumukshuForm}>
            {(index: any) => (
              <>
                <CustomDropdown
                  otherStyles="mt-7"
                  text={'Pickup Location'}
                  placeholder={'Select Location'}
                  data={dropdowns.LOCATION_LIST}
                  setSelected={(val: any) => handleMumukshuFormChange(index, 'pickup', val)}
                  save={'value'}
                />
                <CustomDropdown
                  otherStyles="mt-7"
                  text={'Drop Location'}
                  placeholder={'Select Location'}
                  data={dropdowns.LOCATION_LIST}
                  setSelected={(val: any) => handleMumukshuFormChange(index, 'drop', val)}
                  save={'value'}
                />
                {(mumukshuForm.mumukshus[index].pickup &&
                  dropdowns.LOCATION_LIST.find(
                    (loc) =>
                      loc.value === mumukshuForm.mumukshus[index].pickup &&
                      (loc.key.toLowerCase().includes('railway') ||
                        loc.key.toLowerCase().includes('airport'))
                  )) ||
                (mumukshuForm.mumukshus[index].drop &&
                  dropdowns.LOCATION_LIST.find(
                    (loc) =>
                      loc.value === mumukshuForm.mumukshus[index].drop &&
                      (loc.key.toLowerCase().includes('railway') ||
                        loc.key.toLowerCase().includes('airport'))
                  )) ? (
                  <>
                    <FormDisplayField
                      text="Flight/Train Time"
                      value={
                        mumukshuForm.mumukshus[index].arrival_time
                          ? moment(mumukshuForm.mumukshus[index].arrival_time).format(
                              'Do MMMM YYYY, h:mm a'
                            )
                          : 'Flight/Train Time'
                      }
                      otherStyles="mt-5"
                      inputStyles={'font-pmedium text-gray-400 text-lg'}
                      backgroundColor="bg-gray-100"
                      onPress={() => {
                        setDatePickerVisibility(true);
                        setActiveMumukshuIndex(index);
                      }}
                    />
                    <DateTimePickerModal
                      isVisible={isDatePickerVisible && activeMumukshuIndex === index}
                      mode="datetime"
                      date={
                        mumukshuForm.mumukshus[index].arrival_time
                          ? moment(mumukshuForm.mumukshus[index].arrival_time).toDate()
                          : new Date()
                      }
                      onConfirm={(date: Date) => {
                        handleMumukshuFormChange(index, 'arrival_time', date.toISOString());
                        setDatePickerVisibility(false);
                      }}
                      onCancel={() => setDatePickerVisibility(false)}
                      minimumDate={
                        mumukshuForm.mumukshus[index].arrival_time
                          ? moment(mumukshuForm.mumukshus[index].arrival_time).toDate()
                          : moment().toDate()
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
                  setSelected={(val: any) => handleMumukshuFormChange(index, 'luggage', val)}
                />
                <CustomDropdown
                  otherStyles="mt-7"
                  text={'Leaving post adhyayan?'}
                  placeholder={'Leaving post adhyayan?'}
                  data={dropdowns.TRAVEL_ADHYAYAN_ASK_LIST}
                  setSelected={(val: any) => handleMumukshuFormChange(index, 'adhyayan', val)}
                  defaultOption={{ key: 0, value: 'No' }}
                />
                <CustomDropdown
                  otherStyles="mt-7"
                  text={'Booking Type'}
                  placeholder={'Select booking type'}
                  data={dropdowns.BOOKING_TYPE_LIST}
                  defaultOption={{ key: 'regular', value: 'Regular' }}
                  save={'value'}
                  setSelected={(val: any) => handleMumukshuFormChange(index, 'type', val)}
                />

                <FormField
                  text="Any Special Request?"
                  value={mumukshuForm.mumukshus[index].special_request}
                  handleChangeText={(e: any) =>
                    handleMumukshuFormChange(index, 'special_request', e)
                  }
                  otherStyles="mt-7"
                  containerStyles="bg-gray-100"
                  keyboardType="default"
                  placeholder="please specify your request here..."
                  inputStyles={'font-pmedium text-gray-400 text-lg'}
                />
              </>
            )}
          </OtherMumukshuForm>
        </View>
      )}
      <CustomButton
        text="Book Now"
        handlePress={async () => {
          setIsSubmitting(true);
          if (selectedChip == CHIPS[0]) {
            if (!isSelfFormValid()) {
              setModalVisible(true);
              setModalMessage('Please fill all fields');
              setIsSubmitting(false);
              return;
            }

            await updateBooking('travel', travelForm);
            router.push(`/booking/${types.TRAVEL_DETAILS_TYPE}`);
          }
          if (selectedChip == CHIPS[1]) {
            if (!isMumukshuFormValid()) {
              setModalVisible(true);
              setModalMessage('Please fill all fields');
              setIsSubmitting(false);
              return;
            }
            const temp = transformMumukshuData(mumukshuForm);
            await updateMumukshuBooking('travel', temp);
            router.push(`/mumukshuBooking/${types.TRAVEL_DETAILS_TYPE}`);
          }
        }}
        containerStyles="mt-7 w-full px-1 min-h-[62px]"
        isLoading={isSubmitting}
        isDisabled={selectedChip == CHIPS[0] ? !isSelfFormValid() : !isMumukshuFormValid()}
      />
      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        message={modalMessage}
        btnText={'Okay'}
      />
    </View>
  );
};

function transformMumukshuData(inputData: any) {
  const { date, mumukshus } = inputData;

  const groupedMumukshus = mumukshus.reduce((acc: any, mumukshu: any, index: any) => {
    const key = `${mumukshu.pickup}-${mumukshu.drop}`;
    if (!acc[key]) {
      acc[key] = {
        pickup: mumukshu.pickup,
        drop: mumukshu.drop,
        mumukshus: [],
      };
    }
    acc[key].mumukshus.push(mumukshu);

    return acc;
  }, {});

  const mumukshuGroup = Object.values(groupedMumukshus);

  return {
    date: date,
    mumukshuGroup: mumukshuGroup,
  };
}

export default TravelBooking;
