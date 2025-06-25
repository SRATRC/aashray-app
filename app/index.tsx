import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useGlobalContext } from '../context/GlobalProvider';
import { handleUserNavigation } from '../utils/navigationValidations';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

export default function Index() {
  const { loading, user } = useGlobalContext();
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
