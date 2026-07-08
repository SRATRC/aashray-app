import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, dropdowns } from '@/src/constants';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import FormDisplayField from './FormDisplayField';
import CustomSelectBottomSheet from './CustomSelectBottomSheet';
import moment from 'moment';

const RESEARCH_CENTRE = 'Research Centre';

export interface ReturnLeg {
  pickup: string;
  drop: string;
  type: string;
  luggage: string[];
  arrival_time: string;
}

interface TravelReturnDetailsProps {
  returnDate: string;
  onwardDate: string;
  returnLeg: ReturnLeg;
  onChangeReturnLeg: (patch: Partial<ReturnLeg>) => void;
  onPickReturnDate: (date: string) => void;
  onClearReturnDate: () => void;
  locationOptions: { key: string; value: string }[];
  requiresArrivalTime: (pickup: string, drop: string) => boolean;
  // Add-ons pick the return date with the built-in field (true); the standalone travel form
  // picks it via the range calendar, so it hides the field and only shows the leg editor.
  showDatePicker?: boolean;
}

// Optional return leg for a round trip. Picking a return date makes the trip round-trip; the
// return defaults to the reverse of the onward route and can be individually edited (route,
// vehicle type, luggage, flight/train time) via "Edit return details". Clearing the date
// returns to one-way. Return editing is group/trip level, not per person.
const TravelReturnDetails = ({
  returnDate,
  onwardDate,
  returnLeg,
  onChangeReturnLeg,
  onPickReturnDate,
  onClearReturnDate,
  locationOptions,
  requiresArrivalTime,
  showDatePicker = true,
}: TravelReturnDetailsProps) => {
  const [isDateVisible, setDateVisible] = useState(false);
  const [isTimeVisible, setTimeVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const showTime = requiresArrivalTime(returnLeg.pickup, returnLeg.drop);

  // Keep exactly one endpoint as Research Centre (mirrors the onward selectors).
  const routePatch = (field: 'pickup' | 'drop', value: string): Partial<ReturnLeg> => {
    const other = field === 'pickup' ? 'drop' : 'pickup';
    const patch: any = { [field]: value };
    if (value === RESEARCH_CENTRE) {
      if (returnLeg[other] === RESEARCH_CENTRE) patch[other] = '';
    } else {
      patch[other] = RESEARCH_CENTRE;
    }
    const nextPickup = field === 'pickup' ? value : patch.pickup ?? returnLeg.pickup;
    const nextDrop = field === 'drop' ? value : patch.drop ?? returnLeg.drop;
    if (!requiresArrivalTime(nextPickup, nextDrop)) patch.arrival_time = '';
    return patch;
  };

  return (
    <>
      {showDatePicker ? (
        <>
          <FormDisplayField
            text="Return Date (optional)"
            value={returnDate ? moment(returnDate).format('Do MMMM YYYY') : ''}
            placeholder="Add a return date for a round trip"
            otherStyles="mt-5"
            backgroundColor="bg-gray-100"
            inputStyles="font-pmedium text-black text-lg"
            onPress={() => setDateVisible(true)}
          />
          <DateTimePickerModal
            isVisible={isDateVisible}
            mode="date"
            date={
              returnDate
                ? moment(returnDate).toDate()
                : onwardDate
                  ? moment(onwardDate).toDate()
                  : moment().add(1, 'days').toDate()
            }
            minimumDate={onwardDate ? moment(onwardDate).toDate() : moment().toDate()}
            onConfirm={(d: Date) => {
              onPickReturnDate(moment(d).format('YYYY-MM-DD'));
              setDateVisible(false);
            }}
            onCancel={() => setDateVisible(false)}
          />
        </>
      ) : null}

      {returnDate ? (
        <View className="mt-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 flex-row flex-wrap items-center gap-x-1.5">
              <Text className="font-pmedium text-secondary" numberOfLines={1}>
                {returnLeg.pickup}
              </Text>
              <Ionicons name="arrow-forward" size={14} color={colors.gray_400} />
              <Text className="flex-shrink font-pmedium text-secondary" numberOfLines={1}>
                {returnLeg.drop}
              </Text>
              <Text className="font-pregular text-sm text-gray-500">
                · {moment(returnDate).format('DD MMM YYYY')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClearReturnDate}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text className="font-pmedium text-sm text-orange-600">Clear</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity className="mt-1.5" onPress={() => setExpanded((e) => !e)}>
            <Text className="font-pmedium text-sm text-secondary">
              {expanded ? 'Hide return details' : 'Edit return details'}
            </Text>
          </TouchableOpacity>

          {expanded ? (
            <View>
              <CustomSelectBottomSheet
                className="mt-5"
                label="Return Pickup Location"
                placeholder="Select Pickup Location"
                options={locationOptions}
                selectedValue={returnLeg.pickup}
                onValueChange={(val: any) => onChangeReturnLeg(routePatch('pickup', val))}
                saveKeyInsteadOfValue={false}
              />
              <CustomSelectBottomSheet
                className="mt-7"
                label="Return Drop Location"
                placeholder="Select Drop Location"
                options={locationOptions}
                selectedValue={returnLeg.drop}
                onValueChange={(val: any) => onChangeReturnLeg(routePatch('drop', val))}
                saveKeyInsteadOfValue={false}
              />
              <CustomSelectBottomSheet
                className="mt-7"
                label="Return Booking Type"
                placeholder="Booking Type"
                options={dropdowns.BOOKING_TYPE_LIST}
                selectedValue={returnLeg.type}
                onValueChange={(val: any) => onChangeReturnLeg({ type: val })}
                saveKeyInsteadOfValue={false}
              />
              {showTime ? (
                <>
                  <FormDisplayField
                    text="Return Flight/Train Time"
                    value={
                      returnLeg.arrival_time
                        ? moment(returnLeg.arrival_time, 'HH:mm').format('h:mm a')
                        : ''
                    }
                    placeholder="Return Flight/Train Time"
                    otherStyles="mt-5"
                    inputStyles="font-pmedium text-black text-lg"
                    backgroundColor="bg-gray-100"
                    onPress={() => setTimeVisible(true)}
                  />
                  <DateTimePickerModal
                    isVisible={isTimeVisible}
                    mode="time"
                    date={
                      returnLeg.arrival_time
                        ? moment(returnLeg.arrival_time, 'HH:mm').toDate()
                        : new Date()
                    }
                    onConfirm={(d: Date) => {
                      onChangeReturnLeg({ arrival_time: moment(d).format('HH:mm') });
                      setTimeVisible(false);
                    }}
                    onCancel={() => setTimeVisible(false)}
                  />
                </>
              ) : null}
              <CustomSelectBottomSheet
                className="mt-7"
                label="Return Luggage"
                placeholder="Select any Luggage"
                options={dropdowns.LUGGAGE_LIST}
                selectedValues={returnLeg.luggage}
                onValuesChange={(val: any) => onChangeReturnLeg({ luggage: val })}
                saveKeyInsteadOfValue={false}
                multiSelect={true}
                confirmButtonText="Select"
                maxSelectedDisplay={3}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </>
  );
};

export default TravelReturnDetails;
