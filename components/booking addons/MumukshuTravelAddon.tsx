import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { icons, colors, dropdowns } from '../../constants';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import CustomSelectBottomSheet from '../CustomSelectBottomSheet';
import HorizontalSeparator from '../HorizontalSeparator';
import FormDisplayField from '../FormDisplayField';
import FormField from '../FormField';
import AddonItem from '../AddonItem';
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

// DirectionSelector component for reuse
const DirectionSelector = ({
  selectedDirection,
  onDirectionChange,
  title = 'Select journey direction:',
}) => (
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

interface MumukshuTravelAddonProps {
  travelForm: any;
  setTravelForm: any;
  addTravelForm: any;
  updateTravelForm: any;
  resetTravelForm: any;
  removeTravelForm: any;
  mumukshu_dropdown: any;
  isDatePickerVisible: any;
  setDatePickerVisibility: (pickerType: string, isVisible: boolean) => void;
  onToggle?: (isOpen: boolean) => void;
}

const MumukshuTravelAddon: React.FC<MumukshuTravelAddonProps> = ({
  travelForm,
  setTravelForm,
  addTravelForm,
  updateTravelForm,
  resetTravelForm,
  removeTravelForm,
  mumukshu_dropdown,
  isDatePickerVisible,
  setDatePickerVisibility,
  onToggle,
}) => {
  const [activeMumukshuIndex, setActiveMumukshuIndex] = useState(null);

  // Temporary state to hold the date for the checkin picker
  const [tempTravelDate, setTempTravelDate] = useState(new Date());

  // Track active direction
  const [selectedDirection, setSelectedDirection] = useState('toResearchCentre');

  // Create filtered dropdown options (exclude Research Centre for outbound pickup and return drop)
  const nonResearchCentreOptions = React.useMemo(
    () => dropdowns.LOCATION_LIST.filter((loc) => loc.value !== 'Research Centre'),
    []
  );

  // Helper function to check if location is a transport hub
  const isTransportHub = (location) => {
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

  // When the checkin picker is opened, initialize the temporary date
  useEffect(() => {
    if (isDatePickerVisible.travel) {
      setTempTravelDate(
        travelForm.date ? moment(travelForm.date).toDate() : moment().add(1, 'days').toDate()
      );
    }
  }, [isDatePickerVisible.travel]);

  // Handle direction change
  const handleDirectionChange = (direction) => {
    setSelectedDirection(direction);

    // Update direction for all travel groups
    const updatedMumukshuGroup = travelForm.mumukshuGroup.map((group) => {
      const directionInfo = DIRECTION_OPTIONS.find((opt) => opt.value === direction);

      if (directionInfo) {
        return {
          ...group,
          direction: direction,
          pickup: directionInfo.fixedPickup ? directionInfo.fixedPickupValue : group.pickup,
          drop: directionInfo.fixedDrop ? directionInfo.fixedDropValue : group.drop,
        };
      }
      return group;
    });

    setTravelForm({
      ...travelForm,
      direction: direction,
      mumukshuGroup: updatedMumukshuGroup,
    });
  };

  // Initialize direction if not set
  useEffect(() => {
    if (!travelForm.direction) {
      handleDirectionChange('toResearchCentre');
    } else {
      setSelectedDirection(travelForm.direction);
    }
  }, []);

  const getAvailableMumukshus = (currentGroupIndex: number) => {
    // Get all selected mumukshu indices from other groups
    const selectedIndices = travelForm.mumukshuGroup.reduce(
      (acc: string[], group: any, idx: number) => {
        if (idx !== currentGroupIndex) {
          return [...acc, ...group.mumukshuIndices];
        }
        return acc;
      },
      []
    );

    // Filter out mumukshus that are already selected in other groups
    return mumukshu_dropdown.filter((mumukshu: any) => !selectedIndices.includes(mumukshu.value));
  };

  const hasAvailableMumukshus = () => {
    // Get all selected mumukshu indices from all groups
    const selectedIndices = travelForm.mumukshuGroup.flatMap((group: any) => group.mumukshuIndices);
    // Check if there are any unselected mumukshus
    return mumukshu_dropdown.some((mumukshu: any) => !selectedIndices.includes(mumukshu.value));
  };

  // Modified function to add new travel form with current direction
  const handleAddTravelForm = () => {
    const directionInfo = DIRECTION_OPTIONS.find((opt) => opt.value === travelForm.direction);

    const newGroup = {
      direction: travelForm.direction,
      pickup: directionInfo?.fixedPickup ? directionInfo.fixedPickupValue : '',
      drop: directionInfo?.fixedDrop ? directionInfo.fixedDropValue : '',
      arrival_time: '',
      luggage: '',
      adhyayan: dropdowns.TRAVEL_ADHYAYAN_ASK_LIST[1].value,
      type: dropdowns.BOOKING_TYPE_LIST[0].value,
      special_request: '',
      mumukshus: [],
      mumukshuIndices: [],
    };

    addTravelForm(newGroup);
  };

  return (
    <AddonItem
      onCollapse={() => {
        resetTravelForm();
      }}
      onToggle={onToggle}
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
        otherStyles="mt-5"
        backgroundColor="bg-gray-100"
        onPress={() => setDatePickerVisibility('travel', true)}
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
          setDatePickerVisibility('travel', false);
        }}
        onCancel={() => setDatePickerVisibility('travel', false)}
        minimumDate={moment().add(1, 'days').toDate()}
      />

      {/* Direction Selector */}
      <DirectionSelector
        selectedDirection={travelForm.direction || selectedDirection}
        onDirectionChange={handleDirectionChange}
      />

      {travelForm.mumukshuGroup.map((assignment: any, index: any) => (
        <View key={index} style={{ marginBottom: 15 }}>
          {index > 0 && (
            <View>
              <HorizontalSeparator otherStyles={'w-full mt-3'} />
              <TouchableOpacity
                onPress={removeTravelForm(index)}
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

          <CustomSelectBottomSheet
            className="mt-5"
            label={`Mumukshu group - ${index + 1}`}
            placeholder="Select Mumukshus"
            options={getAvailableMumukshus(index)}
            selectedValues={assignment.mumukshuIndices}
            onValuesChange={(val) => updateTravelForm(index, 'mumukshus', val)}
            multiSelect={true}
            confirmButtonText="Select"
          />

          {/* Show pickup field only if it's not fixed for this direction */}
          {!DIRECTION_OPTIONS.find(
            (opt) => opt.value === (assignment.direction || travelForm.direction)
          )?.fixedPickup && (
            <CustomSelectBottomSheet
              className="mt-5"
              label="Pickup Location"
              placeholder="Select Pickup Location"
              options={nonResearchCentreOptions}
              selectedValue={assignment.pickup}
              onValueChange={(val: any) => updateTravelForm(index, 'pickup', val)}
              saveKeyInsteadOfValue={false}
            />
          )}

          {/* Show fixed pickup if applicable */}
          {DIRECTION_OPTIONS.find(
            (opt) => opt.value === (assignment.direction || travelForm.direction)
          )?.fixedPickup && (
            <FormDisplayField
              text="Pickup Location"
              value="Research Centre"
              otherStyles="mt-5"
              backgroundColor="bg-gray-100"
              inputStyles="font-pmedium text-gray-800 text-lg"
            />
          )}

          {/* Show drop field only if it's not fixed for this direction */}
          {!DIRECTION_OPTIONS.find(
            (opt) => opt.value === (assignment.direction || travelForm.direction)
          )?.fixedDrop && (
            <CustomSelectBottomSheet
              className="mt-5"
              label="Drop Location"
              placeholder="Select Drop Location"
              options={nonResearchCentreOptions}
              selectedValue={assignment.drop}
              onValueChange={(val: any) => updateTravelForm(index, 'drop', val)}
              saveKeyInsteadOfValue={false}
            />
          )}

          {/* Show fixed drop if applicable */}
          {DIRECTION_OPTIONS.find(
            (opt) => opt.value === (assignment.direction || travelForm.direction)
          )?.fixedDrop && (
            <FormDisplayField
              text="Drop Location"
              value="Research Centre"
              otherStyles="mt-5"
              backgroundColor="bg-gray-100"
              inputStyles="font-pmedium text-gray-800 text-lg"
            />
          )}

          {/* Determine if time picker is needed based on direction */}
          {isTransportHub(
            (assignment.direction || travelForm.direction) === 'toResearchCentre'
              ? assignment.pickup
              : assignment.drop
          ) && (
            <>
              <FormDisplayField
                text="Flight/Train Time"
                value={
                  assignment.arrival_time
                    ? moment(assignment.arrival_time).format('Do MMMM YYYY, h:mm a')
                    : 'Flight/Train Time'
                }
                otherStyles="mt-5"
                inputStyles={'font-pmedium text-gray-400 text-lg'}
                backgroundColor="bg-gray-100"
                onPress={() => {
                  setDatePickerVisibility('travel_time', true);
                  setActiveMumukshuIndex(index);
                }}
              />
              <DateTimePickerModal
                isVisible={isDatePickerVisible.travel_time && activeMumukshuIndex === index}
                mode="datetime"
                date={
                  assignment.arrival_time ? moment(assignment.arrival_time).toDate() : new Date()
                }
                onConfirm={(date: Date) => {
                  updateTravelForm(index, 'arrival_time', date.toISOString());
                  setDatePickerVisibility('travel_time', false);
                }}
                onCancel={() => setDatePickerVisibility('travel_time', false)}
                minimumDate={
                  assignment.arrival_time
                    ? moment(assignment.arrival_time).toDate()
                    : moment().toDate()
                }
              />
            </>
          )}

          <CustomSelectBottomSheet
            className="mt-5"
            label="Booking Type"
            placeholder="Booking Type"
            options={dropdowns.BOOKING_TYPE_LIST}
            selectedValue={assignment.type}
            onValueChange={(val: any) => updateTravelForm(index, 'type', val)}
            saveKeyInsteadOfValue={false}
          />

          <CustomSelectBottomSheet
            className="mt-5"
            label="Luggage"
            placeholder="Select any Luggage"
            options={dropdowns.LUGGAGE_LIST}
            selectedValue={assignment.luggage}
            onValueChange={(val: any) => updateTravelForm(index, 'luggage', val)}
            saveKeyInsteadOfValue={false}
          />

          {/* Only show adhyayan dropdown for "From Research Centre" direction */}
          {(assignment.direction || travelForm.direction) === 'fromResearchCentre' && (
            <CustomSelectBottomSheet
              className="mt-5"
              label="Leaving post adhyayan?"
              placeholder="Leaving post adhyayan?"
              options={dropdowns.TRAVEL_ADHYAYAN_ASK_LIST}
              selectedValue={assignment.adhyayan}
              onValueChange={(val: any) => updateTravelForm(index, 'adhyayan', val)}
              saveKeyInsteadOfValue={false}
            />
          )}

          <FormField
            text="Any Special Request?"
            value={assignment.special_request}
            handleChangeText={(e: any) => updateTravelForm(index, 'special_request', e)}
            otherStyles="mt-5"
            containerStyles="bg-gray-100"
            keyboardType="default"
            placeholder="please specify your request here..."
          />
        </View>
      ))}

      <TouchableOpacity
        className={`mt-4 w-full flex-row items-center justify-start gap-x-1 ${
          !hasAvailableMumukshus() ? 'opacity-50' : ''
        }`}
        onPress={hasAvailableMumukshus() ? handleAddTravelForm : undefined}
        disabled={!hasAvailableMumukshus()}>
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

export default MumukshuTravelAddon;
