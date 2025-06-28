import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores';
import { handleUserNavigation } from '@/utils/navigationValidations';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

export default function Index() {
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      (async () => {
        await handleUserNavigation(user, router);
        await SplashScreen.hideAsync();
      })();
    }
  }, [loading, user, router]);

  return <View style={{ flex: 1 }} />;
}
