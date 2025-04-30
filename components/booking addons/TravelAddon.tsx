import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { colors, dropdowns, icons } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import FormField from '../FormField';
import AddonItem from '../AddonItem';
import moment from 'moment';
import FormDisplayField from '../FormDisplayField';
import CustomSelectBottomSheet from '../CustomSelectBottomSheet';

interface TravelAddonProps {
  travelForm: any;
  setTravelForm: any;
  isDatePickerVisible: any;
  setDatePickerVisibility: (pickerType: any, isVisible: any) => void;
  onToggle?: (isOpen: boolean) => void;
}

const TravelAddon: React.FC<TravelAddonProps> = ({
  travelForm,
  setTravelForm,
  isDatePickerVisible,
  setDatePickerVisibility,
  onToggle,
}) => {
  const { data, setData } = useGlobalContext();

  // State to track which journey sections are expanded
  const [expandedSections, setExpandedSections] = useState({
    toResearchCentre: false,
    fromResearchCentre: false,
  });

  // Ensure travelForm has the expected structure with defaults
  useEffect(() => {
    // Check if the travelForm has the new structure
    const hasNewStructure =
      travelForm &&
      (travelForm.toResearchCentre !== undefined || travelForm.fromResearchCentre !== undefined);

    // If it doesn't have the new structure, initialize it
    if (!hasNewStructure) {
      const initialDate =
        data.room?.startDay ||
        data.adhyayan?.[0]?.start_date ||
        moment().add(1, 'days').format('YYYY-MM-DD');
      const endDate =
        data.room?.endDay ||
        data.adhyayan?.[0]?.end_date ||
        moment().add(2, 'days').format('YYYY-MM-DD');

      // Migrate old format to new format if needed
      const initializedForm = {
        toResearchCentre: {
          active: false,
          date: initialDate,
          pickup: travelForm?.pickup || '',
          drop: 'Research Centre',
          arrival_time: travelForm?.arrival_time || '',
          type: travelForm?.type || dropdowns.BOOKING_TYPE_LIST[0].value,
          luggage: travelForm?.luggage || '',
          special_request: travelForm?.special_request || '',
        },
        fromResearchCentre: {
          active: false,
          date: endDate,
          pickup: 'Research Centre',
          drop: travelForm?.drop !== 'Research Centre' ? travelForm?.drop : '',
          arrival_time: '',
          type: travelForm?.type || dropdowns.BOOKING_TYPE_LIST[0].value,
          luggage: travelForm?.luggage || '',
          special_request: travelForm?.special_request || '',
          adhyayan: travelForm?.adhyayan || dropdowns.TRAVEL_ADHYAYAN_ASK_LIST[1].value,
        },
      };

      // If there's existing data, activate the appropriate journey
      if (travelForm?.pickup || travelForm?.drop) {
        if (travelForm?.pickup && travelForm.pickup !== 'Research Centre') {
          initializedForm.toResearchCentre.active = true;
          setExpandedSections((prev) => ({ ...prev, toResearchCentre: true }));
        }

        if (travelForm?.drop && travelForm.drop !== 'Research Centre') {
          initializedForm.fromResearchCentre.active = true;
          setExpandedSections((prev) => ({ ...prev, fromResearchCentre: true }));
        }
      }

      setTravelForm(initializedForm);
    }
  }, []);

  // Temporary state to hold dates for pickers
  const [tempDate, setTempDate] = useState({
    toRC: new Date(),
    fromRC: new Date(),
    toRC_time: new Date(),
    fromRC_time: new Date(),
  });

  // Create filter for location options (exclude Research Centre)
  const nonResearchCentreOptions = useMemo(
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

  // Date picker effects
  useEffect(() => {
    if (isDatePickerVisible.toRC_travel) {
      setTempDate((prev) => ({
        ...prev,
        toRC: travelForm.toResearchCentre.date
          ? moment(travelForm.toResearchCentre.date).toDate()
          : moment().add(1, 'days').toDate(),
      }));
    }
  }, [isDatePickerVisible.toRC_travel, travelForm.toResearchCentre?.date]);

  useEffect(() => {
    if (isDatePickerVisible.fromRC_travel) {
      setTempDate((prev) => ({
        ...prev,
        fromRC: travelForm.fromResearchCentre.date
          ? moment(travelForm.fromResearchCentre.date).toDate()
          : moment().add(1, 'days').toDate(),
      }));
    }
  }, [isDatePickerVisible.fromRC_travel, travelForm.fromResearchCentre?.date]);

  // Reset form values when collapsed
  const resetForm = () => {
    const initialDate =
      data.room?.startDay ||
      data.adhyayan?.[0]?.start_date ||
      moment().add(1, 'days').format('YYYY-MM-DD');
    const endDate =
      data.room?.endDay ||
      data.adhyayan?.[0]?.end_date ||
      moment().add(2, 'days').format('YYYY-MM-DD');

    setTravelForm({
      toResearchCentre: {
        active: false,
        date: initialDate,
        pickup: '',
        drop: 'Research Centre',
        arrival_time: '',
        type: dropdowns.BOOKING_TYPE_LIST[0].value,
        luggage: '',
        special_request: '',
      },
      fromResearchCentre: {
        active: false,
        date: endDate,
        pickup: 'Research Centre',
        drop: '',
        arrival_time: '',
        type: dropdowns.BOOKING_TYPE_LIST[0].value,
        luggage: '',
        special_request: '',
        adhyayan: dropdowns.TRAVEL_ADHYAYAN_ASK_LIST[1].value,
      },
    });

    setExpandedSections({
      toResearchCentre: false,
      fromResearchCentre: false,
    });

    setData((prev: any) => {
      const { travel, ...rest } = prev;
      return rest;
    });
  };

  // Toggle journey section
  const toggleSection = (section: any) => {
    // Update expandedSections state
    setExpandedSections((prev: any) => ({
      ...prev,
      [section]: !prev[section],
    }));

    // Make sure the travel form has the expected structure
    const updatedForm = { ...travelForm };

    // Initialize the section if it doesn't exist
    if (!updatedForm[section]) {
      if (section === 'toResearchCentre') {
        updatedForm.toResearchCentre = {
          active: false,
          date:
            data.room?.startDay ||
            (data.adhyayan && data.adhyayan[0]?.start_date) ||
            moment().add(1, 'days').format('YYYY-MM-DD'),
          pickup: '',
          drop: 'Research Centre',
          arrival_time: '',
          type: dropdowns.BOOKING_TYPE_LIST[0].value,
          luggage: '',
          special_request: '',
        };
      } else if (section === 'fromResearchCentre') {
        updatedForm.fromResearchCentre = {
          active: false,
          date:
            data.room?.endDay ||
            (data.adhyayan && data.adhyayan[0]?.end_date) ||
            moment().add(2, 'days').format('YYYY-MM-DD'),
          pickup: 'Research Centre',
          drop: '',
          arrival_time: '',
          type: dropdowns.BOOKING_TYPE_LIST[0].value,
          luggage: '',
          special_request: '',
          adhyayan: dropdowns.TRAVEL_ADHYAYAN_ASK_LIST[1].value,
        };
      }
    }

    // Toggle active state
    updatedForm[section] = {
      ...updatedForm[section],
      active: !(updatedForm[section]?.active === true),
    };

    setTravelForm(updatedForm);
  };

  return (
    <AddonItem
      onToggle={onToggle}
      onCollapse={resetForm}
      visibleContent={
        <View className="flex flex-row items-center gap-x-4">
          <Image source={icons.travel} className="h-10 w-10" resizeMode="contain" />
          <Text className="font-pmedium">Raj Pravas Booking</Text>
        </View>
      }
      containerStyles={'mt-3'}>
      {/* Journey Options Introduction */}
      <Text className="mb-2 mt-4 font-pmedium text-gray-700">
        Please select your journey direction(s):
      </Text>

      {/* TO RESEARCH CENTRE SECTION */}
      <View className="mt-4 overflow-hidden rounded-lg border border-gray-200">
        <TouchableOpacity
          onPress={() => toggleSection('toResearchCentre')}
          activeOpacity={0.7}
          className="flex-row items-center justify-between bg-gray-50 p-4">
          <View className="flex-row items-center">
            <AntDesign
              name="arrowright"
              size={18}
              color={colors.orange}
              style={{ marginRight: 12 }}
            />
            <Text className="font-pmedium text-base">To Research Centre</Text>
          </View>
          <View className="flex-row items-center">
            {travelForm?.toResearchCentre?.active === true && (
              <Text className="mr-2 font-pmedium text-sm text-green-600">Active</Text>
            )}
            <AntDesign
              name={expandedSections.toResearchCentre ? 'up' : 'down'}
              size={16}
              color={colors.orange}
            />
          </View>
        </TouchableOpacity>

        {expandedSections.toResearchCentre && travelForm?.toResearchCentre && (
          <View className="p-4">
            {/* To Research Centre Date */}
            <FormDisplayField
              text="Date"
              value={
                travelForm.toResearchCentre.date
                  ? moment(travelForm.toResearchCentre.date).format('Do MMMM YYYY')
                  : 'Date'
              }
              otherStyles="mt-2"
              backgroundColor="bg-gray-100"
              onPress={() => setDatePickerVisibility('toRC_travel', true)}
            />
            <DateTimePickerModal
              isVisible={isDatePickerVisible.toRC_travel}
              mode="date"
              date={tempDate.toRC}
              onConfirm={(date: Date) => {
                // Ensure the selected date isn't before tomorrow
                const selectedMoment = moment(date);
                const tomorrow = moment().add(1, 'days');
                const validDate = selectedMoment.isBefore(tomorrow) ? tomorrow : selectedMoment;

                setTravelForm({
                  ...travelForm,
                  toResearchCentre: {
                    ...travelForm.toResearchCentre,
                    date: validDate.format('YYYY-MM-DD'),
                  },
                });
                setDatePickerVisibility('toRC_travel', false);
              }}
              onCancel={() => setDatePickerVisibility('toRC_travel', false)}
              minimumDate={moment().add(1, 'days').toDate()}
            />

            {/* To Research Centre Pickup Location */}
            <CustomSelectBottomSheet
              className="mt-5"
              label="Pickup Location"
              placeholder="Select Pickup Location"
              options={nonResearchCentreOptions}
              selectedValue={travelForm.toResearchCentre.pickup}
              onValueChange={(val: any) => {
                setTravelForm({
                  ...travelForm,
                  toResearchCentre: {
                    ...travelForm.toResearchCentre,
                    pickup: val,
                  },
                });
              }}
              saveKeyInsteadOfValue={false}
            />

            {/* To Research Centre Drop Location (always Research Centre) */}
            <FormDisplayField
              text="Drop Location"
              value="Research Centre"
              otherStyles="mt-5"
              backgroundColor="bg-gray-100"
              inputStyles="font-pmedium text-gray-800 text-lg"
            />

            {/* Flight/Train Time for To Research Centre if needed */}
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
                  inputStyles={'font-pmedium text-lg'}
                  backgroundColor="bg-gray-100"
                  onPress={() => setDatePickerVisibility('toRC_time', true)}
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
                    setDatePickerVisibility('toRC_time', false);
                  }}
                  onCancel={() => setDatePickerVisibility('toRC_time', false)}
                  minimumDate={moment().toDate()}
                />
              </>
            )}

            {/* To Research Centre Booking Type */}
            <CustomSelectBottomSheet
              className="mt-5"
              label="Booking Type"
              placeholder="Booking Type"
              options={dropdowns.BOOKING_TYPE_LIST}
              selectedValue={travelForm.toResearchCentre.type}
              onValueChange={(val: any) =>
                setTravelForm({
                  ...travelForm,
                  toResearchCentre: {
                    ...travelForm.toResearchCentre,
                    type: val,
                  },
                })
              }
              saveKeyInsteadOfValue={false}
            />

            {/* To Research Centre Luggage */}
            <CustomSelectBottomSheet
              className="mt-5"
              label="Luggage"
              placeholder="Select any Luggage"
              options={dropdowns.LUGGAGE_LIST}
              selectedValue={travelForm.toResearchCentre.luggage}
              onValueChange={(val: any) =>
                setTravelForm({
                  ...travelForm,
                  toResearchCentre: {
                    ...travelForm.toResearchCentre,
                    luggage: val,
                  },
                })
              }
              saveKeyInsteadOfValue={false}
            />

            {/* To Research Centre Special Request */}
            <FormField
              text="Any Special Request?"
              value={travelForm.toResearchCentre.special_request}
              handleChangeText={(e: any) =>
                setTravelForm({
                  ...travelForm,
                  toResearchCentre: {
                    ...travelForm.toResearchCentre,
                    special_request: e,
                  },
                })
              }
              otherStyles="mt-5"
              containerStyles="bg-gray-100"
              keyboardType="default"
              placeholder="please specify your request here..."
            />
          </View>
        )}
      </View>

      {/* FROM RESEARCH CENTRE SECTION */}
      <View className="mt-4 overflow-hidden rounded-lg border border-gray-200">
        <TouchableOpacity
          onPress={() => toggleSection('fromResearchCentre')}
          activeOpacity={0.7}
          className="flex-row items-center justify-between bg-gray-50 p-4">
          <View className="flex-row items-center">
            <AntDesign
              name="arrowleft"
              size={18}
              color={colors.orange}
              style={{ marginRight: 12 }}
            />
            <Text className="font-pmedium text-base">From Research Centre</Text>
          </View>
          <View className="flex-row items-center">
            {travelForm?.fromResearchCentre?.active === true && (
              <Text className="mr-2 font-pmedium text-sm text-green-600">Active</Text>
            )}
            <AntDesign
              name={expandedSections.fromResearchCentre ? 'up' : 'down'}
              size={16}
              color={colors.orange}
            />
          </View>
        </TouchableOpacity>

        {expandedSections.fromResearchCentre && travelForm?.fromResearchCentre && (
          <View className="p-4">
            {/* From Research Centre Date */}
            <FormDisplayField
              text="Date"
              value={
                travelForm.fromResearchCentre.date
                  ? moment(travelForm.fromResearchCentre.date).format('Do MMMM YYYY')
                  : 'Date'
              }
              otherStyles="mt-2"
              backgroundColor="bg-gray-100"
              onPress={() => setDatePickerVisibility('fromRC_travel', true)}
            />
            <DateTimePickerModal
              isVisible={isDatePickerVisible.fromRC_travel}
              mode="date"
              date={tempDate.fromRC}
              onConfirm={(date: Date) => {
                // Ensure the selected date isn't before tomorrow
                const selectedMoment = moment(date);
                const tomorrow = moment().add(1, 'days');
                const validDate = selectedMoment.isBefore(tomorrow) ? tomorrow : selectedMoment;

                setTravelForm({
                  ...travelForm,
                  fromResearchCentre: {
                    ...travelForm.fromResearchCentre,
                    date: validDate.format('YYYY-MM-DD'),
                  },
                });
                setDatePickerVisibility('fromRC_travel', false);
              }}
              onCancel={() => setDatePickerVisibility('fromRC_travel', false)}
              minimumDate={moment().add(1, 'days').toDate()}
            />

            {/* From Research Centre Pickup Location (always Research Centre) */}
            <FormDisplayField
              text="Pickup Location"
              value="Research Centre"
              otherStyles="mt-5"
              backgroundColor="bg-gray-100"
              inputStyles="font-pmedium text-gray-800 text-lg"
            />

            {/* From Research Centre Drop Location */}
            <CustomSelectBottomSheet
              className="mt-5"
              label="Drop Location"
              placeholder="Select Drop Location"
              options={nonResearchCentreOptions}
              selectedValue={travelForm.fromResearchCentre.drop}
              onValueChange={(val: any) => {
                setTravelForm({
                  ...travelForm,
                  fromResearchCentre: {
                    ...travelForm.fromResearchCentre,
                    drop: val,
                  },
                });
              }}
              saveKeyInsteadOfValue={false}
            />

            {/* Flight/Train Time for From Research Centre if needed */}
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
                  inputStyles={'font-pmedium text-lg'}
                  backgroundColor="bg-gray-100"
                  onPress={() => setDatePickerVisibility('fromRC_time', true)}
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
                    setDatePickerVisibility('fromRC_time', false);
                  }}
                  onCancel={() => setDatePickerVisibility('fromRC_time', false)}
                  minimumDate={moment().toDate()}
                />
              </>
            )}

            {/* Leaving post adhyayan - only shown for From Research Centre */}
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

            {/* From Research Centre Booking Type */}
            <CustomSelectBottomSheet
              className="mt-5"
              label="Booking Type"
              placeholder="Booking Type"
              options={dropdowns.BOOKING_TYPE_LIST}
              selectedValue={travelForm.fromResearchCentre.type}
              onValueChange={(val: any) =>
                setTravelForm({
                  ...travelForm,
                  fromResearchCentre: {
                    ...travelForm.fromResearchCentre,
                    type: val,
                  },
                })
              }
              saveKeyInsteadOfValue={false}
            />

            {/* From Research Centre Luggage */}
            <CustomSelectBottomSheet
              className="mt-5"
              label="Luggage"
              placeholder="Select any Luggage"
              options={dropdowns.LUGGAGE_LIST}
              selectedValue={travelForm.fromResearchCentre.luggage}
              onValueChange={(val: any) =>
                setTravelForm({
                  ...travelForm,
                  fromResearchCentre: {
                    ...travelForm.fromResearchCentre,
                    luggage: val,
                  },
                })
              }
              saveKeyInsteadOfValue={false}
            />

            {/* From Research Centre Special Request */}
            <FormField
              text="Any Special Request?"
              value={travelForm.fromResearchCentre.special_request}
              handleChangeText={(e: any) =>
                setTravelForm({
                  ...travelForm,
                  fromResearchCentre: {
                    ...travelForm.fromResearchCentre,
                    special_request: e,
                  },
                })
              }
              otherStyles="mt-5"
              containerStyles="bg-gray-100"
              keyboardType="default"
              placeholder="please specify your request here..."
            />
          </View>
        )}
      </View>

      {/* Helper text at the bottom */}
      <Text className="mt-4 text-sm italic text-gray-500">
        You can select either one or both journey directions
      </Text>
    </AddonItem>
  );
};

export default TravelAddon;
