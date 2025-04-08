import '../global.css';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationProvider } from '../context/NotificationContext';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import GlobalProvider from '../context/GlobalProvider';
import Toast from 'react-native-toast-message';
import * as Sentry from '@sentry/react-native';
import * as Notifications from 'expo-notifications';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

Sentry.init({
  dsn: 'https://788f18c3ef141608ef9be5d1f5e38db9@o4505325938278400.ingest.us.sentry.io/4507877656952832',

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // enableSpotlight: __DEV__,
});

SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  const [fontsLoaded, error] = useFonts({
    'Poppins-Black': require('../assets/fonts/Poppins-Black.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-ExtraBold': require('../assets/fonts/Poppins-ExtraBold.ttf'),
    'Poppins-ExtraLight': require('../assets/fonts/Poppins-ExtraLight.ttf'),
    'Poppins-Light': require('../assets/fonts/Poppins-Light.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Thin': require('../assets/fonts/Poppins-Thin.ttf'),
  });

  useEffect(() => {
    if (error) throw error;

    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#FFFCF5');
      NavigationBar.setButtonStyleAsync('dark');
    }
  }, []);

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <NotificationProvider>
      <QueryClientProvider client={new QueryClient()}>
        <GlobalProvider>
          <GestureHandlerRootView>
            <BottomSheetModalProvider>
              <StatusBar style="dark" />
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(common)" options={{ headerShown: false }} />
                <Stack.Screen name="(payment)" options={{ headerShown: false }} />
                <Stack.Screen name="profile" options={{ headerShown: false }} />
                <Stack.Screen name="booking" options={{ headerShown: false }} />
                <Stack.Screen name="guestBooking" options={{ headerShown: false }} />
                <Stack.Screen name="mumukshuBooking" options={{ headerShown: false }} />
              </Stack>
              <Toast />
            </BottomSheetModalProvider>
          </GestureHandlerRootView>
        </GlobalProvider>
      </QueryClientProvider>
    </NotificationProvider>
  );
};

export default Sentry.wrap(RootLayout);
