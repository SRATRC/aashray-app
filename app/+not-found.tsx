import React from 'react';
import { Text } from 'react-native';
import ErrorFallback from '@/components/ErrorFallback';

const NotFoundScreen = () => {
  return (
    <ErrorFallback
      title="Oops! Page Not Found"
      message="The page you're looking for doesn't exist or the link might be broken. Don't worry, let's get you back on track."
      icon="help-outline"
      iconColor="#9CA3AF"
      showBackButton={true}
      showHomeButton={true}
      customActions={
        <Text className="mt-4 text-center font-pregular text-sm text-gray-500">
          If you continue to experience issues, please contact support.
        </Text>
      }
    />
  );
};

export default NotFoundScreen;
