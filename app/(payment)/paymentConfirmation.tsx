import { useEffect, useRef, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { icons, quotes } from '@/constants';
import { useQueryClient } from '@tanstack/react-query';
import { useGlobalContext } from '@/context/GlobalProvider';
import CustomButton from '@/components/CustomButton';

const PaymentConfirmation = () => {
  const { user } = useGlobalContext();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const queryClient = useQueryClient();

  queryClient.invalidateQueries({
    queryKey: ['pendingPayments', user.cardno],
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const randomQuote = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <Animated.View
          className="flex-1 px-6"
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}>
          <View className="flex-1 justify-center">
            <View className="mb-8 items-center">
              <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-green-600 shadow-lg">
                <Image
                  source={icons.tick}
                  tintColor={'white'}
                  className="h-8 w-8"
                  resizeMode="contain"
                />
              </View>

              <Text className="mb-2 font-pbold text-3xl tracking-tight text-gray-900">
                Booking Confirmed
              </Text>

              <Text className="px-8 text-center text-base leading-6 text-gray-600">
                Your reservation has been successfully processed
              </Text>
            </View>

            <View className="items-center rounded-2xl bg-gray-100 p-8">
              <View className="relative">
                <View className="mb-4 h-20 w-40 rounded-full bg-gray-200" />
                <View className="absolute left-8 top-4 h-3 w-3 rounded-full bg-gray-400" />
                <View className="absolute right-12 top-8 h-2 w-2 rounded-full bg-gray-500" />
                <View className="absolute bottom-2 left-16 h-4 w-4 rounded-full bg-gray-600" />
              </View>
              <Text className="text-center text-sm font-light leading-relaxed text-gray-600">
                {randomQuote.quote}
              </Text>
              <Text className="mt-2 text-xs text-gray-400">— {randomQuote.author}</Text>
            </View>
          </View>

          <View className="pb-8">
            <CustomButton
              text="View Booking Details"
              handlePress={() => router.replace('/bookings')}
              containerStyles="min-h-[56px] shadow-sm mb-4"
              bgcolor="bg-gray-900"
              textStyles="text-white tracking-wide"
            />

            <TouchableOpacity
              onPress={() => router.replace('/')}
              className="items-center py-3"
              activeOpacity={0.7}>
              <Text className="font-pmedium text-base text-gray-600">Return to Home</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

export default PaymentConfirmation;
