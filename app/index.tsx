import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../context/GlobalProvider';
import { handleUserNavigation } from '../utils/navigationValidations';

import 'react-native-reanimated';

export default function Index() {
  const { loading, user } = useGlobalContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      (async () => {
        await handleUserNavigation(user, router);
      })();
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
}
