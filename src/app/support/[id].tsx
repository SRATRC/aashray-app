import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { status } from '@/src/constants';
import { useAuthStore } from '@/src/stores';
import PageHeader from '@/src/components/PageHeader';
import handleAPICall from '@/src/utils/HandleApiCall';
import CustomTag from '@/src/components/CustomTag';
import ExpandableItem from '@/src/components/ExpandableItem';
import CustomAlert from '@/src/components/CustomAlert';
import Shimmer from '@/src/components/Shimmer';
import moment from 'moment';

const TicketDetails = () => {
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef(null);

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
  } = useQuery({
    queryKey: ['ticket', id, user.cardno],
    queryFn: fetchTicketDetails,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (text) => {
      return new Promise((resolve, reject) => {
        handleAPICall(
          'POST',
          `/tickets/${id}/messages`,
          null,
          {
            cardno: user.cardno,
            message: text,
            sender_type: 'user',
          },
          (res: any) => resolve(res.data),
          () => {},
          (err) => reject(err),
          false // Don't show toast on every message
        );
      });
    },
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({ queryKey: ['ticket', id, user.cardno] });
      const previousTicket = queryClient.getQueryData(['ticket', id, user.cardno]);

      queryClient.setQueryData(['ticket', id, user.cardno], (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: [
            ...(old.messages || []),
            {
              id: 'temp-' + Date.now(),
              message: newMessage,
              sender_type: 'user',
              created_at: new Date().toISOString(),
              isTemp: true,
            },
          ],
        };
      });

      return { previousTicket };
    },
    onError: (err, context) => {
      queryClient.setQueryData(['ticket', id, user.cardno], context.previousTicket);
      CustomAlert.alert('Error', err.message || 'Failed to send message');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id, user.cardno] });
      setMessageText('');
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
          (err) => reject(err)
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id, user.cardno] });
      CustomAlert.alert('Success', 'Ticket resolved successfully');
    },
    onError: (error) => {
      CustomAlert.alert('Error', error.message || 'Failed to resolve ticket');
    },
  });

  const handleResolve = () => {
    CustomAlert.alert('Resolve Ticket', 'Are you sure you want to mark this ticket as resolved?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resolve',
        style: 'destructive',
        onPress: () => resolveTicketMutation.mutate(),
      },
    ]);
  };

  const handleSend = () => {
    if (messageText.trim() === '') return;
    sendMessageMutation.mutate(messageText.trim());
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender_type === 'user';
    return (
      <View
        className={`my-1 max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'self-end rounded-tr-none bg-secondary'
            : 'self-start rounded-tl-none bg-gray-100'
        }`}>
        <Text className={`font-pregular text-base ${isUser ? 'text-white' : 'text-black'}`}>
          {item.message}
        </Text>
        <Text className={`mt-1 text-xs ${isUser ? 'text-gray-200' : 'text-gray-400'} self-end`}>
          {moment(item.created_at).format('LT')}
        </Text>
      </View>
    );
  };

  const getStatusColor = (ticketStatus) => {
    switch (ticketStatus) {
      case status.STATUS_OPEN:
        return { text: 'text-green-600', bg: 'bg-green-100 mr-2' };
      case status.STATUS_IN_PROGRESS:
        return { text: 'text-orange-600', bg: 'bg-orange-100 mr-2' };
      case status.STATUS_RESOLVED:
        return { text: 'text-blue-600', bg: 'bg-blue-100 mr-2' };
      case status.STATUS_CLOSED:
        return { text: 'text-gray-600', bg: 'bg-gray-100 mr-2' };
      default:
        return { text: 'text-gray-600', bg: 'bg-gray-100 mr-2' };
    }
  };

  useEffect(() => {
    if (ticket?.messages?.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [ticket?.messages?.length]);

  if (isLoading) {
    return (
      <SafeAreaView className="h-full w-full bg-white">
        <PageHeader title="Ticket Details" />
        <Shimmer.Container className="flex-1 px-4 pt-4">
          {/* Ticket Header Shimmer */}
          <View className="flex-row justify-between">
            <View className="w-[70%]">
              <Shimmer.Line width="60%" height={24} className="mb-2" />
              <Shimmer.Line width="40%" height={16} />
            </View>
            <Shimmer.Box width={80} height={28} borderRadius={16} />
          </View>

          {/* Description Shimmer */}
          <View className="mt-6">
            <Shimmer.Line width="30%" height={16} className="mb-2" />
            <Shimmer.Box height={80} borderRadius={12} />
          </View>

          {/* Chat Messages Shimmer */}
          <View className="mt-8 flex-1 gap-y-4">
            <Shimmer.Box
              width="70%"
              height={60}
              borderRadius={16}
              className="self-end rounded-tr-none"
            />
            <Shimmer.Box
              width="60%"
              height={50}
              borderRadius={16}
              className="self-start rounded-tl-none"
            />
            <Shimmer.Box
              width="75%"
              height={70}
              borderRadius={16}
              className="self-end rounded-tr-none"
            />
          </View>
        </Shimmer.Container>
      </SafeAreaView>
    );
  }

  if (isError || !ticket) {
    return (
      <SafeAreaView className="h-full w-full items-center justify-center bg-white">
        <Text className="font-pregular text-lg text-red-500">Failed to load ticket details</Text>
      </SafeAreaView>
    );
  }

  const statusStyle = getStatusColor(ticket.status);

  return (
    <SafeAreaView className="h-full w-full bg-white">
      <PageHeader title={`Ticket #${ticket.id}`} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <View className="flex-1">
          <View className="px-4 pb-2">
            <ExpandableItem
              visibleContent={
                <View className="w-full flex-row items-center justify-between">
                  <View>
                    <Text className="font-psemibold text-lg text-black">{ticket.service}</Text>
                    <Text className="font-pregular text-xs text-gray-400">
                      {moment(ticket.created_at).format('LLL')}
                    </Text>
                  </View>
                  <CustomTag
                    text={ticket.status?.toUpperCase()}
                    textStyles={statusStyle.text}
                    containerStyles={statusStyle.bg}
                  />
                </View>
              }>
              <View className="mt-2 rounded-lg bg-gray-50 p-3">
                <Text className="mb-1 font-pmedium text-sm text-gray-500">Description:</Text>
                <Text className="font-pregular text-base text-black">{ticket.description}</Text>

                {(ticket.status === status.STATUS_OPEN ||
                  ticket.status === status.STATUS_IN_PROGRESS) && (
                  <TouchableOpacity
                    onPress={handleResolve}
                    disabled={resolveTicketMutation.isPending}
                    className="mt-4 flex-row items-center justify-center rounded-lg bg-green-100 p-3">
                    {resolveTicketMutation.isPending ? (
                      <ActivityIndicator size="small" color="#05B617" />
                    ) : (
                      <>
                        <FontAwesome5 name="check-circle" size={16} color="#05B617" />
                        <Text className="ml-2 font-pmedium text-sm text-[#05B617]">
                          Mark as Resolved
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </ExpandableItem>
          </View>

          <FlashList
            ref={flatListRef}
            data={ticket.messages || []}
            renderItem={renderMessage}
            estimatedItemSize={80}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        </View>

        <View className="border-t border-gray-200 bg-white px-4 py-3 pb-6">
          <View className="flex-row items-center gap-x-2">
            <TextInput
              className="flex-1 rounded-full bg-gray-100 px-4 py-3 font-pregular text-base text-black"
              placeholder="Type a message..."
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={messageText.trim() === '' || sendMessageMutation.isPending}
              className={`h-12 w-12 items-center justify-center rounded-full ${
                messageText.trim() === '' ? 'bg-gray-300' : 'bg-secondary'
              }`}>
              {sendMessageMutation.isPending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <FontAwesome5 name="paper-plane" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default TicketDetails;
