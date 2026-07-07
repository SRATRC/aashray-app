import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useState, useRef, useEffect, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
// react-native's own KeyboardAvoidingView is unreliable on Android with
// behavior="padding"; this library (already used across the app, provider set
// up in _layout.tsx) handles both platforms correctly for a pinned-input chat.
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useLocalSearchParams } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { status } from '@/src/constants';
import { useAuthStore } from '@/src/stores';
import * as Clipboard from 'expo-clipboard';
import PageHeader from '@/src/components/PageHeader';
import CustomTag from '@/src/components/CustomTag';
import handleAPICall from '@/src/utils/HandleApiCall';
import CustomAlert from '@/src/components/CustomAlert';
import Shimmer from '@/src/components/Shimmer';
import AttachmentPreviewStrip from '@/src/components/AttachmentPreviewStrip';
import TicketMessageAttachments from '@/src/components/TicketMessageAttachments';
import MediaViewer, { MediaViewerItem } from '@/src/components/MediaViewer';
import { getStatusColor } from '@/src/utils/ticketStatus';
import { useTicketStream } from '@/src/hooks/useTicketStream';
import { useRefetchOnFocus } from '@/src/hooks/useRefetchOnFocus';
import { useTicketAttachments } from '@/src/hooks/useTicketAttachments';
import { AttachmentRef, PendingAttachment, runUpload } from '@/src/utils/ticketAttachments';

// Optimistic (local) media rendered on a just-sent message before the server
// echoes back the stored attachments. Tapping opens the full-screen viewer.
const LocalMediaStrip = ({
  media,
  onOpen,
}: {
  media: PendingAttachment[];
  onOpen: (item: MediaViewerItem) => void;
}) => (
  <View className="mt-1.5 flex-row flex-wrap gap-2">
    {media.map((m) =>
      m.kind === 'image' ? (
        <TouchableOpacity
          key={m.id}
          activeOpacity={0.85}
          onPress={() => onOpen({ uri: m.uri, kind: 'image' })}
          className="overflow-hidden rounded-xl">
          <Image source={{ uri: m.uri }} style={{ width: 160, height: 120 }} resizeMode="cover" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          key={m.id}
          activeOpacity={0.85}
          onPress={() => onOpen({ uri: m.uri, kind: 'video' })}
          className="h-[120px] w-[160px] items-center justify-center rounded-xl bg-gray-800">
          <FontAwesome5 name="play" size={20} color="#fff" solid />
        </TouchableOpacity>
      )
    )}
  </View>
);

const TicketDetails = () => {
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewerItem, setViewerItem] = useState<MediaViewerItem | null>(null);
  const flatListRef = useRef<any>(null);

  const fetchTicketDetails = async () => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        `/tickets/${id}`,
        { cardno: user.cardno },
        null,
        (res: any) => resolve(res.data),
        () => {},
        (err: any) => reject(err)
      );
    });
  };

  const {
    data: ticket,
    isLoading,
    isError,
    refetch,
  } = useQuery<any>({
    queryKey: ['ticket', id, user.cardno],
    queryFn: fetchTicketDetails,
    // Global default is refetchOnMount:false, but re-opening a ticket remounts
    // this screen — without this the cached thread renders stale on re-open
    // (missing replies/status changes that arrived while it was closed), since
    // neither useTicketStream's first 'open' nor useRefetchOnFocus's first
    // focus refetches (both intentionally skip their first pass, assuming this
    // mount fetch runs).
    refetchOnMount: 'always',
  });

  // Videos already on this ticket (ticket-level + every message, excluding
  // expired) count against the per-TICKET cap — the composer must block picking
  // a video the backend would reject, which would otherwise upload it to S3
  // first and orphan it.
  const existingVideoCount = useMemo(() => {
    if (!ticket) return 0;
    const perMessage = (ticket.messages || []).flatMap((m: any) => m.attachments || []);
    return [...(ticket.attachments || []), ...perMessage].filter(
      (a: any) => a?.kind === 'video' && !a.expired
    ).length;
  }, [ticket]);

  const {
    attachments,
    canAddMedia,
    hasAttachments,
    addMedia,
    remove,
    upload,
    clear,
    isUploading,
  } = useTicketAttachments(user.cardno, existingVideoCount);

  useRefetchOnFocus(refetch);

  useTicketStream({
    ticketId: id as string,
    cardno: user.cardno,
    queryClient,
    refetch,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (payload: {
      text: string;
      attachments: AttachmentRef[];
      localMedia: PendingAttachment[];
    }) => {
      return new Promise((resolve, reject) => {
        handleAPICall(
          'POST',
          `/tickets/${id}/messages`,
          null,
          {
            cardno: user.cardno,
            sender_type: 'user',
            ...(payload.text ? { message: payload.text } : {}),
            ...(payload.attachments.length ? { attachments: payload.attachments } : {}),
          },
          (res: any) => resolve(res.data),
          () => {},
          (err: any) => reject(err),
          false
        );
      });
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['ticket', id, user.cardno] });
      const previousTicket = queryClient.getQueryData(['ticket', id, user.cardno]);

      queryClient.setQueryData(['ticket', id, user.cardno], (old: any) => {
        if (!old) return old;
        const tempId = 'temp-' + Date.now();
        return {
          ...old,
          messages: [
            ...(old.messages || []),
            {
              id: tempId,
              _key: tempId,
              message: payload.text,
              sender_type: 'user',
              createdAt: new Date().toISOString(),
              isTemp: true,
              _localMedia: payload.localMedia,
            },
          ],
        };
      });

      return { previousTicket };
    },
    onSuccess: () => {
      // Only now that the message is accepted do we drop the staged
      // attachments. Clearing earlier would lose their uploaded S3 keys on a
      // failed POST (orphaning the objects and forcing a re-pick + re-upload).
      clear();
    },
    onError: (err: any, payload, context: any) => {
      queryClient.setQueryData(['ticket', id, user.cardno], context?.previousTicket);
      // Restore the text (only if the composer is still empty) so the user can
      // retry without retyping; staged attachments were never cleared, so a
      // retry reuses their already-uploaded keys.
      setMessageText((prev) => (prev.trim() === '' ? payload.text : prev));
      CustomAlert.alert('Error', err.message || 'Failed to send message');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id, user.cardno] });
    },
  });

  const resolveTicketMutation = useMutation({
    mutationFn: async () => {
      return new Promise((resolve, reject) => {
        handleAPICall(
          'PATCH',
          `/tickets/${id}/resolve`,
          null,
          { cardno: user.cardno },
          (res: any) => resolve(res.data),
          () => {},
          (err: any) => reject(err),
          false
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id, user.cardno] });
      queryClient.invalidateQueries({ queryKey: ['tickets', user.cardno] });
      CustomAlert.alert('Ticket Closed', 'This ticket has been closed. Thanks for reaching out!');
    },
    onError: (error: any) => {
      CustomAlert.alert('Error', error.message || 'Failed to close ticket');
    },
  });

  const handleResolve = () => {
    CustomAlert.alert(
      'Close Ticket',
      'Are you sure you want to close this ticket? You can always create a new one if the issue comes back.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Ticket',
          style: 'destructive',
          onPress: () => resolveTicketMutation.mutate(),
        },
      ]
    );
  };

  const handleCopyId = async () => {
    if (!ticket?.id) return;
    await Clipboard.setStringAsync(ticket.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleAttach = async () => {
    const msg = await addMedia();
    if (msg) CustomAlert.alert('Heads up', msg);
  };

  const handleSend = async () => {
    const text = messageText.trim();
    if (text === '' && !hasAttachments) return;

    // Snapshot the local media for the optimistic bubble before we clear.
    const localMedia = attachments;
    let refs: AttachmentRef[] = [];
    if (hasAttachments) {
      try {
        const uploaded = await runUpload(upload);
        if (uploaded === null) return;
        refs = uploaded;
      } catch (err: any) {
        CustomAlert.alert('Upload failed', err?.message || 'Could not upload your attachments.');
        return;
      }
    }

    setMessageText('');
    // Staged attachments are cleared in the mutation's onSuccess (not here), so
    // a failed send keeps them and their already-uploaded keys for retry.
    sendMessageMutation.mutate({ text, attachments: refs, localMedia });
  };

  // The FlashList is fed the ticket's original description (shown as the
  // first entry so the user can always see what they originally wrote)
  // followed by the real message thread. The "resolved" status banner is
  // rendered separately, fixed above the input — not in this scrollable
  // list — so it's always visible without scrolling, however long the
  // thread gets.
  const renderItem = ({ item }: { item: any }) => {
    if (item.__kind === 'description') {
      return (
        <View className="mb-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <Text className="mb-1 font-psemibold text-xs uppercase tracking-wide text-gray-400">
            {item.service} · Your original request
          </Text>
          <Text className="font-pregular text-[15px] leading-[21px] text-gray-700">
            {item.description}
          </Text>
          <TicketMessageAttachments
            attachments={item.attachments}
            cardno={user.cardno}
            onOpenImage={(uri) => setViewerItem({ uri, kind: 'image' })}
          />
        </View>
      );
    }

    const isUser = item.sender_type === 'user';
    const isTemp = item.isTemp;
    const hasText = !!item.message;
    const localMedia = item._localMedia as PendingAttachment[] | undefined;
    return (
      <View
        className={`my-1 max-w-[82%] rounded-[20px] px-3 py-2 ${
          isUser ? 'self-end bg-secondary' : 'self-start bg-[#E5E5EA]'
        }`}
        style={isTemp ? { opacity: 0.6 } : undefined}>
        {hasText && (
          <Text
            className={`px-1 font-pregular text-[16px] leading-[21px] ${
              isUser ? 'text-white' : 'text-black'
            }`}>
            {item.message}
          </Text>
        )}
        {item.attachments?.length ? (
          <TicketMessageAttachments
            attachments={item.attachments}
            cardno={user.cardno}
            onOpenImage={(uri) => setViewerItem({ uri, kind: 'image' })}
          />
        ) : localMedia?.length ? (
          <LocalMediaStrip media={localMedia} onOpen={setViewerItem} />
        ) : null}
      </View>
    );
  };

  useEffect(() => {
    if (ticket?.messages?.length) {
      const timer = setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      return () => clearTimeout(timer);
    }
  }, [ticket?.messages?.length]);

  // Only a closed ticket is terminal for the user. A resolved ticket can still
  // be replied to (which reopens it to "in progress" server-side), per spec.
  const isTicketActive = ticket?.status !== status.STATUS_CLOSED;

  if (isLoading) {
    return (
      <SafeAreaView className="h-full w-full bg-white">
        <PageHeader title="" />
        <Shimmer.Container className="flex-1 p-4">
          <View className="flex-1 gap-y-3">
            <Shimmer.Box width="65%" height={44} borderRadius={20} className="self-end" />
            <Shimmer.Box width="55%" height={44} borderRadius={20} className="self-start" />
            <Shimmer.Box width="70%" height={44} borderRadius={20} className="self-end" />
          </View>
        </Shimmer.Container>
      </SafeAreaView>
    );
  }

  if (isError || !ticket) {
    return (
      <SafeAreaView className="h-full w-full bg-white">
        <PageHeader title="" />
        <View className="flex-1 items-center justify-center px-4">
          <FontAwesome5 name="exclamation-circle" size={48} color="#EF4444" />
          <Text className="mt-4 text-center font-pmedium text-base text-gray-600">
            Unable to load ticket
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusStyle = getStatusColor(ticket.status);
  const isResolved = ticket.status === status.STATUS_RESOLVED;
  const chatItems = [
    {
      __kind: 'description',
      service: ticket.service,
      description: ticket.description,
      attachments: ticket.attachments,
    },
    ...(ticket.messages || []),
  ];

  const canSend = (messageText.trim() !== '' || hasAttachments) && !isUploading;
  const sending = sendMessageMutation.isPending || isUploading;

  return (
    <SafeAreaView className="h-full w-full bg-white">
      <PageHeader title="Support Ticket" />
      <View className="mb-3 flex-row items-center justify-between px-4">
        <View className="flex-row items-center gap-x-2">
          <TouchableOpacity
            onPress={handleCopyId}
            className="flex-row items-center gap-x-1.5"
            activeOpacity={0.6}>
            <Text className="font-pmedium text-sm text-gray-500">#{ticket.id}</Text>
            <FontAwesome5
              name={copied ? 'check' : 'copy'}
              size={13}
              color={copied ? '#10B981' : '#9CA3AF'}
            />
          </TouchableOpacity>
          <CustomTag
            text={ticket.status.toUpperCase()}
            textStyles={statusStyle.text}
            containerStyles={statusStyle.bg}
          />
        </View>
        {isTicketActive && (
          <TouchableOpacity
            onPress={handleResolve}
            disabled={resolveTicketMutation.isPending}
            activeOpacity={0.7}
            className="rounded-full bg-gray-100 px-3 py-1.5">
            {resolveTicketMutation.isPending ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <Text className="font-pmedium text-xs text-gray-700">Close Ticket</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View className="mx-4 mb-3 flex-row items-center gap-x-2 rounded-xl bg-gray-50 px-3 py-2">
        <FontAwesome5 name="clock" size={12} color="#6B7280" />
        <Text className="flex-1 font-pregular text-xs text-gray-500">
          Our average response time is 3 business days.
        </Text>
      </View>

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        {/* Messages */}
        <FlashList
          ref={flatListRef}
          data={chatItems}
          renderItem={renderItem}
          keyExtractor={(item: any, index: number) =>
            item.__kind ? `${item.__kind}-${index}` : String(item._key ?? item.id)
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-16">
              <Text className="font-pregular text-sm text-gray-400">No messages yet</Text>
            </View>
          }
        />

        {/* Fixed above the input (not part of the scrollable thread) so it's
            always visible the moment status flips to resolved, with no
            scrolling required. */}
        {isResolved && (
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
              If this fixed your issue, tap "Close Ticket" above. Otherwise, reply below and we'll
              reopen it.
            </Text>
          </View>
        )}

        {/* Input Area */}
        <View className="border-t border-gray-100 bg-white px-4 py-3">
          {isTicketActive ? (
            <>
              {hasAttachments && (
                <View className="mb-2">
                  <AttachmentPreviewStrip
                    attachments={attachments}
                    onRemove={remove}
                    disabled={isUploading}
                  />
                </View>
              )}
              <View className="flex-row items-end gap-x-2">
                <TouchableOpacity
                  onPress={handleAttach}
                  disabled={!canAddMedia || isUploading}
                  className="h-11 w-11 items-center justify-center rounded-full bg-gray-100"
                  activeOpacity={0.7}>
                  <FontAwesome5 name="paperclip" size={16} color="#6B7280" />
                </TouchableOpacity>
                <TextInput
                  className="max-h-24 min-h-[44px] flex-1 rounded-[22px] bg-gray-100 px-4 py-2.5 font-pregular text-[15px] text-gray-900"
                  placeholder="Message..."
                  placeholderTextColor="#9CA3AF"
                  value={messageText}
                  onChangeText={setMessageText}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={!canSend || sending}
                  className={`h-11 w-11 items-center justify-center rounded-full ${
                    canSend ? 'bg-secondary' : 'bg-gray-200'
                  }`}
                  activeOpacity={0.7}>
                  {sending ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <FontAwesome5
                      name="arrow-up"
                      size={16}
                      color={canSend ? 'white' : '#9CA3AF'}
                      solid
                    />
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
      </KeyboardAvoidingView>

      <MediaViewer visible={!!viewerItem} item={viewerItem} onClose={() => setViewerItem(null)} />
    </SafeAreaView>
  );
};

export default TicketDetails;
