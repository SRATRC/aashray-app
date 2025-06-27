import { View, Text } from 'react-native';
import React, { useState, useCallback, useEffect } from 'react';
import { types, dropdowns, status } from '@/constants';
import { useRouter } from 'expo-router';
import { useGlobalContext } from '@/context/GlobalProvider';
import { useQuery } from '@tanstack/react-query';
import CustomButton from '../CustomButton';
import CustomCalender from '../CustomCalender';
import FormField from '../FormField';
import CustomModal from '../CustomModal';
import CustomChipGroup from '../CustomChipGroup';
import OtherMumukshuForm from '../OtherMumukshuForm';
import FormDisplayField from '../FormDisplayField';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import CustomSelectBottomSheet from '../CustomSelectBottomSheet';
import moment from 'moment';
import handleAPICall from '@/utils/HandleApiCall';

let CHIPS = ['Self', 'Mumukshus'];

const INITIAL_MUMUKSHU_FORM = {
  date: '',
  mumukshus: [
    {
      cardno: '',
      mobno: '',
      pickup: '',
      drop: '',
      luggage: [],
      adhyayan: dropdowns.TRAVEL_ADHYAYAN_ASK_LIST[1].value,
      type: dropdowns.BOOKING_TYPE_LIST[0].value,
      total_people: null,
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
    luggage: [],
    adhyayan: dropdowns.TRAVEL_ADHYAYAN_ASK_LIST[1].value,
    type: dropdowns.BOOKING_TYPE_LIST[0].value,
    total_people: null,
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

    if (travelForm.type == dropdowns.BOOKING_TYPE_LIST[1].value && !travelForm.total_people) {
      return false;
    }

    const requiresSpecialRequest = travelForm.pickup === 'Other' || travelForm.drop === 'Other';

    return (
      travelForm.date &&
      travelForm.pickup &&
      travelForm.drop &&
      travelForm.luggage.length > 0 &&
      travelForm.type &&
      (!requiresTime || (requiresTime && travelForm.arrival_time)) &&
      (!requiresSpecialRequest ||
        (requiresSpecialRequest && travelForm.special_request.trim() !== '')) &&
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
          luggage: [],
          adhyayan: dropdowns.TRAVEL_ADHYAYAN_ASK_LIST[1].value,
          type: dropdowns.BOOKING_TYPE_LIST[0].value,
          total_people: null,
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

        if (mumukshu.type == dropdowns.BOOKING_TYPE_LIST[1].value && !mumukshu.total_people) {
          return false;
        }

        const requiresSpecialRequest = mumukshu.pickup === 'Other' || mumukshu.drop === 'Other';

        return (
          mumukshu.mobno?.length === 10 &&
          mumukshu.cardno &&
          mumukshu.pickup &&
          mumukshu.drop &&
          mumukshu.luggage.length > 0 &&
          mumukshu.type &&
          (!requiresTime || (requiresTime && mumukshu.arrival_time)) &&
          (!requiresSpecialRequest ||
            (requiresSpecialRequest && mumukshu.special_request.trim() !== '')) &&
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

  const fetchUtsavs = async ({ pageParam = 1 }) => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/utsav/upcoming',
        {
          cardno: user.cardno,
          page: pageParam,
        },
        null,
        (res: any) => {
          resolve(Array.isArray(res.data) ? res.data : []);
        },
        () => reject(new Error('Failed to fetch utsavs'))
      );
    });
  };

  const { data: utsavData } = useQuery({
    queryKey: ['utsavs', user.cardno, travelForm.date],
    queryFn: () => fetchUtsavs({ pageParam: 1 }),
    staleTime: 1000 * 60 * 30,
    enabled: !!travelForm.date,
  });

  const isUtsavDate = useCallback(
    (selectedDate: string) => {
      if (!utsavData || !selectedDate) return false;

      const formattedDate = moment(selectedDate).format('YYYY-MM-DD');

      return utsavData.some((monthData: any) =>
        monthData.data.some(
          (utsav: any) => formattedDate === utsav.utsav_start || formattedDate === utsav.utsav_end
        )
      );
    },
    [utsavData]
  );

  const getLocationOptions = useCallback(
    (selectedDate: string) => {
      if (isUtsavDate(selectedDate)) {
        return dropdowns.EVENT_LOCATION_LIST;
      }
      return dropdowns.LOCATION_LIST;
    },
    [isUtsavDate]
  );

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
          <CustomSelectBottomSheet
            className="mt-7"
            label="Booking Type"
            placeholder="Booking Type"
            options={dropdowns.BOOKING_TYPE_LIST}
            selectedValue={travelForm.type}
            onValueChange={(val: any) => setTravelForm({ ...travelForm, type: val })}
            saveKeyInsteadOfValue={false}
          />

          {travelForm.type == dropdowns.BOOKING_TYPE_LIST[1].value && (
            <FormField
              text="Total People"
              value={travelForm.total_people}
              handleChangeText={(e: any) => setTravelForm({ ...travelForm, total_people: e })}
              otherStyles="mt-7"
              containerStyles="bg-gray-100"
              keyboardType="number-pad"
              placeholder="please specify total people here..."
              inputStyles={'font-pmedium text-black text-lg'}
            />
          )}

          <CustomSelectBottomSheet
            className="mt-7"
            label="Pickup Location"
            placeholder="Select Pickup Location"
            options={getLocationOptions(travelForm.date)}
            selectedValue={travelForm.pickup}
            onValueChange={(val: any) => setTravelForm({ ...travelForm, pickup: val })}
            saveKeyInsteadOfValue={false}
          />

          <CustomSelectBottomSheet
            className="mt-7"
            label="Drop Location"
            placeholder="Select Drop Location"
            options={getLocationOptions(travelForm.date)}
            selectedValue={travelForm.drop}
            onValueChange={(val: any) => setTravelForm({ ...travelForm, drop: val })}
            saveKeyInsteadOfValue={false}
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
                    ? moment(travelForm.arrival_time).format('h:mm a')
                    : 'Flight/Train Time'
                }
                otherStyles="mt-5"
                inputStyles={'font-pmedium text-black text-lg'}
                backgroundColor="bg-gray-100"
                onPress={() => setDatePickerVisibility(true)}
              />
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="time"
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
                minimumDate={travelForm.date ? moment(travelForm.date).toDate() : moment().toDate()}
              />
            </>
          ) : null}

          <CustomSelectBottomSheet
            className="mt-7"
            label="Luggage"
            placeholder="Select any Luggage"
            options={dropdowns.LUGGAGE_LIST}
            selectedValues={travelForm.luggage}
            onValuesChange={(val: any) => setTravelForm({ ...travelForm, luggage: val })}
            saveKeyInsteadOfValue={false}
            multiSelect={true}
            confirmButtonText="Select"
            maxSelectedDisplay={3}
          />

          {travelForm.pickup == dropdowns.LOCATION_LIST[0].value && (
            <CustomSelectBottomSheet
              className="mt-7"
              label="Leaving post adhyayan?"
              placeholder="Leaving post adhyayan?"
              options={dropdowns.TRAVEL_ADHYAYAN_ASK_LIST}
              selectedValue={travelForm.adhyayan}
              onValueChange={(val: any) => setTravelForm({ ...travelForm, adhyayan: val })}
              saveKeyInsteadOfValue={false}
            />
          )}

          <FormField
            text="Any Special Request?"
            value={travelForm.special_request}
            handleChangeText={(e: any) => setTravelForm({ ...travelForm, special_request: e })}
            otherStyles="mt-7"
            containerStyles="bg-gray-100"
            keyboardType="default"
            inputStyles={'font-pmedium text-black text-lg'}
            placeholder="Please specify a location if 'Other' is selected, or provide any additional requests here..."
            multiline={true}
            numberOfLines={2}
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
                <CustomSelectBottomSheet
                  className="mt-7"
                  label="Booking Type"
                  placeholder="Select Booking Type"
                  options={dropdowns.BOOKING_TYPE_LIST}
                  selectedValue={mumukshuForm.mumukshus[index].type}
                  onValueChange={(val: any) => handleMumukshuFormChange(index, 'type', val)}
                  saveKeyInsteadOfValue={false}
                />

                {mumukshuForm.mumukshus[index].type == dropdowns.BOOKING_TYPE_LIST[1].value && (
                  <FormField
                    text="Total People"
                    value={mumukshuForm.mumukshus[index].total_people}
                    handleChangeText={(e: any) =>
                      handleMumukshuFormChange(index, 'total_people', e)
                    }
                    otherStyles="mt-7"
                    containerStyles="bg-gray-100"
                    keyboardType="number-pad"
                    placeholder="please specify total people here..."
                    inputStyles={'font-pmedium text-black text-lg'}
                  />
                )}

                <CustomSelectBottomSheet
                  className="mt-7"
                  label="Pickup Location"
                  placeholder="Select Pickup Location"
                  options={getLocationOptions(mumukshuForm.date)}
                  selectedValue={mumukshuForm.mumukshus[index].pickup}
                  onValueChange={(val: any) => handleMumukshuFormChange(index, 'pickup', val)}
                  saveKeyInsteadOfValue={false}
                />

                <CustomSelectBottomSheet
                  className="mt-7"
                  label="Drop Location"
                  placeholder="Select Drop Location"
                  options={getLocationOptions(mumukshuForm.date)}
                  selectedValue={mumukshuForm.mumukshus[index].drop}
                  onValueChange={(val: any) => handleMumukshuFormChange(index, 'drop', val)}
                  saveKeyInsteadOfValue={false}
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
                      mode="time"
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
                        mumukshuForm.date ? moment(mumukshuForm.date).toDate() : moment().toDate()
                      }
                    />
                  </>
                ) : null}

                <CustomSelectBottomSheet
                  className="mt-7"
                  label="Luggage"
                  placeholder="Select any luggage"
                  options={dropdowns.LUGGAGE_LIST}
                  selectedValues={mumukshuForm.mumukshus[index].luggage}
                  onValuesChange={(val: any) => handleMumukshuFormChange(index, 'luggage', val)}
                  saveKeyInsteadOfValue={false}
                  multiSelect={true}
                  confirmButtonText="Select"
                  maxSelectedDisplay={3}
                />

                <CustomSelectBottomSheet
                  className="mt-7"
                  label="Leaving post adhyayan?"
                  placeholder="Leaving post adhyayan?"
                  options={dropdowns.TRAVEL_ADHYAYAN_ASK_LIST}
                  selectedValue={mumukshuForm.mumukshus[index].adhyayan}
                  onValueChange={(val: any) => handleMumukshuFormChange(index, 'adhyayan', val)}
                  saveKeyInsteadOfValue={false}
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
                  inputStyles={'font-pmedium text-black text-lg'}
                  placeholder="Please specify a location if 'Other' is selected, or provide any additional requests here..."
                  multiline={true}
                  numberOfLines={2}
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
    const key = `${mumukshu.pickup}-${mumukshu.drop}-${mumukshu.type}-${mumukshu.total_people || 'none'}`;
    if (!acc[key]) {
      acc[key] = {
        pickup: mumukshu.pickup,
        drop: mumukshu.drop,
        type: mumukshu.type,
        arrival_time: mumukshu.arrival_time,
        luggage: mumukshu.luggage,
        adhyayan: mumukshu.adhyayan,
        special_request: mumukshu.special_request,
        total_people: mumukshu.total_people,
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
