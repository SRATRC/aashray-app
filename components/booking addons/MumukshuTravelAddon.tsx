import React, { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { icons, colors, dropdowns } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import CustomSelectBottomSheet from '../CustomSelectBottomSheet';
import HorizontalSeparator from '../HorizontalSeparator';
import FormDisplayField from '../FormDisplayField';
import FormField from '../FormField';
import AddonItem from '../AddonItem';
import moment from 'moment';
import handleAPICall from '@/utils/HandleApiCall';

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
  const { user } = useAuthStore();
  const [activeMumukshuIndex, setActiveMumukshuIndex] = useState(null);

  const [tempTravelDate, setTempTravelDate] = useState(
    travelForm.date ? moment(travelForm.date).toDate() : moment().add(1, 'days').toDate()
  );

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
    queryKey: ['utsavs', user.cardno],
    queryFn: () => fetchUtsavs({ pageParam: 1 }),
    staleTime: 1000 * 60 * 30,
    enabled: !!travelForm.date,
  });

  const isUtsavDate = useCallback(
    (selectedDate: string) => {
      if (!utsavData || !selectedDate) return false;
      const formattedDate = moment(selectedDate).format('YYYY-MM-DD');
      const monthDataArray = utsavData.pages?.[0] || [];
      return monthDataArray.some((monthData: any) =>
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
        otherStyles="mt-7"
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
          const today = moment().format('YYYY-MM-DD');
          const validDate = selectedMoment.isBefore(today)
            ? today
            : selectedMoment.format('YYYY-MM-DD');

          setTravelForm({
            ...travelForm,
            date: validDate,
          });
          setDatePickerVisibility('travel', false);
        }}
        onCancel={() => setDatePickerVisibility('travel', false)}
        minimumDate={moment().toDate()}
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

          <CustomSelectBottomSheet
            className="mt-7"
            label="Booking Type"
            placeholder="Booking Type"
            options={dropdowns.BOOKING_TYPE_LIST}
            selectedValue={assignment.type}
            onValueChange={(val: any) => updateTravelForm(index, 'type', val)}
            saveKeyInsteadOfValue={false}
          />

          {assignment.type == dropdowns.BOOKING_TYPE_LIST[1].value && (
            <FormField
              text="Total People"
              value={assignment.total_people}
              handleChangeText={(e: any) => updateTravelForm(index, 'total_people', e)}
              otherStyles="mt-7"
              containerStyles="bg-gray-100"
              keyboardType="number-pad"
              placeholder="please specify total people here..."
              inputStyles={'font-pmedium text-black text-lg'}
            />
          )}

          <CustomSelectBottomSheet
            className="mt-5"
            label="Pickup Location"
            placeholder="Select Pickup Location"
            options={getLocationOptions(travelForm.date)}
            selectedValue={assignment.pickup}
            onValueChange={(val: any) => {
              updateTravelForm(index, 'pickup', val);
              if (val !== 'Research Centre') {
                updateTravelForm(index, 'drop', 'Research Centre');
              }
            }}
            saveKeyInsteadOfValue={false}
          />

          <CustomSelectBottomSheet
            className="mt-5"
            label="Drop Location"
            placeholder="Select Drop Location"
            options={getLocationOptions(travelForm.date)}
            selectedValue={assignment.drop}
            onValueChange={(val: any) => {
              updateTravelForm(index, 'drop', val);
              if (val !== 'Research Centre') {
                updateTravelForm(index, 'pickup', 'Research Centre');
              }
            }}
            saveKeyInsteadOfValue={false}
          />

          {(travelForm.mumukshuGroup[index].pickup &&
            dropdowns.LOCATION_LIST.find(
              (loc) =>
                loc.value === travelForm.mumukshuGroup[index].pickup &&
                (loc.key.toLowerCase().includes('railway') ||
                  loc.key.toLowerCase().includes('airport'))
            )) ||
          (travelForm.mumukshuGroup[index].drop &&
            dropdowns.LOCATION_LIST.find(
              (loc) =>
                loc.value === travelForm.mumukshuGroup[index].drop &&
                (loc.key.toLowerCase().includes('railway') ||
                  loc.key.toLowerCase().includes('airport'))
            )) ? (
            <>
              <FormDisplayField
                text="Flight/Train Time"
                value={
                  travelForm.mumukshuGroup[index].arrival_time
                    ? moment(travelForm.mumukshuGroup[index].arrival_time).format('h:mm a')
                    : 'Flight/Train Time'
                }
                otherStyles="mt-5"
                inputStyles={'font-pmedium text-lg'}
                backgroundColor="bg-gray-100"
                onPress={() => {
                  setDatePickerVisibility('travel_time', true);
                  setActiveMumukshuIndex(index);
                }}
              />
              <DateTimePickerModal
                isVisible={isDatePickerVisible.travel_time && activeMumukshuIndex === index}
                mode="time"
                date={
                  travelForm.mumukshuGroup[index].arrival_time
                    ? moment(travelForm.mumukshuGroup[index].arrival_time).toDate()
                    : new Date()
                }
                onConfirm={(date: Date) => {
                  updateTravelForm(index, 'arrival_time', date.toISOString());
                  setDatePickerVisibility('travel_time', false);
                }}
                onCancel={() => setDatePickerVisibility('travel_time', false)}
                minimumDate={
                  travelForm.mumukshuGroup[index].date
                    ? moment(travelForm.mumukshuGroup[index].date).toDate()
                    : moment().toDate()
                }
              />
            </>
          ) : null}

          <CustomSelectBottomSheet
            className="mt-5"
            label="Luggage"
            placeholder="Select any Luggage"
            options={dropdowns.LUGGAGE_LIST}
            selectedValues={assignment.luggage}
            onValuesChange={(val: any) => updateTravelForm(index, 'luggage', val)}
            saveKeyInsteadOfValue={false}
            multiSelect={true}
            confirmButtonText="Select"
            maxSelectedDisplay={3}
          />

          {assignment.pickup == dropdowns.LOCATION_LIST[0].value && (
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
            otherStyles="mt-7"
            containerStyles="bg-gray-100"
            keyboardType="default"
            placeholder="Please specify a location if 'Other' is selected, or provide any additional requests here..."
            multiline={true}
            numberOfLines={2}
            inputStyles={'font-pmedium text-black text-lg'}
          />
        </View>
      ))}

      <TouchableOpacity
        className={`mt-4 w-full flex-row items-center justify-start gap-x-1 ${
          !hasAvailableMumukshus() ? 'opacity-50' : ''
        }`}
        onPress={hasAvailableMumukshus() ? addTravelForm : undefined}
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
