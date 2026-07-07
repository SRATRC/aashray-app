import { FontAwesome5 } from '@expo/vector-icons';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';

import AttachmentPreviewStrip from './AttachmentPreviewStrip';
import { PendingAttachment } from '../types';

interface AttachmentPreviewState {
  attachments: PendingAttachment[];
  onRemove: (id: string) => void;
  disabled: boolean;
}

interface Props {
  isActive: boolean;
  messageText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  canSend: boolean;
  sending: boolean;
  onAttach: () => void;
  canAttach: boolean;
  attachmentPreview: AttachmentPreviewState;
}

// Pure presentational composer: attach button, text input, send button, the
// staged-attachment preview strip, and the closed-ticket fallback message.
// Holds no data/SSE/mutation/optimistic state — the screen owns all of that
// and passes down only the current values + handlers.
const TicketComposer = ({
  isActive,
  messageText,
  onChangeText,
  onSend,
  canSend,
  sending,
  onAttach,
  canAttach,
  attachmentPreview,
}: Props) => (
  <View className="border-t border-gray-100 bg-white px-4 py-3">
    {isActive ? (
      <>
        {attachmentPreview.attachments.length > 0 && (
          <View className="mb-2">
            <AttachmentPreviewStrip
              attachments={attachmentPreview.attachments}
              onRemove={attachmentPreview.onRemove}
              disabled={attachmentPreview.disabled}
            />
          </View>
        )}
        <View className="flex-row items-end gap-x-2">
          <TouchableOpacity
            onPress={onAttach}
            disabled={!canAttach}
            className="h-11 w-11 items-center justify-center rounded-full bg-gray-100"
            activeOpacity={0.7}>
            <FontAwesome5 name="paperclip" size={16} color="#6B7280" />
          </TouchableOpacity>
          <TextInput
            className="max-h-24 min-h-[44px] flex-1 rounded-[22px] bg-gray-100 px-4 py-2.5 font-pregular text-[15px] text-gray-900"
            placeholder="Message..."
            placeholderTextColor="#9CA3AF"
            value={messageText}
            onChangeText={onChangeText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={onSend}
            disabled={!canSend || sending}
            className={`h-11 w-11 items-center justify-center rounded-full ${
              canSend ? 'bg-secondary' : 'bg-gray-200'
            }`}
            activeOpacity={0.7}>
            {sending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <FontAwesome5 name="arrow-up" size={16} color={canSend ? 'white' : '#9CA3AF'} solid />
            )}
          </TouchableOpacity>
        </View>
      </>
    ) : (
      <View className="items-center py-2">
        <Text className="font-pregular text-sm text-gray-400">This ticket is closed</Text>
      </View>
    )}
  </View>
);

export default TicketComposer;
