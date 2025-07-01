import '../global.css';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { SystemBars } from 'react-native-edge-to-edge';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationProvider } from '@/context/NotificationContext';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { handleUserNavigation } from '@/utils/navigationValidations';
import { useAuthStore } from '@/stores';
import Toast from 'react-native-toast-message';
import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

Sentry.init({
  dsn: 'https://788f18c3ef141608ef9be5d1f5e38db9@o4505325938278400.ingest.us.sentry.io/4507877656952832',
  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // enableSpotlight: __DEV__,
});

SplashScreen.preventAutoHideAsync();

// Component that handles initial routing
const AppNavigator = () => {
  const user = useAuthStore((state) => state.user);
  const userExists = !!user;
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setIsHydrated(true));

    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return unsub;
  }, []);

  useEffect(() => {
    // Add a small delay to ensure all providers are ready
    if (isHydrated) {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [isHydrated]);

  useEffect(() => {
    // Only run navigation logic once everything is ready
    if (isReady) {
      (async () => {
        try {
          await handleUserNavigation(user, router);
        } catch (error) {
          console.error('Navigation error:', error);
          router.replace('/(auth)/sign-in');
        } finally {
          // Hide splash screen after navigation
          setTimeout(() => {
            SplashScreen.hideAsync();
          }, 200);
        }
      })();
    }
  }, [isReady, userExists, router]);

  // Show loading screen while not ready
  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: '#ffffff' }} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(common)" />
      <Stack.Screen name="(payment)" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="booking" />
      <Stack.Screen name="guestBooking" />
      <Stack.Screen name="mumukshuBooking" />
    </Stack>
  );
};

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
  }, [error]);

  return (
    <NotificationProvider>
      <QueryClientProvider client={queryClient}>
        {fontsLoaded ? (
          <RootLayoutContent />
        ) : (
          // Render a blank screen while fonts are loading so that a navigator is still mounted.
          <View style={{ flex: 1, backgroundColor: '#ffffff' }} />
        )}
      </QueryClientProvider>
    </NotificationProvider>
  );
};

// Separate component to access auth store
const RootLayoutContent = () => {
  return (
    <KeyboardProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <SystemBars style="dark" />
          <AppNavigator />
          <Toast />
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </KeyboardProvider>
  );
};

export default Sentry.wrap(RootLayout);
