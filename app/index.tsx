import React, { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../context/GlobalProvider';
import { handleUserNavigation } from '../utils/navigationValidations';

import 'react-native-reanimated';

const Index = () => {
  const { loading, user } = useGlobalContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      handleUserNavigation(user, router);
    }
  }, [loading]);

  return (
    <SafeAreaView>
      <StatusBar style="dark" />
      <View className="h-full items-center justify-center">
        <ActivityIndicator />
      </View>
    </SafeAreaView>
  );
};

export default Index;
