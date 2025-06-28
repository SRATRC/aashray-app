import '../global.css';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { SystemBars } from 'react-native-edge-to-edge';
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
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (!loading && !hasNavigated.current) {
      hasNavigated.current = true;

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
  }, [loading, user, router]);

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
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

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

  // Initialize auth store on app startup
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

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
  const loading = useAuthStore((state) => state.loading);

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: '#ffffff' }}></View>;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SystemBars style="dark" />
        <AppNavigator />
        <Toast />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

export default Sentry.wrap(RootLayout);
