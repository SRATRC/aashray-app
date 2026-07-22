import { FontAwesome5 } from '@expo/vector-icons';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import CustomTag from '@/components/CustomTag';
import PageHeader from '@/components/PageHeader';

interface Props {
  ticketId: string;
  copied: boolean;
  onCopyId: () => void;
  statusLabel: string;
  statusStyle: { text: string; bg: string };
  showCloseButton: boolean;
  onResolve: () => void;
  resolving: boolean;
}

// Pure presentational header: page title, ticket id (with copy-to-clipboard),
// status pill, and (while the ticket is still active) the "Close Ticket"
// button. Holds no data/mutation state — the screen owns copy/resolve
// handlers and passes their current status down.
const TicketStatusHeader = ({
  ticketId,
  copied,
  onCopyId,
  statusLabel,
  statusStyle,
  showCloseButton,
  onResolve,
  resolving,
}: Props) => (
  <>
    <PageHeader title="Support Ticket" />
    <View className="mb-3 flex-row items-center justify-between px-4">
      <View className="flex-row items-center gap-x-2">
        <TouchableOpacity
          onPress={onCopyId}
          className="flex-row items-center gap-x-1.5"
          activeOpacity={0.6}>
          <Text className="font-pmedium text-sm text-gray-500">#{ticketId}</Text>
          <FontAwesome5
            name={copied ? 'check' : 'copy'}
            size={13}
            color={copied ? '#10B981' : '#9CA3AF'}
          />
        </TouchableOpacity>
        <CustomTag
          text={statusLabel}
          textStyles={statusStyle.text}
          containerStyles={statusStyle.bg}
        />
      </View>
      {showCloseButton && (
        <TouchableOpacity
          onPress={onResolve}
          disabled={resolving}
          activeOpacity={0.7}
          className="rounded-full bg-gray-100 px-3 py-1.5">
          {resolving ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <Text className="font-pmedium text-xs text-gray-700">Close Ticket</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  </>
);

export default TicketStatusHeader;
