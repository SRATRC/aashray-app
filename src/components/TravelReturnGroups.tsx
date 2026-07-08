import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { icons, colors, dropdowns } from '@/src/constants';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import CustomSelectBottomSheet from './CustomSelectBottomSheet';
import HorizontalSeparator from './HorizontalSeparator';
import FormDisplayField from './FormDisplayField';
import FormField from './FormField';
import moment from 'moment';

export interface ReturnGroup {
  pickup: string;
  drop: string;
  type: string;
  luggage: string[];
  arrival_time: string;
  comments: string;
  total_people: number | null;
  travelerIndices: string[]; // indices into `travelers`, each traveler in exactly one group
}

interface Traveler {
  index: string;
  issuedto: string;
  cardno?: string;
}

interface TravelReturnGroupsProps {
  travelers: Traveler[]; // the onward travelers (same people)
  groups: ReturnGroup[];
  onChange: (groups: ReturnGroup[]) => void;
  locationOptions: { key: string; value: string }[];
  requiresArrivalTime: (pickup: string, drop: string) => boolean;
}

export const EMPTY_RETURN_GROUP: ReturnGroup = {
  pickup: '',
  drop: '',
  type: '',
  luggage: [],
  arrival_time: '',
  comments: '',
  total_people: null,
  travelerIndices: [],
};

const TravelReturnGroups: React.FC<TravelReturnGroupsProps> = ({
  travelers,
  groups,
  onChange,
  locationOptions,
  requiresArrivalTime,
}) => {
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);

  const getAvailableTravelers = (currentGroupIndex: number) => {
    // Get all selected traveler indices from other groups
    const selectedIndices = groups.reduce((acc: string[], group, idx) => {
      if (idx !== currentGroupIndex) {
        return [...acc, ...group.travelerIndices];
      }
      return acc;
    }, []);

    // Filter out travelers that are already selected in other groups
    return travelers
      .filter((traveler) => !selectedIndices.includes(traveler.index))
      .map((traveler) => ({ key: traveler.index, value: traveler.issuedto }));
  };

  const hasAvailableTravelers = () => {
    // Get all selected traveler indices from all groups
    const selectedIndices = groups.flatMap((group) => group.travelerIndices);
    // Check if there are any unselected travelers
    return travelers.some((traveler) => !selectedIndices.includes(traveler.index));
  };

  const updateGroup = (index: number, patch: Partial<ReturnGroup>) => {
    const nextGroups = groups.map((group, idx) => (idx === index ? { ...group, ...patch } : group));
    onChange(nextGroups);
  };

  const addGroup = () => {
    onChange([...groups, { ...EMPTY_RETURN_GROUP }]);
  };

  const removeGroup = (index: number) => () => {
    onChange(groups.filter((_, idx) => idx !== index));
  };

  return (
    <View>
      {groups.map((group, index) => (
        <View key={index} style={{ marginBottom: 15 }}>
          {index > 0 && (
            <View>
              <HorizontalSeparator otherStyles={'w-full mt-3'} />
              <TouchableOpacity
                onPress={removeGroup(index)}
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
            label={`Return group - ${index + 1}`}
            placeholder="Select Travelers"
            options={getAvailableTravelers(index)}
            selectedValues={group.travelerIndices}
            onValuesChange={(val: any) => updateGroup(index, { travelerIndices: val })}
            multiSelect={true}
            confirmButtonText="Select"
          />

          <CustomSelectBottomSheet
            className="mt-7"
            label="Booking Type"
            placeholder="Booking Type"
            options={dropdowns.BOOKING_TYPE_LIST}
            selectedValue={group.type}
            onValueChange={(val: any) => updateGroup(index, { type: val })}
            saveKeyInsteadOfValue={false}
          />

          {group.type == dropdowns.BOOKING_TYPE_LIST[1].value && (
            <FormField
              text="Total People"
              value={group.total_people}
              handleChangeText={(e: any) => updateGroup(index, { total_people: e })}
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
            options={locationOptions}
            selectedValue={group.pickup}
            onValueChange={(val: any) => {
              if (val === 'Research Centre') {
                // If selecting Research Centre as pickup, drop must be something else
                const patch: Partial<ReturnGroup> = { pickup: val };
                if (group.drop === 'Research Centre') patch.drop = '';
                if (!requiresArrivalTime(val, patch.drop ?? group.drop)) patch.arrival_time = '';
                updateGroup(index, patch);
              } else {
                // If selecting anything else as pickup, drop must be Research Centre
                const patch: Partial<ReturnGroup> = { pickup: val, drop: 'Research Centre' };
                if (!requiresArrivalTime(val, 'Research Centre')) patch.arrival_time = '';
                updateGroup(index, patch);
              }
            }}
            saveKeyInsteadOfValue={false}
          />

          <CustomSelectBottomSheet
            className="mt-5"
            label="Drop Location"
            placeholder="Select Drop Location"
            options={locationOptions}
            selectedValue={group.drop}
            onValueChange={(val: any) => {
              if (val === 'Research Centre') {
                // If selecting Research Centre as drop, pickup must be something else
                const patch: Partial<ReturnGroup> = { drop: val };
                if (group.pickup === 'Research Centre') patch.pickup = '';
                if (!requiresArrivalTime(patch.pickup ?? group.pickup, val)) patch.arrival_time = '';
                updateGroup(index, patch);
              } else {
                // If selecting anything else as drop, pickup must be Research Centre
                const patch: Partial<ReturnGroup> = { drop: val, pickup: 'Research Centre' };
                if (!requiresArrivalTime('Research Centre', val)) patch.arrival_time = '';
                updateGroup(index, patch);
              }
            }}
            saveKeyInsteadOfValue={false}
          />

          {requiresArrivalTime(group.pickup, group.drop) ? (
            <>
              <FormDisplayField
                text="Flight/Train Time"
                value={
                  group.arrival_time ? moment(group.arrival_time, 'HH:mm').format('h:mm a') : ''
                }
                placeholder="Flight/Train Time"
                otherStyles="mt-5"
                inputStyles={'font-pmedium text-black text-lg'}
                backgroundColor="bg-gray-100"
                onPress={() => {
                  setTimePickerVisible(true);
                  setActiveGroupIndex(index);
                }}
              />
              <DateTimePickerModal
                isVisible={isTimePickerVisible && activeGroupIndex === index}
                mode="time"
                date={
                  group.arrival_time ? moment(group.arrival_time, 'HH:mm').toDate() : new Date()
                }
                onConfirm={(date: Date) => {
                  const timeOnly = moment(date).format('HH:mm');
                  updateGroup(index, { arrival_time: timeOnly });
                  setTimePickerVisible(false);
                }}
                onCancel={() => setTimePickerVisible(false)}
              />
            </>
          ) : null}

          <CustomSelectBottomSheet
            className="mt-5"
            label="Luggage"
            placeholder="Select any Luggage"
            options={dropdowns.LUGGAGE_LIST}
            selectedValues={group.luggage}
            onValuesChange={(val: any) => updateGroup(index, { luggage: val })}
            saveKeyInsteadOfValue={false}
            multiSelect={true}
            confirmButtonText="Select"
            maxSelectedDisplay={3}
          />

          <FormField
            text="Comments"
            value={group.comments}
            handleChangeText={(e: any) => updateGroup(index, { comments: e })}
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
          !hasAvailableTravelers() ? 'opacity-50' : ''
        }`}
        onPress={hasAvailableTravelers() ? addGroup : undefined}
        disabled={!hasAvailableTravelers()}>
        <Image
          source={icons.addon}
          tintColor={colors.black}
          className="h-4 w-4"
          resizeMode="contain"
        />
        <Text className="text-base text-black underline">Add group</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TravelReturnGroups;
