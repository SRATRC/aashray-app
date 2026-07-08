import { View, Text, TouchableOpacity } from 'react-native';
import FormDisplayField from './FormDisplayField';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';

interface TravelReturnDateFieldProps {
  travelDate?: any;
  returnDate?: any;
  isVisible: boolean;
  onPress: () => void;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  onClear: () => void;
  bannerWrapperClassName?: string;
}

// Optional return-date picker for the travel add-ons: pick a date to make the trip a round
// trip (return leg = reverse of the onward route), or Clear it to stay one-way.
const TravelReturnDateField: React.FC<TravelReturnDateFieldProps> = ({
  travelDate,
  returnDate,
  isVisible,
  onPress,
  onConfirm,
  onCancel,
  onClear,
  bannerWrapperClassName = 'mt-2',
}) => (
  <>
    <FormDisplayField
      text="Return Date (optional)"
      value={returnDate ? moment(returnDate).format('Do MMMM YYYY') : ''}
      placeholder="Add a return date for a round trip"
      otherStyles="mt-5"
      backgroundColor="bg-gray-100"
      onPress={onPress}
    />
    <DateTimePickerModal
      isVisible={isVisible}
      mode="date"
      date={
        returnDate
          ? moment(returnDate).toDate()
          : travelDate
            ? moment(travelDate).toDate()
            : moment().add(1, 'days').toDate()
      }
      minimumDate={travelDate ? moment(travelDate).toDate() : moment().toDate()}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
    {returnDate ? (
      <View className={`${bannerWrapperClassName} flex-row items-center justify-between`}>
        <Text className="flex-1 font-pregular text-sm text-gray-500">
          Round trip — return (reverse route) on {moment(returnDate).format('DD MMM YYYY')}.
        </Text>
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text className="font-pmedium text-sm text-orange-600">Clear</Text>
        </TouchableOpacity>
      </View>
    ) : null}
  </>
);

export default TravelReturnDateField;
