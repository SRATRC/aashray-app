import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants';
import moment from 'moment';

// Renders a travel booking's itinerary: a single dated leg for one-way, or two clearly
// separated Onward / Return legs (route reversed) for a round trip. Shared by the
// self / mumukshu / guest detail cards.

const Route = ({ from, to }: { from?: string; to?: string }) => {
  if (!from || !to) return null;
  return (
    <View className="mt-0.5 flex-row flex-wrap items-center gap-x-1.5">
      <Text className="font-pmedium text-secondary" numberOfLines={1}>
        {from}
      </Text>
      <Ionicons name="arrow-forward" size={14} color={colors.gray_400} />
      <Text className="flex-shrink font-pmedium text-secondary" numberOfLines={1}>
        {to}
      </Text>
    </View>
  );
};

const Leg = ({ label, date, from, to }: { label?: string; date?: any; from?: string; to?: string }) => (
  <View>
    {label ? (
      <Text className="font-pregular text-xs uppercase tracking-wide text-gray-400">{label}</Text>
    ) : null}
    <Text className="text-md font-pmedium">{moment(date).format('Do MMMM, YYYY')}</Text>
    <Route from={from} to={to} />
  </View>
);

const TravelDateDisplay: React.FC<{ date?: any; returnDate?: any; pickup?: any; drop?: any }> = ({
  date,
  returnDate,
  pickup,
  drop,
}) => {
  if (returnDate) {
    return (
      <View className="gap-y-2">
        <Leg label="Onward" date={date} from={pickup} to={drop} />
        <View className="h-px w-full bg-gray-100" />
        <Leg label="Return" date={returnDate} from={drop} to={pickup} />
      </View>
    );
  }
  return <Leg date={date} from={pickup} to={drop} />;
};

export default TravelDateDisplay;
