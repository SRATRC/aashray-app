import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  onRetry?: () => void;
  retryText?: string;
  customActions?: React.ReactNode;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again.',
  showBackButton = true,
  showHomeButton = true,
  onRetry,
  retryText = 'Try Again',
  customActions,
  icon = 'warning-outline',
  iconColor = '#9CA3AF',
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleGoHome = () => {
    router.replace('/');
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      handleGoHome();
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View
        className="bg-white"
        style={{
          paddingTop: insets.top,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3.84,
          elevation: 5,
        }}>
        <View className="flex-row items-center justify-between px-4 py-4">
          {showBackButton && (
            <TouchableOpacity onPress={handleGoBack} className="rounded-full bg-gray-50 p-3">
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>
          )}

          <View className="flex-1 items-center">
            <Text className="font-psemibold text-lg text-gray-900">Error</Text>
          </View>

          <View className="w-[44px]" />
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 items-center justify-center px-6">
        {/* Error Icon */}
        <View className="mb-6 h-32 w-32 items-center justify-center rounded-full bg-gray-50">
          <Ionicons name={icon} size={64} color={iconColor} />
        </View>

        {/* Title */}
        <Text className="mb-3 text-center font-psemibold text-2xl text-gray-900">{title}</Text>

        {/* Message */}
        <Text className="mb-8 text-center font-pregular text-base leading-6 text-gray-600">
          {message}
        </Text>

        {/* Action Buttons */}
        <View className="w-full space-y-3">
          {onRetry && (
            <TouchableOpacity onPress={onRetry} className="w-full rounded-lg bg-gray-900 px-6 py-4">
              <Text className="text-center font-pmedium text-base text-white">{retryText}</Text>
            </TouchableOpacity>
          )}

          {showHomeButton && (
            <TouchableOpacity
              onPress={handleGoHome}
              className={`w-full rounded-lg px-6 py-4 ${
                onRetry ? 'border border-gray-300 bg-white' : 'bg-gray-900'
              }`}>
              <Text
                className={`text-center font-pmedium text-base ${
                  onRetry ? 'text-gray-700' : 'text-white'
                }`}>
                Go to Home
              </Text>
            </TouchableOpacity>
          )}

          {showBackButton && !showHomeButton && (
            <TouchableOpacity
              onPress={handleGoBack}
              className="w-full rounded-lg border border-gray-300 bg-white px-6 py-4">
              <Text className="text-center font-pmedium text-base text-gray-700">Go Back</Text>
            </TouchableOpacity>
          )}

          {/* Custom Actions */}
          {customActions}
        </View>
      </View>
    </View>
  );
};

export default ErrorFallback;
