import { View, Text, Image, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { icons, images } from '../../constants';
import CustomButton from '../../components/CustomButton';
import { useEffect, useRef } from 'react';

const PaymentFailed = () => {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Content Section */}
        <Animated.View
          className="flex-1 px-6"
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}>
          {/* Centered Content */}
          <View className="flex-1 justify-center">
            {/* Header Section */}
            <View className="mb-8 items-center">
              {/* Error Icon */}
              <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-red-600 shadow-lg">
                <MaterialIcons name="close" size={32} color="white" />
              </View>

              {/* Error Message */}
              <Text className="mb-2 font-pbold text-3xl tracking-tight text-gray-900">
                Payment Failed
              </Text>

              <Text className="px-8 text-center text-base leading-6 text-gray-600">
                We couldn't process your payment at this time
              </Text>
            </View>

            {/* Troubleshooting Card */}
            <View className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <Text className="mb-4 font-psemibold text-sm uppercase tracking-wide text-gray-700">
                Common Solutions
              </Text>

              <View className="mb-3 flex-row items-start">
                <View className="mr-3 mt-2 h-1.5 w-1.5 rounded-full bg-gray-600" />
                <Text className="flex-1 text-base leading-6 text-gray-600">
                  Check that your payment details are entered correctly
                </Text>
              </View>

              <View className="mb-3 flex-row items-start">
                <View className="mr-3 mt-2 h-1.5 w-1.5 rounded-full bg-gray-600" />
                <Text className="flex-1 text-base leading-6 text-gray-600">
                  Ensure you have sufficient funds available
                </Text>
              </View>

              <View className="mb-4 flex-row items-start">
                <View className="mr-3 mt-2 h-1.5 w-1.5 rounded-full bg-gray-600" />
                <Text className="flex-1 text-base leading-6 text-gray-600">
                  Try using a different payment method
                </Text>
              </View>

              {/* Support Section */}
              <View className="border-t border-gray-200 pt-4">
                <Text className="mb-2 font-pmedium text-sm text-gray-700">Need Help?</Text>
                <TouchableOpacity
                  onPress={() => router.replace('/contactInfo')}
                  className="flex-row items-center"
                  activeOpacity={0.7}>
                  <MaterialIcons name="support-agent" size={16} color="#6b7280" />
                  <Text className="ml-2 font-pmedium text-base text-blue-600">Contact Support</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bottom Section */}
          <View className="pb-8">
            {/* Action Button */}
            <CustomButton
              text="Try Again"
              handlePress={() => router.replace('/pendingPayments')}
              containerStyles="min-h-[56px] shadow-sm mb-4"
              bgcolor="bg-red-600"
              textStyles="text-white tracking-wide"
            />

            {/* Bottom Link */}
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

export default PaymentFailed;
