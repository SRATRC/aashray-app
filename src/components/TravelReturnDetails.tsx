import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import FormDisplayField from './FormDisplayField';
import TravelReturnGroups, { ReturnGroup } from './TravelReturnGroups';
import moment from 'moment';

interface Traveler {
  index: string;
  issuedto: string;
  cardno?: string;
}

interface TravelReturnDetailsProps {
  returnDate: string;
  onwardDate: string;
  returnGroups: ReturnGroup[];
  onChangeReturnGroups: (groups: ReturnGroup[]) => void;
  travelers: Traveler[];
  onPickReturnDate: (date: string) => void;
  onClearReturnDate: () => void;
  locationOptions: { key: string; value: string }[];
  requiresArrivalTime: (pickup: string, drop: string) => boolean;
  // Add-ons pick the return date with the built-in field (true); the standalone travel form
  // picks it via the range calendar, so it hides the field and only shows the group editor.
  showDatePicker?: boolean;
}

// Optional return leg(s) for a round trip. Picking a return date makes the trip round-trip; the
// return defaults to a single group covering everyone and can be split into multiple groups,
// each with its own route, vehicle type, luggage and flight/train time, via "Edit return
// details". Clearing the date returns to one-way.
const TravelReturnDetails = ({
  returnDate,
  onwardDate,
  returnGroups,
  onChangeReturnGroups,
  travelers,
  onPickReturnDate,
  onClearReturnDate,
  locationOptions,
  requiresArrivalTime,
  showDatePicker = true,
}: TravelReturnDetailsProps) => {
  const [isDateVisible, setDateVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const firstGroup = returnGroups[0];

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
          <TouchableOpacity
            className="flex-row items-center justify-between rounded-xl border border-secondary/40 bg-secondary/5 px-3 py-2.5"
            onPress={() => setExpanded((e) => !e)}
            activeOpacity={0.7}>
            <View className="flex-1 pr-2">
              <Text className="font-pmedium text-secondary" numberOfLines={1}>
                Return · {moment(returnDate).format('Do MMMM YYYY')}
              </Text>
              {firstGroup ? (
                <View className="mt-1 flex-row flex-wrap items-center gap-x-1.5">
                  <Text className="font-pregular text-sm text-gray-500" numberOfLines={1}>
                    {firstGroup.pickup}
                  </Text>
                  <Ionicons name="arrow-forward" size={12} color={colors.gray_400} />
                  <Text className="flex-shrink font-pregular text-sm text-gray-500" numberOfLines={1}>
                    {firstGroup.drop}
                  </Text>
                  {returnGroups.length > 1 ? (
                    <Text className="font-pregular text-sm text-gray-500">
                      · {returnGroups.length} groups
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>

            <View className="flex-row items-center gap-x-3">
              <TouchableOpacity
                onPress={onClearReturnDate}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text className="font-pmedium text-sm text-orange-600">Clear</Text>
              </TouchableOpacity>
              <View className="flex-row items-center gap-x-1">
                <Text className="font-pmedium text-sm text-secondary">Edit return details</Text>
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#F1AC09"
                />
              </View>
            </View>
          </TouchableOpacity>

          {expanded ? (
            <TravelReturnGroups
              travelers={travelers}
              groups={returnGroups}
              onChange={onChangeReturnGroups}
              locationOptions={locationOptions}
              requiresArrivalTime={requiresArrivalTime}
            />
          ) : null}
        </View>
      ) : null}
    </>
  );
};

export default TravelReturnDetails;
