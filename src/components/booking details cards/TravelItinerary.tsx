import { View, Text } from 'react-native';
import { FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants';
import moment from 'moment';

// Compact, boarding-pass style itinerary for a travel booking. Each leg shows its date, a
// prominent From -> To route, and a single meta line (time / vehicle / luggage), with comments
// only when present. One leg for one-way; Onward + Return for a round trip. A leg with more
// than one group (travelers split across vehicles) lists each group. Replaces the old
// TravelDateDisplay header + verbose TravelLegDetails rows so the card stays compact.

export interface ItineraryGroup {
  pickup?: string;
  drop?: string;
  type?: string;
  luggage?: string[];
  special_request?: string;
  arrival_time?: string;
  total_people?: number | string | null;
}

export interface ItineraryLeg {
  label?: string;
  date?: any;
  groups?: ItineraryGroup[];
}

const Meta = ({ icon, text }: { icon: React.ReactNode; text?: string }) =>
  text ? (
    <View className="flex-row items-center gap-x-1.5">
      {icon}
      <Text className="font-pregular text-xs text-gray-600">{text}</Text>
    </View>
  ) : null;

const GroupBlock = ({
  group,
  index,
  total,
}: {
  group: ItineraryGroup;
  index: number;
  total: number;
}) => {
  const vehicle = group.total_people ? `${group.type} · ${group.total_people} people` : group.type;
  const luggage =
    group.luggage && group.luggage.length > 0 ? group.luggage.join(', ') : undefined;

  return (
    <View className={index > 0 ? 'mt-3' : ''}>
      {total > 1 ? (
        <Text className="mb-1 font-pmedium text-[11px] uppercase tracking-wide text-gray-300">
          Group {index + 1}
        </Text>
      ) : null}

      <View className="flex-row items-center">
        <Text className="flex-1 font-psemibold text-[15px] leading-5 text-black" numberOfLines={2}>
          {group.pickup}
        </Text>
        <Ionicons
          name="arrow-forward"
          size={16}
          color={colors.orange}
          style={{ marginHorizontal: 8 }}
        />
        <Text
          className="flex-1 text-right font-psemibold text-[15px] leading-5 text-black"
          numberOfLines={2}>
          {group.drop}
        </Text>
      </View>

      <View className="mt-2 flex-row flex-wrap items-center gap-x-4 gap-y-1">
        <Meta
          icon={<Ionicons name="time-outline" size={13} color={colors.gray_400} />}
          text={group.arrival_time ? moment(group.arrival_time, 'HH:mm').format('h:mm A') : undefined}
        />
        <Meta
          icon={<FontAwesome5 name="car" size={12} color={colors.gray_400} />}
          text={vehicle}
        />
        <Meta
          icon={<FontAwesome5 name="suitcase" size={12} color={colors.gray_400} />}
          text={luggage}
        />
      </View>

      {group.special_request ? (
        <View className="mt-1.5 flex-row items-center gap-x-1.5">
          <FontAwesome name="comment" size={11} color={colors.gray_400} />
          <Text className="flex-1 font-pregular text-xs text-gray-500" numberOfLines={1}>
            {group.special_request}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const Leg = ({ label, date, groups }: ItineraryLeg) => (
  <View>
    <View className="flex-row items-center justify-between">
      {label ? (
        <Text className="font-pmedium text-[11px] uppercase tracking-widest text-gray-400">
          {label}
        </Text>
      ) : (
        <View />
      )}
      {date ? (
        <Text className="font-pmedium text-xs text-gray-500">
          {moment(date).format('ddd, D MMM YYYY')}
        </Text>
      ) : null}
    </View>
    <View className="mt-2">
      {(groups || []).map((g, i) => (
        <GroupBlock key={i} group={g} index={i} total={(groups || []).length} />
      ))}
    </View>
  </View>
);

const TravelItinerary: React.FC<{ legs: ItineraryLeg[] }> = ({ legs }) => (
  <View>
    {legs.map((leg, i) => (
      <View key={i}>
        {i > 0 ? <View className="my-3 h-px w-full bg-gray-100" /> : null}
        <Leg {...leg} />
      </View>
    ))}
  </View>
);

export default TravelItinerary;
