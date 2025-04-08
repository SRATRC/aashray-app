import { View, Text, Image, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { icons, images } from '../../constants';
import CustomButton from '../../components/CustomButton';
import { useEffect, useRef } from 'react';

const BookingSuccess = () => {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Animated.View
        className="h-full items-center justify-center px-6"
        style={{ opacity: fadeAnim }}>
        {/* Success Animation/Image */}
        <View className="mb-8 rounded-full bg-green-50 p-6">
          <Image
            source={icons.tick}
            tintColor={'green'}
            className="h-24 w-24"
            resizeMode="contain"
          />
        </View>

        {/* Success Message */}
        <Text className="mb-3 text-center font-pbold text-2xl">Success!</Text>
        <Text className="mb-10 text-center font-pregular text-gray-600">
          Your booking has been confirmed successfully.
        </Text>

        {/* Action Buttons */}
        <View className="w-full">
          <CustomButton
            containerStyles="min-h-[55px] mb-4"
            text="View Bookings"
            handlePress={() => router.replace('/bookings')}
          />

          <TouchableOpacity onPress={() => router.replace('/home')}>
            <Text className="py-3 text-center font-pmedium text-gray-600">Pay Now!</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default BookingSuccess;
