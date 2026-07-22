import { FontAwesome5 } from '@expo/vector-icons';
import { Text, View } from 'react-native';

// Static info strip shown above the composer once a ticket is resolved.
// Fixed above the input (not part of the scrollable thread) so it's always
// visible the moment status flips to resolved, with no scrolling required.
// Purely presentational — no props, no data/mutation logic.
const TicketResolvedBanner = () => (
  <View className="mx-4 mb-3 mt-2 rounded-2xl border border-blue-100 bg-blue-50 p-3">
    <View className="flex-row items-center gap-x-2">
      <View className="h-6 w-6 items-center justify-center rounded-full bg-blue-600">
        <FontAwesome5 name="check" size={10} color="#FFFFFF" solid />
      </View>
      <Text className="flex-1 font-psemibold text-[13px] text-blue-900">
        Support marked this as resolved
      </Text>
    </View>
    <Text className="mt-1.5 font-pregular text-[12.5px] leading-[17px] text-blue-800">
      If this fixed your issue, tap "Close Ticket" above. Otherwise, reply below and we'll reopen
      it.
    </Text>
  </View>
);

export default TicketResolvedBanner;
