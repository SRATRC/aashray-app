import { View, Text, TouchableOpacity } from 'react-native';
import React, { useState, useCallback, useEffect } from 'react';
import { FontAwesome5 } from '@expo/vector-icons';
import { types, dropdowns, status, colors } from '../../constants';
import { useRouter } from 'expo-router';
import { useGlobalContext } from '../../context/GlobalProvider';
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

// Define direction options outside the component
const DIRECTION_OPTIONS = [
  {
    label: 'To Research Centre',
    value: 'toResearchCentre',
    icon: 'arrow-right',
    fixedPickup: false,
    fixedDrop: true,
    fixedPickupValue: '',
    fixedDropValue: 'Research Centre',
  },
  {
    label: 'From Research Centre',
    value: 'fromResearchCentre',
    icon: 'arrow-left',
    fixedPickup: true,
    fixedDrop: false,
    fixedPickupValue: 'Research Centre',
    fixedDropValue: '',
  },
];

let CHIPS = ['Self', 'Mumukshus'];

const INITIAL_MUMUKSHU_FORM = {
  date: '',
  direction: 'toResearchCentre', // Default direction
  mumukshus: [
    {
      cardno: '',
      mobno: '',
      pickup: '',
      drop: 'Research Centre', // Default to "To Research Centre" direction
      luggage: '',
      adhyayan: dropdowns.TRAVEL_ADHYAYAN_ASK_LIST[1].value,
      type: dropdowns.BOOKING_TYPE_LIST[0].value,
      special_request: '',
      arrival_time: '',
    },
  ],
};

// DirectionSelector component for reuse between booking types
const DirectionSelector = ({
  selectedDirection,
  onDirectionChange,
  title = 'Select your journey direction:',
}: any) => (
  <>
    <Text className="mb-2 mt-5 font-pmedium text-base text-gray-600">{title}</Text>

    <View className="mt-2 flex flex-row justify-between">
      {DIRECTION_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => onDirectionChange(option.value)}
          activeOpacity={0.7}
          className={`flex-1 flex-row items-center justify-center rounded-lg border p-4 ${
            selectedDirection === option.value
              ? 'border-orange-300 bg-orange-50'
              : 'border-gray-200 bg-gray-50'
          } ${option.value === 'fromResearchCentre' ? 'ml-2' : 'mr-2'}`}>
          <FontAwesome5
            name={option.icon}
            size={16}
            color={selectedDirection === option.value ? colors.orange : '#BAB9C7'}
            style={{ marginRight: 8 }}
            solid
          />
          <Text
            className={`font-pmedium text-sm ${
              selectedDirection === option.value ? 'text-orange-600' : 'text-gray-600'
            }`}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </>
);

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

  // Selected travel direction
  const [selectedDirection, setSelectedDirection] = useState('toResearchCentre');

  const [isDatePickerVisible, setDatePickerVisibility]: any = useState({
    toRC_time: false,
    fromRC_time: false,
    mumukshu: false,
  });

  const [activeMumukshuIndex, setActiveMumukshuIndex] = useState(null);

  // Updated travel form with bidirectional structure
  const [travelForm, setTravelForm]: any = useState({
    toResearchCentre: {
      active: true, // Start with To Research Centre active
      date: '',
      pickup: '',
      drop: 'Research Centre',
      arrival_time: '',
      type: dropdowns.BOOKING_TYPE_LIST[0].value,
      luggage: '',
      special_request: '',
    },
    fromResearchCentre: {
      active: false,
      date: '',
      pickup: 'Research Centre',
      drop: '',
      arrival_time: '',
      type: dropdowns.BOOKING_TYPE_LIST[0].value,
      luggage: '',
      special_request: '',
      adhyayan: dropdowns.TRAVEL_ADHYAYAN_ASK_LIST[1].value,
    },
  });

  // Handle direction change
  const handleDirectionChange = (direction: any) => {
    setSelectedDirection(direction);

    // Update active states in the travel form for self booking
    if (selectedChip === CHIPS[0]) {
      setTravelForm((prev: any) => ({
        ...prev,
        toResearchCentre: {
          ...prev.toResearchCentre,
          active: direction === 'toResearchCentre',
        },
        fromResearchCentre: {
          ...prev.fromResearchCentre,
          active: direction === 'fromResearchCentre',
        },
      }));
    }
    // Update direction for mumukshu booking
    else {
      setMumukshuForm((prev) => ({
        ...prev,
        direction: direction,
      }));

      // Update pickup/drop values for all mumukshus based on direction
      const directionInfo = DIRECTION_OPTIONS.find((opt) => opt.value === direction);
      if (directionInfo) {
        const updatedMumukshus = mumukshuForm.mumukshus.map((mumukshu) => ({
          ...mumukshu,
          pickup: directionInfo.fixedPickup ? directionInfo.fixedPickupValue : mumukshu.pickup,
          drop: directionInfo.fixedDrop ? directionInfo.fixedDropValue : mumukshu.drop,
        }));

        setMumukshuForm((prev) => ({
          ...prev,
          mumukshus: updatedMumukshus,
        }));
      }
    }
  };

  // Set date for all forms when calendar date changes
  const handleDateChange = (day: any) => {
    // Update self booking form regardless of which tab is selected
    setTravelForm((prev: any) => ({
      ...prev,
      toResearchCentre: {
        ...prev.toResearchCentre,
        date: day,
      },
      fromResearchCentre: {
        ...prev.fromResearchCentre,
        date: day,
      },
    }));

    // Update Mumukshu form date regardless of which tab is selected
    setMumukshuForm((prev) => ({
      ...prev,
      date: day,
    }));
  };

  // Helper function to toggle date picker visibility
  const toggleDatePicker = (pickerType: any, isVisible: any) => {
    setDatePickerVisibility((prev: any) => ({
      ...prev,
      [pickerType]: isVisible,
    }));
  };

  // Updated validation for travel form
  const isSelfFormValid = () => {
    // Get the active journey
    const activeJourney =
      selectedDirection === 'toResearchCentre'
        ? travelForm.toResearchCentre
        : travelForm.fromResearchCentre;

    const requiresTime =
      ((selectedDirection === 'toResearchCentre' && activeJourney.pickup) ||
        (selectedDirection === 'fromResearchCentre' && activeJourney.drop)) &&
      dropdowns.LOCATION_LIST.find((loc: { value: string }) => {
        const locationValue =
          selectedDirection === 'toResearchCentre' ? activeJourney.pickup : activeJourney.drop;

        return (
          loc.value === locationValue &&
          (loc.value.toLowerCase().includes('railway') ||
            loc.value.toLowerCase().includes('airport'))
        );
      });

    // Check required fields
    return (
      activeJourney.date &&
      ((selectedDirection === 'toResearchCentre' && activeJourney.pickup) ||
        (selectedDirection === 'fromResearchCentre' && activeJourney.drop)) &&
      activeJourney.luggage &&
      activeJourney.type &&
      (!requiresTime || (requiresTime && activeJourney.arrival_time))
    );
  };

  const [mumukshuForm, setMumukshuForm] = useState(INITIAL_MUMUKSHU_FORM);

  const addMumukshuForm = () => {
    // Use mumukshuForm.direction instead of selectedDirection when in Mumukshu tab
    const directionInfo = DIRECTION_OPTIONS.find((opt) => opt.value === mumukshuForm.direction);

    setMumukshuForm((prev) => ({
      ...prev,
      mumukshus: [
        ...prev.mumukshus,
        {
          cardno: '',
          mobno: '',
          pickup: directionInfo?.fixedPickup ? directionInfo.fixedPickupValue : '',
          drop: directionInfo?.fixedDrop ? directionInfo.fixedDropValue : '',
          luggage: '',
          adhyayan: dropdowns.TRAVEL_ADHYAYAN_ASK_LIST[1].value,
          type: dropdowns.BOOKING_TYPE_LIST[0].value,
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
    const directionInfo = DIRECTION_OPTIONS.find((opt) => opt.value === mumukshuForm.direction);
    if (!directionInfo) return false;

    return (
      mumukshuForm.date &&
      mumukshuForm.mumukshus.every((mumukshu) => {
        // Determine which field to validate based on direction
        const locationField = directionInfo.fixedPickup ? 'drop' : 'pickup';
        const locationValue = mumukshu[locationField];

        const requiresTime =
          locationValue &&
          dropdowns.LOCATION_LIST.find(
            (loc) =>
              loc.value === locationValue &&
              (loc.key?.toLowerCase().includes('railway') ||
                loc.key?.toLowerCase().includes('airport'))
          );

        // Check for required fields
        return (
          mumukshu.cardno &&
          mumukshu.mobno?.length === 10 &&
          locationValue && // Only check the non-fixed field
          mumukshu.luggage &&
          mumukshu.type &&
          (!requiresTime || (requiresTime && mumukshu.arrival_time))
        );
      })
    );
  };

  // Create filtered dropdown options (exclude Research Centre for outbound pickup and return drop)
  const nonResearchCentreOptions = React.useMemo(
    () => dropdowns.LOCATION_LIST.filter((loc) => loc.value !== 'Research Centre'),
    []
  );

  // Helper function to check if location is a transport hub
  const isTransportHub = (location: any) => {
    return (
      location &&
      dropdowns.LOCATION_LIST.find(
        (loc) =>
          loc.value === location &&
          (loc.value.toLowerCase().includes('railway') ||
            loc.value.toLowerCase().includes('airport'))
      )
    );
  };

  return (
    <View className="w-full flex-1">
      <CustomCalender
        selectedDay={
          // Prioritize display in this order:
          // 1. Self active direction date
          // 2. Mumukshu date
          // 3. Any other available date
          (selectedChip === CHIPS[0] && travelForm[selectedDirection]?.date) ||
          mumukshuForm.date ||
          travelForm.toResearchCentre.date ||
          travelForm.fromResearchCentre.date
        }
        setSelectedDay={handleDateChange}
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
          {/* Direction Selector */}
          <DirectionSelector
            selectedDirection={selectedDirection}
            onDirectionChange={handleDirectionChange}
          />

          {/* Form Fields based on selected direction */}
          <View className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
            {selectedDirection === 'toResearchCentre' ? (
              // To Research Centre Form
              <>
                {/* Pickup Location */}
                <CustomSelectBottomSheet
                  className="mt-2"
                  label="Pickup Location"
                  placeholder="Select Pickup Location"
                  options={nonResearchCentreOptions}
                  selectedValue={travelForm.toResearchCentre.pickup}
                  onValueChange={(val: any) =>
                    setTravelForm({
                      ...travelForm,
                      toResearchCentre: {
                        ...travelForm.toResearchCentre,
                        pickup: val,
                      },
                    })
                  }
                  saveKeyInsteadOfValue={false}
                />

                {/* Drop Location (always Research Centre) */}
                <FormDisplayField
                  text="Drop Location"
                  value="Research Centre"
                  otherStyles="mt-5"
                  backgroundColor="bg-gray-100"
                  inputStyles="font-pmedium text-gray-800 text-lg"
                />

                {/* Flight/Train Time if needed */}
                {isTransportHub(travelForm.toResearchCentre.pickup) && (
                  <>
                    <FormDisplayField
                      text="Flight/Train Time"
                      value={
                        travelForm.toResearchCentre.arrival_time
                          ? moment(travelForm.toResearchCentre.arrival_time).format(
                              'Do MMMM YYYY, h:mm a'
                            )
                          : 'Flight/Train Time'
                      }
                      otherStyles="mt-5"
                      inputStyles={'font-pmedium text-gray-400 text-lg'}
                      backgroundColor="bg-gray-100"
                      onPress={() => toggleDatePicker('toRC_time', true)}
                    />
                    <DateTimePickerModal
                      isVisible={isDatePickerVisible.toRC_time}
                      mode="datetime"
                      date={
                        travelForm.toResearchCentre.arrival_time
                          ? moment(travelForm.toResearchCentre.arrival_time).toDate()
                          : new Date()
                      }
                      onConfirm={(date: Date) => {
                        setTravelForm({
                          ...travelForm,
                          toResearchCentre: {
                            ...travelForm.toResearchCentre,
                            arrival_time: date.toISOString(),
                          },
                        });
                        toggleDatePicker('toRC_time', false);
                      }}
                      onCancel={() => toggleDatePicker('toRC_time', false)}
                      minimumDate={moment().toDate()}
                    />
                  </>
                )}
              </>
            ) : (
              // From Research Centre Form
              <>
                {/* Pickup Location (always Research Centre) */}
                <FormDisplayField
                  text="Pickup Location"
                  value="Research Centre"
                  otherStyles="mt-2"
                  backgroundColor="bg-gray-100"
                  inputStyles="font-pmedium text-gray-800 text-lg"
                />

                {/* Drop Location */}
                <CustomSelectBottomSheet
                  className="mt-5"
                  label="Drop Location"
                  placeholder="Select Drop Location"
                  options={nonResearchCentreOptions}
                  selectedValue={travelForm.fromResearchCentre.drop}
                  onValueChange={(val: any) =>
                    setTravelForm({
                      ...travelForm,
                      fromResearchCentre: {
                        ...travelForm.fromResearchCentre,
                        drop: val,
                      },
                    })
                  }
                  saveKeyInsteadOfValue={false}
                />

                {/* Flight/Train Time if needed */}
                {isTransportHub(travelForm.fromResearchCentre.drop) && (
                  <>
                    <FormDisplayField
                      text="Flight/Train Time"
                      value={
                        travelForm.fromResearchCentre.arrival_time
                          ? moment(travelForm.fromResearchCentre.arrival_time).format(
                              'Do MMMM YYYY, h:mm a'
                            )
                          : 'Flight/Train Time'
                      }
                      otherStyles="mt-5"
                      inputStyles={'font-pmedium text-gray-400 text-lg'}
                      backgroundColor="bg-gray-100"
                      onPress={() => toggleDatePicker('fromRC_time', true)}
                    />
                    <DateTimePickerModal
                      isVisible={isDatePickerVisible.fromRC_time}
                      mode="datetime"
                      date={
                        travelForm.fromResearchCentre.arrival_time
                          ? moment(travelForm.fromResearchCentre.arrival_time).toDate()
                          : new Date()
                      }
                      onConfirm={(date: Date) => {
                        setTravelForm({
                          ...travelForm,
                          fromResearchCentre: {
                            ...travelForm.fromResearchCentre,
                            arrival_time: date.toISOString(),
                          },
                        });
                        toggleDatePicker('fromRC_time', false);
                      }}
                      onCancel={() => toggleDatePicker('fromRC_time', false)}
                      minimumDate={moment().toDate()}
                    />
                  </>
                )}

                {/* Leaving post adhyayan - only for From Research Centre */}
                <CustomSelectBottomSheet
                  className="mt-5"
                  label="Leaving post adhyayan?"
                  placeholder="Leaving post adhyayan?"
                  options={dropdowns.TRAVEL_ADHYAYAN_ASK_LIST}
                  selectedValue={travelForm.fromResearchCentre.adhyayan}
                  onValueChange={(val: any) =>
                    setTravelForm({
                      ...travelForm,
                      fromResearchCentre: {
                        ...travelForm.fromResearchCentre,
                        adhyayan: val,
                      },
                    })
                  }
                  saveKeyInsteadOfValue={false}
                />
              </>
            )}

            {/* Common Fields for Both Directions */}
            <CustomSelectBottomSheet
              className="mt-5"
              label="Booking Type"
              placeholder="Booking Type"
              options={dropdowns.BOOKING_TYPE_LIST}
              selectedValue={
                selectedDirection === 'toResearchCentre'
                  ? travelForm.toResearchCentre.type
                  : travelForm.fromResearchCentre.type
              }
              onValueChange={(val: any) =>
                setTravelForm({
                  ...travelForm,
                  [selectedDirection]: {
                    ...travelForm[selectedDirection],
                    type: val,
                  },
                })
              }
              saveKeyInsteadOfValue={false}
            />

            <CustomSelectBottomSheet
              className="mt-5"
              label="Luggage"
              placeholder="Select any Luggage"
              options={dropdowns.LUGGAGE_LIST}
              selectedValue={
                selectedDirection === 'toResearchCentre'
                  ? travelForm.toResearchCentre.luggage
                  : travelForm.fromResearchCentre.luggage
              }
              onValueChange={(val: any) =>
                setTravelForm({
                  ...travelForm,
                  [selectedDirection]: {
                    ...travelForm[selectedDirection],
                    luggage: val,
                  },
                })
              }
              saveKeyInsteadOfValue={false}
            />

            <FormField
              text="Any Special Request?"
              value={
                selectedDirection === 'toResearchCentre'
                  ? travelForm.toResearchCentre.special_request
                  : travelForm.fromResearchCentre.special_request
              }
              handleChangeText={(e: any) =>
                setTravelForm({
                  ...travelForm,
                  [selectedDirection]: {
                    ...travelForm[selectedDirection],
                    special_request: e,
                  },
                })
              }
              otherStyles="mt-5"
              containerStyles="bg-gray-100"
              keyboardType="default"
              placeholder="please specify your request here..."
              inputStyles={'font-pmedium text-gray-400 text-lg'}
            />
          </View>
        </View>
      )}

      {selectedChip == CHIPS[1] && (
        <View>
          {/* Direction Selector for Mumukshu Booking */}
          <DirectionSelector
            selectedDirection={mumukshuForm.direction}
            onDirectionChange={handleDirectionChange}
            title="Select journey direction:"
          />

          <OtherMumukshuForm
            mumukshuForm={mumukshuForm}
            setMumukshuForm={setMumukshuForm}
            handleMumukshuFormChange={handleMumukshuFormChange}
            addMumukshuForm={addMumukshuForm}
            removeMumukshuForm={removeMumukshuForm}>
            {(index: any) => (
              <>
                {/* Show pickup field only if it's not fixed */}
                {!DIRECTION_OPTIONS.find((opt) => opt.value === mumukshuForm.direction)
                  ?.fixedPickup && (
                  <CustomSelectBottomSheet
                    className="mt-7"
                    label="Pickup Location"
                    placeholder="Select Pickup Location"
                    options={nonResearchCentreOptions}
                    selectedValue={mumukshuForm.mumukshus[index].pickup}
                    onValueChange={(val: any) => handleMumukshuFormChange(index, 'pickup', val)}
                    saveKeyInsteadOfValue={false}
                  />
                )}

                {/* Show fixed pickup if applicable */}
                {DIRECTION_OPTIONS.find((opt) => opt.value === mumukshuForm.direction)
                  ?.fixedPickup && (
                  <FormDisplayField
                    text="Pickup Location"
                    value="Research Centre"
                    otherStyles="mt-7"
                    backgroundColor="bg-gray-100"
                    inputStyles="font-pmedium text-gray-800 text-lg"
                  />
                )}

                {/* Show drop field only if it's not fixed */}
                {!DIRECTION_OPTIONS.find((opt) => opt.value === mumukshuForm.direction)
                  ?.fixedDrop && (
                  <CustomSelectBottomSheet
                    className="mt-7"
                    label="Drop Location"
                    placeholder="Select Drop Location"
                    options={nonResearchCentreOptions}
                    selectedValue={mumukshuForm.mumukshus[index].drop}
                    onValueChange={(val: any) => handleMumukshuFormChange(index, 'drop', val)}
                    saveKeyInsteadOfValue={false}
                  />
                )}

                {/* Show fixed drop if applicable */}
                {DIRECTION_OPTIONS.find((opt) => opt.value === mumukshuForm.direction)
                  ?.fixedDrop && (
                  <FormDisplayField
                    text="Drop Location"
                    value="Research Centre"
                    otherStyles="mt-7"
                    backgroundColor="bg-gray-100"
                    inputStyles="font-pmedium text-gray-800 text-lg"
                  />
                )}

                {/* Flight/Train Time if needed */}
                {isTransportHub(
                  mumukshuForm.direction === 'toResearchCentre'
                    ? mumukshuForm.mumukshus[index].pickup
                    : mumukshuForm.mumukshus[index].drop
                ) && (
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
                        setDatePickerVisibility({
                          ...isDatePickerVisible,
                          mumukshu: true,
                        });
                        setActiveMumukshuIndex(index);
                      }}
                    />
                    <DateTimePickerModal
                      isVisible={isDatePickerVisible.mumukshu && activeMumukshuIndex === index}
                      mode="datetime"
                      date={
                        mumukshuForm.mumukshus[index].arrival_time
                          ? moment(mumukshuForm.mumukshus[index].arrival_time).toDate()
                          : new Date()
                      }
                      onConfirm={(date: Date) => {
                        handleMumukshuFormChange(index, 'arrival_time', date.toISOString());
                        setDatePickerVisibility({
                          ...isDatePickerVisible,
                          mumukshu: false,
                        });
                      }}
                      onCancel={() =>
                        setDatePickerVisibility({
                          ...isDatePickerVisible,
                          mumukshu: false,
                        })
                      }
                      minimumDate={
                        mumukshuForm.mumukshus[index].arrival_time
                          ? moment(mumukshuForm.mumukshus[index].arrival_time).toDate()
                          : moment().toDate()
                      }
                    />
                  </>
                )}

                <CustomSelectBottomSheet
                  className="mt-7"
                  label="Booking Type"
                  placeholder="Select Booking Type"
                  options={dropdowns.BOOKING_TYPE_LIST}
                  selectedValue={mumukshuForm.mumukshus[index].type}
                  onValueChange={(val: any) => handleMumukshuFormChange(index, 'type', val)}
                  saveKeyInsteadOfValue={false}
                />

                <CustomSelectBottomSheet
                  className="mt-7"
                  label="Luggage"
                  placeholder="Select any luggage"
                  options={dropdowns.LUGGAGE_LIST}
                  selectedValue={mumukshuForm.mumukshus[index].luggage}
                  onValueChange={(val: any) => handleMumukshuFormChange(index, 'luggage', val)}
                  saveKeyInsteadOfValue={false}
                />

                {/* Only show adhyayan dropdown for "From Research Centre" direction */}
                {mumukshuForm.direction === 'fromResearchCentre' && (
                  <CustomSelectBottomSheet
                    className="mt-7"
                    label="Leaving post adhyayan?"
                    placeholder="Leaving post adhyayan?"
                    options={dropdowns.TRAVEL_ADHYAYAN_ASK_LIST}
                    selectedValue={mumukshuForm.mumukshus[index].adhyayan}
                    onValueChange={(val: any) => handleMumukshuFormChange(index, 'adhyayan', val)}
                    saveKeyInsteadOfValue={false}
                  />
                )}

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
              setModalMessage('Please fill all required fields');
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
  const { date, direction, mumukshus } = inputData;

  // Filter out any fixed pickup/drop locations as they don't need to be sent
  const filteredMumukshus = mumukshus.map((mumukshu: any) => {
    const result = { ...mumukshu };

    // For "To Research Centre", we filter by pickup (drop is always RC)
    // For "From Research Centre", we filter by drop (pickup is always RC)
    return result;
  });

  // Group mumukshus by pickup-drop pairs
  const groupedMumukshus = filteredMumukshus.reduce((acc: any, mumukshu: any) => {
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
    direction: direction, // Add direction to the payload
    mumukshuGroup: mumukshuGroup,
  };
}

export default TravelBooking;
