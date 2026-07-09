import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dropdowns } from '@/src/constants';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import FormDisplayField from './FormDisplayField';
import FormField from './FormField';
import CustomSelectBottomSheet from './CustomSelectBottomSheet';
import TravelReturnGroups, { ReturnGroup, EMPTY_RETURN_GROUP } from './TravelReturnGroups';
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
  // 'flat' for the self flow (one traveler, no groups) renders an identical copy of the onward
  // form; 'grouped' for mumukshu/guest renders the same multi-group form the onward uses.
  variant?: 'flat' | 'grouped';
  // Add-ons pick the return date with the built-in field (true); the standalone travel form
  // picks it via the range calendar, so it hides the field and only shows the summary/editor.
  showDatePicker?: boolean;
}

// Optional return leg for a round trip. Picking a return date makes the trip round-trip. The
// return defaults to a full copy of the onward (reversed route, same everything) and is shown
// as a read-only summary with an "Edit" button that opens the SAME form as the onward,
// pre-filled and fully editable. Clearing the date returns to one-way.
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
  variant = 'grouped',
  showDatePicker = true,
}: TravelReturnDetailsProps) => {
  const [isDateVisible, setDateVisible] = useState(false);
  const [isTimeVisible, setTimeVisible] = useState(false);
  const [editing, setEditing] = useState(false);

  const firstGroup = returnGroups[0];

  // A return group whose route touches an airport/railway but has no flight/train time blocks
  // submission; surface it prominently on the card so the user knows what to fix.
  const needsArrivalTime = returnGroups.some(
    (g) => requiresArrivalTime(g.pickup, g.drop) && !g.arrival_time
  );

  // Flat variant edits the single return group directly (self flow: exactly one traveler).
  const updateFlat = (patch: Partial<ReturnGroup>) => {
    const base = firstGroup ?? { ...EMPTY_RETURN_GROUP, travelerIndices: ['0'] };
    onChangeReturnGroups([{ ...base, ...patch }]);
  };

  const luggageSummary = (g: ReturnGroup) =>
    g.luggage && g.luggage.length > 0 ? g.luggage.join(', ') : 'No luggage';

  const renderGroupSummary = (g: ReturnGroup, key: number, count: number) => (
    <View key={key} className={count > 1 ? 'mt-3' : 'mt-2'}>
      {count > 1 ? (
        <Text className="font-pmedium text-xs uppercase tracking-wide text-gray-400">
          Group {key + 1}
        </Text>
      ) : null}
      <View className="mt-1 flex-row flex-wrap items-center gap-x-1.5">
        {g.type ? <Text className="font-pmedium text-black">{g.type}</Text> : null}
        {g.type && (g.pickup || g.drop) ? <Text className="text-gray-400">|</Text> : null}
        {g.pickup || g.drop ? (
          <Text className="flex-shrink font-pregular text-gray-600" numberOfLines={1}>
            {g.pickup} to {g.drop}
          </Text>
        ) : null}
      </View>
      {g.total_people ? (
        <Text className="mt-0.5 font-pregular text-sm text-gray-500">
          Total people: {g.total_people}
        </Text>
      ) : null}
      <Text className="mt-0.5 font-pregular text-sm text-gray-500">
        Luggage: {luggageSummary(g)}
        {g.comments ? `  |  ${g.comments}` : ''}
      </Text>
      {requiresArrivalTime(g.pickup, g.drop) ? (
        g.arrival_time ? (
          <Text className="mt-0.5 font-pregular text-sm text-gray-500">
            Flight/Train Time: {moment(g.arrival_time, 'HH:mm').format('h:mm a')}
          </Text>
        ) : (
          <View className="mt-1 flex-row items-center gap-x-1">
            <Ionicons name="alert-circle" size={13} color="#EA580C" />
            <Text className="font-pmedium text-sm text-orange-700">
              Flight/Train Time required. Tap Edit to add it.
            </Text>
          </View>
        )
      ) : null}
    </View>
  );

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
        <View
          className={`mt-4 rounded-xl border p-4 ${
            needsArrivalTime ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-gray-50'
          }`}>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-psemibold text-black">Return trip</Text>
              <Text className="mt-0.5 font-pregular text-sm text-gray-500">
                {moment(returnDate).format('Do MMMM YYYY')}
              </Text>
            </View>
            <View className="flex-row items-center gap-x-4">
              <TouchableOpacity
                onPress={onClearReturnDate}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text className="font-pmedium text-sm text-orange-600">Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditing((e) => !e)}
                className="flex-row items-center gap-x-1 rounded-lg bg-secondary px-3 py-1.5"
                activeOpacity={0.7}>
                <Ionicons name={editing ? 'checkmark' : 'create-outline'} size={14} color="white" />
                <Text className="font-pmedium text-sm text-white">{editing ? 'Done' : 'Edit'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {!editing ? (
            <View>
              {returnGroups.length > 0 ? (
                returnGroups.map((g, i) => renderGroupSummary(g, i, returnGroups.length))
              ) : (
                <Text className="mt-2 font-pregular text-sm text-gray-500">
                  Same details as the onward trip, reversed.
                </Text>
              )}
            </View>
          ) : variant === 'flat' ? (
            // Self flow: identical copy of the onward flat form, pre-filled, editable.
            <View>
              <CustomSelectBottomSheet
                className="mt-5"
                label="Booking Type"
                placeholder="Booking Type"
                options={dropdowns.BOOKING_TYPE_LIST}
                selectedValue={firstGroup?.type}
                onValueChange={(val: any) => updateFlat({ type: val })}
                saveKeyInsteadOfValue={false}
              />

              {firstGroup?.type == dropdowns.BOOKING_TYPE_LIST[1].value && (
                <FormField
                  text="Total People"
                  value={firstGroup?.total_people}
                  handleChangeText={(e: any) => updateFlat({ total_people: e })}
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
                selectedValue={firstGroup?.pickup}
                onValueChange={(val: any) => {
                  if (val === 'Research Centre') {
                    const patch: Partial<ReturnGroup> = { pickup: val };
                    if (firstGroup?.drop === 'Research Centre') patch.drop = '';
                    if (!requiresArrivalTime(val, patch.drop ?? firstGroup?.drop ?? ''))
                      patch.arrival_time = '';
                    updateFlat(patch);
                  } else {
                    const patch: Partial<ReturnGroup> = { pickup: val, drop: 'Research Centre' };
                    if (!requiresArrivalTime(val, 'Research Centre')) patch.arrival_time = '';
                    updateFlat(patch);
                  }
                }}
                saveKeyInsteadOfValue={false}
              />

              <CustomSelectBottomSheet
                className="mt-5"
                label="Drop Location"
                placeholder="Select Drop Location"
                options={locationOptions}
                selectedValue={firstGroup?.drop}
                onValueChange={(val: any) => {
                  if (val === 'Research Centre') {
                    const patch: Partial<ReturnGroup> = { drop: val };
                    if (firstGroup?.pickup === 'Research Centre') patch.pickup = '';
                    if (!requiresArrivalTime(patch.pickup ?? firstGroup?.pickup ?? '', val))
                      patch.arrival_time = '';
                    updateFlat(patch);
                  } else {
                    const patch: Partial<ReturnGroup> = { drop: val, pickup: 'Research Centre' };
                    if (!requiresArrivalTime('Research Centre', val)) patch.arrival_time = '';
                    updateFlat(patch);
                  }
                }}
                saveKeyInsteadOfValue={false}
              />

              {firstGroup && requiresArrivalTime(firstGroup.pickup, firstGroup.drop) ? (
                <>
                  <FormDisplayField
                    text="Flight/Train Time"
                    value={
                      firstGroup.arrival_time
                        ? moment(firstGroup.arrival_time, 'HH:mm').format('h:mm a')
                        : ''
                    }
                    placeholder="Flight/Train Time"
                    otherStyles="mt-5"
                    inputStyles={'font-pmedium text-black text-lg'}
                    backgroundColor="bg-gray-100"
                    onPress={() => setTimeVisible(true)}
                  />
                  <DateTimePickerModal
                    isVisible={isTimeVisible}
                    mode="time"
                    date={
                      firstGroup.arrival_time
                        ? moment(firstGroup.arrival_time, 'HH:mm').toDate()
                        : new Date()
                    }
                    onConfirm={(date: Date) => {
                      updateFlat({ arrival_time: moment(date).format('HH:mm') });
                      setTimeVisible(false);
                    }}
                    onCancel={() => setTimeVisible(false)}
                  />
                </>
              ) : null}

              <CustomSelectBottomSheet
                className="mt-5"
                label="Luggage"
                placeholder="Select any Luggage"
                options={dropdowns.LUGGAGE_LIST}
                selectedValues={firstGroup?.luggage}
                onValuesChange={(val: any) => updateFlat({ luggage: val })}
                saveKeyInsteadOfValue={false}
                multiSelect={true}
                confirmButtonText="Select"
                maxSelectedDisplay={3}
              />

              <FormField
                text="Comments"
                value={firstGroup?.comments}
                handleChangeText={(e: any) => updateFlat({ comments: e })}
                otherStyles="mt-7"
                containerStyles="bg-gray-100"
                keyboardType="default"
                placeholder="Please specify a location if 'Other' is selected, or provide any additional requests here..."
                multiline={true}
                numberOfLines={2}
                inputStyles={'font-pmedium text-black text-lg'}
              />
            </View>
          ) : (
            // Mumukshu/guest flow: the same multi-group form the onward uses, pre-filled.
            <TravelReturnGroups
              travelers={travelers}
              groups={returnGroups}
              onChange={onChangeReturnGroups}
              locationOptions={locationOptions}
              requiresArrivalTime={requiresArrivalTime}
            />
          )}
        </View>
      ) : null}
    </>
  );
};

export default TravelReturnDetails;
