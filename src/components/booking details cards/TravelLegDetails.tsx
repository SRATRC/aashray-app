import { View, Text } from 'react-native';
import { FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants';
import HorizontalSeparator from '../HorizontalSeparator';
import moment from 'moment';

// One travel group's full detail: route, booking type, total people (full car), luggage,
// comments and flight/train time. Used by TravelLegDetails to render every group of a leg
// (a leg can have more than one group when travelers were split across vehicles).
export interface TravelLegGroup {
  pickup?: string;
  drop?: string;
  type?: string;
  luggage?: string[];
  special_request?: string;
  arrival_time?: string;
  total_people?: number | string | null;
}

const TravelGroupDetail: React.FC<{ group: TravelLegGroup }> = ({ group }) => (
  <>
    {(group.pickup || group.drop) && (
      <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
        <Ionicons name="navigate" size={14} color={colors.gray_400} />
        <Text className="font-pregular text-gray-400">Route:</Text>
        <Text className="flex-1 font-pmedium text-black" numberOfLines={1}>
          {group.pickup} to {group.drop}
        </Text>
      </View>
    )}
    <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
      <FontAwesome5 name="car" size={14} color={colors.gray_400} />
      <Text className="font-pregular text-gray-400">Booking Type:</Text>
      <Text className="font-pmedium text-black">{group.type}</Text>
    </View>
    {group.total_people ? (
      <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
        <Ionicons name="people" size={14} color={colors.gray_400} />
        <Text className="font-pregular text-gray-400">Total People:</Text>
        <Text className="font-pmedium text-black">{group.total_people}</Text>
      </View>
    ) : null}
    <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
      <FontAwesome5 name="luggage-cart" size={14} color={colors.gray_400} />
      <Text className="font-pregular text-gray-400">Luggage:</Text>
      <Text className="font-pmedium text-black">
        {group.luggage && group.luggage.length > 0 ? group.luggage.join(', ') : 'No luggage selected'}
      </Text>
    </View>
    <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
      <FontAwesome name="comment" size={14} color={colors.gray_400} />
      <Text className="font-pregular text-gray-400">Comments:</Text>
      <Text className="flex-1 font-pmedium text-black" numberOfLines={1}>
        {group.special_request ? group.special_request : 'None'}
      </Text>
    </View>
    {group.arrival_time ? (
      <View className="mb-4 flex flex-row items-center gap-x-2 px-6">
        <Ionicons name="time" size={16} color={colors.gray_400} />
        <Text className="font-pregular text-gray-400">Flight/Train Time:</Text>
        <Text className="font-pmedium text-black">
          {moment(group.arrival_time, 'HH:mm').format('hh:mm A')}
        </Text>
      </View>
    ) : null}
  </>
);

// Renders every group belonging to one leg (Onward or Return) of a travel booking, each with
// its own route/type/luggage/comments/time. Shared by the self / mumukshu / guest detail cards
// so round-trip bookings show both legs in full instead of only the first onward group.
const TravelLegDetails: React.FC<{ label: string; groups?: TravelLegGroup[] }> = ({
  label,
  groups,
}) => {
  if (!groups || groups.length === 0) return null;
  return (
    <View className="mb-4">
      <Text className="mb-3 px-6 font-pmedium text-xs uppercase tracking-wide text-gray-400">
        {label}
      </Text>
      {groups.map((group, index) => (
        <View key={index}>
          {index > 0 && <HorizontalSeparator otherStyles={'mx-6 mb-4'} />}
          <TravelGroupDetail group={group} />
        </View>
      ))}
    </View>
  );
};

export default TravelLegDetails;
