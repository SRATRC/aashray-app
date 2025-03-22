import { View, Text } from 'react-native';
import React, { useState, useCallback, useEffect } from 'react';
import { types, dropdowns } from '../../constants';
import { useRouter } from 'expo-router';
import { useGlobalContext } from '../../context/GlobalProvider';
import CustomDropdown from '../CustomDropdown';
import CustomButton from '../CustomButton';
import CustomCalender from '../CustomCalender';
import FormField from '../FormField';
import CustomModal from '../CustomModal';
import CustomChipGroup from '../CustomChipGroup';
import OtherMumukshuForm from '../OtherMumukshuForm';

const CHIPS = ['Self', 'Mumukshus'];

const INITIAL_MUMUKSHU_FORM = {
  date: '',
  mumukshus: [
    {
      cardno: '',
      mobno: '',
      pickup: '',
      drop: '',
      luggage: '',
      type: 'regular',
      special_request: '',
    },
  ],
};

const TravelBooking = () => {
  const router = useRouter();
  const { updateBooking, updateMumukshuBooking } = useGlobalContext();

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

  const [travelForm, setTravelForm] = useState({
    date: '',
    pickup: '',
    drop: '',
    luggage: '',
    type: 'regular',
    special_request: '',
  });

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
          type: 'regular',
          special_request: '',
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
      mumukshuForm.mumukshus.every(
        (mumukshu) =>
          mumukshu.mobno?.length === 10 &&
          mumukshu.cardno &&
          mumukshu.pickup &&
          mumukshu.drop &&
          mumukshu.luggage &&
          mumukshu.type &&
          !(
            (mumukshu.pickup === 'rc' && mumukshu.drop === 'rc') ||
            (mumukshu.pickup !== 'rc' && mumukshu.drop !== 'rc')
          )
      )
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
            handleChangeText={(e: any) => setTravelForm({ ...travelForm, special_request: e })}
            otherStyles="mt-7"
            containerStyles="bg-gray-100"
            keyboardType="default"
            placeholder="please specify your request here..."
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
                />
                <CustomDropdown
                  otherStyles="mt-7"
                  text={'Drop Location'}
                  placeholder={'Select Location'}
                  data={dropdowns.LOCATION_LIST}
                  setSelected={(val: any) => handleMumukshuFormChange(index, 'drop', val)}
                />
                <CustomDropdown
                  otherStyles="mt-7"
                  text={'Luggage'}
                  placeholder={'Select any luggage'}
                  data={dropdowns.LUGGAGE_LIST}
                  setSelected={(val: any) => handleMumukshuFormChange(index, 'luggage', val)}
                />
                <CustomDropdown
                  otherStyles="mt-7"
                  text={'Booking Type'}
                  placeholder={'Select booking type'}
                  data={dropdowns.BOOKING_TYPE_LIST}
                  defaultOption={{ key: 'regular', value: 'Regular' }}
                  setSelected={(val: any) => handleMumukshuFormChange(index, 'type', val)}
                />

                <FormField
                  text="Any Special Request?"
                  value={travelForm.special_request}
                  handleChangeText={(e: any) =>
                    handleMumukshuFormChange(index, 'special_request', e)
                  }
                  otherStyles="mt-7"
                  containerStyles="bg-gray-100"
                  keyboardType="default"
                  placeholder="please specify your request here..."
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
            if (
              (travelForm.pickup == 'RC' && travelForm.drop == 'RC') ||
              (travelForm.pickup != 'RC' && travelForm.drop != 'RC')
            ) {
              setModalVisible(true);
              setModalMessage('Invalid Pickup/Drop Locations');
              setIsSubmitting(false);
              return;
            }

            if (!travelForm.date || !travelForm.pickup || !travelForm.drop || !travelForm.luggage) {
              setModalVisible(true);
              setModalMessage('Please enter all details');
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
        isDisabled={!isMumukshuFormValid()}
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
