import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants';
import moment from 'moment';

// Renders a travel booking's date(s): a single date for one-way, or onward ↔ return
// (with a swap icon) for a round trip. Shared by the self/mumukshu/guest detail cards.
const TravelDateDisplay: React.FC<{ date?: any; returnDate?: any }> = ({ date, returnDate }) => {
  if (returnDate) {
    return (
      <View className="flex-row flex-wrap items-center gap-x-2">
        <Text className="text-md font-pmedium">{moment(date).format('Do MMMM, YYYY')}</Text>
        <Ionicons name="swap-horizontal" size={18} color={colors.gray_400} />
        <Text className="text-md font-pmedium">{moment(returnDate).format('Do MMMM, YYYY')}</Text>
      </View>
    );
  }
  return <Text className="text-md font-pmedium">{moment(date).format('Do MMMM, YYYY')}</Text>;
};

export default TravelDateDisplay;
