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
import CustomAlert from '@/src/components/CustomAlert';
import Shimmer from '@/src/components/Shimmer';

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
    refetchInterval: 5000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (text) => {
      return new Promise((resolve, reject) => {
        handleAPICall(
          'POST',
          `/tickets/${id}/messages`,
          null,
          { cardno: user.cardno, message: text, sender_type: 'user' },
          (res: any) => resolve(res.data),
          () => {},
          (err) => reject(err),
          false
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
      queryClient.invalidateQueries({ queryKey: ['tickets', user.cardno] });
      CustomAlert.alert('Success', 'Ticket resolved successfully');
    },
    onError: (error) => {
      CustomAlert.alert('Error', error.message || 'Failed to resolve ticket');
    },
  });

  const handleResolve = () => {
    CustomAlert.alert('Resolve Ticket', 'Mark this ticket as resolved?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Resolve', style: 'destructive', onPress: () => resolveTicketMutation.mutate() },
    ]);
  };

  const handleSend = () => {
    if (messageText.trim() === '') return;
    const text = messageText.trim();
    setMessageText('');
    sendMessageMutation.mutate(text);
  };

  const renderMessage = ({ item }: { item: any }) => {
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

  const isTicketActive =
    ticket?.status === status.STATUS_OPEN || ticket?.status === status.STATUS_IN_PROGRESS;

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

  const resolveButton = isTicketActive ? (
    <TouchableOpacity
      onPress={handleResolve}
      disabled={resolveTicketMutation.isPending}
      activeOpacity={0.5}>
      {resolveTicketMutation.isPending ? (
        <ActivityIndicator size="small" color="#10B981" />
      ) : (
        <FontAwesome5 name="check-circle" size={20} color="#10B981" />
      )}
    </TouchableOpacity>
  ) : null;

  return (
    <SafeAreaView className="h-full w-full bg-white">
      <PageHeader title={'#' + ticket.id} rightAction={resolveButton} />

      <KeyboardAvoidingView
        behavior="padding"
        // keyboardVerticalOffset={Platform.OS == 'android' ? 120 : 0}
        className="flex-1">
        {/* Messages */}
        <FlashList
          ref={flatListRef}
          data={ticket.messages || []}
          renderItem={renderMessage}
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
              <Text className="font-pregular text-sm text-gray-400">This ticket is Resolved</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default TicketDetails;
