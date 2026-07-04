import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useState, useRef, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { status, BASE_URL, DEV_URL } from '@/src/constants';
import { useAuthStore, useDevStore } from '@/src/stores';
import EventSource, { EventSourceListener } from 'react-native-sse';
import * as Clipboard from 'expo-clipboard';
import PageHeader from '@/src/components/PageHeader';
import CustomTag from '@/src/components/CustomTag';
import handleAPICall from '@/src/utils/HandleApiCall';
import CustomAlert from '@/src/components/CustomAlert';
import Shimmer from '@/src/components/Shimmer';

// A connection that's gone silently stale (a graceful close produces no
// error event on some SSE clients) is detected by the absence of the
// backend's ~25s heartbeat: if nothing — not even a ping — arrives for this
// long, we assume the stream is dead and force a reconnect.
const SSE_WATCHDOG_TIMEOUT_MS = 40000;
const SSE_WATCHDOG_CHECK_INTERVAL_MS = 10000;

const getStatusColor = (ticketStatus: any) => {
  switch (ticketStatus) {
    case status.STATUS_OPEN:
      return { text: 'text-green-600', bg: 'bg-green-100' };
    case status.STATUS_IN_PROGRESS:
      return { text: 'text-orange-600', bg: 'bg-orange-100' };
    case status.STATUS_RESOLVED:
      return { text: 'text-blue-600', bg: 'bg-blue-100' };
    case status.STATUS_CLOSED:
      return { text: 'text-gray-600', bg: 'bg-gray-100' };
    default:
      return { text: 'text-gray-600', bg: 'bg-gray-100' };
  }
};

const TicketDetails = () => {
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [copied, setCopied] = useState(false);
  const flatListRef = useRef<any>(null);

  const fetchTicketDetails = async () => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        `/tickets/${id}`,
        { cardno: user.cardno },
        null,
        (res: any) => resolve(res.data),
        () => reject(new Error('Failed to fetch ticket details'))
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
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  useEffect(() => {
    const { useDevBackend, devPrNumber } = useDevStore.getState();
    let currentBaseUrl = BASE_URL;

    if (useDevBackend) {
      if (devPrNumber) {
        currentBaseUrl = `https://aashray-backend-pr-${devPrNumber}.onrender.com/api/v1`;
      } else {
        currentBaseUrl = DEV_URL;
      }
    }

    if (!currentBaseUrl) {
      if (__DEV__) console.warn('Base URL is missing, cannot connect to SSE.');
      return;
    }

    const url = `${currentBaseUrl}/tickets/${id}/stream?cardno=${user.cardno}`;

    // With pollingInterval:0 the library's own auto-reconnect is disabled, so
    // we manage reconnection manually: on error we tear down and retry after
    // a short delay, and on reconnect we refetch the ticket so any messages
    // missed while disconnected are recovered.
    //
    // A graceful close (server restart, proxy idle-timeout) produces NO
    // 'error' event at all in this library — it just goes quiet. The backend
    // sends a {type:'ping'} data frame every ~25s specifically so we can
    // detect that: a watchdog below force-reconnects if nothing (not even a
    // ping) arrives for SSE_WATCHDOG_TIMEOUT_MS.
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let watchdogInterval: ReturnType<typeof setInterval> | null = null;
    let isCleanedUp = false;
    let hasConnected = false;
    let lastActivityAt = Date.now();

    const listener: EventSourceListener = (event) => {
      if (event.type === 'open') {
        if (__DEV__) console.log('[SSE] Connection opened');
        lastActivityAt = Date.now();
        // A second (or later) open means we reconnected after a drop — pull
        // the latest state to backfill anything missed while disconnected.
        if (hasConnected) refetch();
        hasConnected = true;
      } else if (event.type === 'message') {
        if (event.data) {
          try {
            const data = JSON.parse(event.data);
            if (__DEV__) console.log('[SSE] Message received:', data);
            lastActivityAt = Date.now();

            if (data.type === 'status_update') {
              // A status change isn't always paired with a new message (e.g.
              // an admin picking a status from the dropdown) — without this,
              // the status badge/banner/input state here would only update
              // after a manual reload.
              queryClient.setQueryData(['ticket', id, user.cardno], (old: any) =>
                old ? { ...old, status: data.status, updatedBy: data.updatedBy } : old
              );
            } else if (data.type !== 'connected' && data.type !== 'ping') {
              queryClient.setQueryData(['ticket', id, user.cardno], (old: any) => {
                if (!old) return old;

                const messageExists = old.messages?.some((m: any) => m.id === data.id);
                if (messageExists) return old;

                let newMessages = [...(old.messages || [])];

                const tempIndex = newMessages.findIndex(
                  (m: any) =>
                    m.isTemp && m.message === data.message && m.sender_type === data.sender_type
                );

                if (tempIndex !== -1) {
                  newMessages[tempIndex] = data;
                } else {
                  newMessages.push(data);
                }

                return {
                  ...old,
                  messages: newMessages,
                };
              });

              setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            }
          } catch (err) {
            if (__DEV__) console.error('[SSE] Failed to parse message:', err);
          }
        }
      } else if (event.type === 'error') {
        if (__DEV__)
          console.error('[SSE] Connection Error:', (event as any).message || 'Unknown error');
        scheduleReconnect();
      }
    };

    const connect = () => {
      if (isCleanedUp) return;
      lastActivityAt = Date.now();
      es = new EventSource(url, { pollingInterval: 0 });
      es.addEventListener('open', listener);
      es.addEventListener('message', listener);
      es.addEventListener('error', listener);
    };

    const scheduleReconnect = () => {
      if (isCleanedUp || reconnectTimer) return;
      if (es) {
        es.removeAllEventListeners();
        es.close();
        es = null;
      }
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, 3000);
    };

    connect();

    watchdogInterval = setInterval(() => {
      if (Date.now() - lastActivityAt > SSE_WATCHDOG_TIMEOUT_MS) {
        if (__DEV__) console.warn('[SSE] Watchdog: no activity, forcing reconnect');
        scheduleReconnect();
      }
    }, SSE_WATCHDOG_CHECK_INTERVAL_MS);

    return () => {
      if (__DEV__) console.log('[SSE] Closing connection');
      isCleanedUp = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (watchdogInterval) clearInterval(watchdogInterval);
      if (es) {
        es.removeAllEventListeners();
        es.close();
      }
    };
  }, [id, user.cardno, queryClient, refetch]);

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      return new Promise((resolve, reject) => {
        handleAPICall(
          'POST',
          `/tickets/${id}/messages`,
          null,
          { cardno: user.cardno, message: text, sender_type: 'user' },
          (res: any) => resolve(res.data),
          () => {},
          (err: any) => reject(err),
          false
        );
      });
    },
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({ queryKey: ['ticket', id, user.cardno] });
      const previousTicket = queryClient.getQueryData(['ticket', id, user.cardno]);

      queryClient.setQueryData(['ticket', id, user.cardno], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          messages: [
            ...(old.messages || []),
            {
              id: 'temp-' + Date.now(),
              message: newMessage,
              sender_type: 'user',
              createdAt: new Date().toISOString(),
              isTemp: true,
            },
          ],
        };
      });

      return { previousTicket };
    },
    onError: (err: any, _newMessage, context: any) => {
      queryClient.setQueryData(['ticket', id, user.cardno], context?.previousTicket);
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
          (err: any) => reject(err)
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
        { text: 'Close Ticket', style: 'destructive', onPress: () => resolveTicketMutation.mutate() },
      ]
    );
  };

  const handleCopyId = async () => {
    if (!ticket?.id) return;
    await Clipboard.setStringAsync(ticket.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSend = () => {
    if (messageText.trim() === '') return;
    const text = messageText.trim();
    setMessageText('');
    sendMessageMutation.mutate(text);
  };

  // The FlashList is fed a mix of: the ticket's original description (shown
  // as the first entry so the user can always see what they originally
  // wrote), the real message thread, and — while status is "resolved" — a
  // trailing banner explaining that support considers this fixed and
  // prompting the user to close it (or just reply to reopen it).
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
        </View>
      );
    }

    if (item.__kind === 'resolvedBanner') {
      return (
        <View className="mb-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <Text className="font-pmedium text-[14px] leading-[20px] text-blue-800">
            Support marked this ticket as resolved. If that fixed your issue, tap "Close Ticket"
            above. If not, just send a message below and we'll reopen it.
          </Text>
        </View>
      );
    }

    const isUser = item.sender_type === 'user';
    const isTemp = item.isTemp;
    return (
      <View
        className={`my-1 max-w-[78%] rounded-[20px] px-4 py-2.5 ${
          isUser ? 'self-end bg-secondary' : 'self-start bg-[#E5E5EA]'
        }`}
        style={isTemp ? { opacity: 0.6 } : undefined}>
        <Text
          className={`font-pregular text-[16px] leading-[21px] ${
            isUser ? 'text-white' : 'text-black'
          }`}>
          {item.message}
        </Text>
      </View>
    );
  };

  useEffect(() => {
    if (ticket?.messages?.length) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
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
  const chatItems = [
    { __kind: 'description', service: ticket.service, description: ticket.description },
    ...(ticket.messages || []),
    ...(ticket.status === status.STATUS_RESOLVED ? [{ __kind: 'resolvedBanner' }] : []),
  ];

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

      <View className="mx-4 mb-3 flex-row items-center gap-x-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
        <FontAwesome5 name="clock" size={12} color="#B45309" />
        <Text className="flex-1 font-pregular text-xs text-amber-800">
          This isn't a live chat — our team typically responds within 3 business days.
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        // keyboardVerticalOffset={Platform.OS == 'android' ? 120 : 0}
        className="flex-1">
        {/* Messages */}
        <FlashList
          ref={flatListRef}
          data={chatItems}
          renderItem={renderItem}
          keyExtractor={(item: any, index: number) =>
            item.__kind ? `${item.__kind}-${index}` : String(item.id)
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

        {/* Input Area */}
        <View className="border-t border-gray-100 bg-white px-4 py-3">
          {isTicketActive ? (
            <View className="flex-row items-end gap-x-3">
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
                disabled={messageText.trim() === '' || sendMessageMutation.isPending}
                className={`h-11 w-11 items-center justify-center rounded-full ${
                  messageText.trim() ? 'bg-secondary' : 'bg-gray-200'
                }`}
                activeOpacity={0.7}>
                {sendMessageMutation.isPending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <FontAwesome5
                    name="arrow-up"
                    size={16}
                    color={messageText.trim() ? 'white' : '#9CA3AF'}
                    solid
                  />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View className="items-center py-2">
              <Text className="font-pregular text-sm text-gray-400">This ticket is closed</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default TicketDetails;
