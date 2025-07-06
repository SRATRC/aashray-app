import '../global.css';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { SystemBars } from 'react-native-edge-to-edge';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationProvider } from '@/context/NotificationContext';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
});

SplashScreen.preventAutoHideAsync();

// Component that handles initial routing
const AppNavigator = () => {
  const user = useAuthStore((state) => state.user);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setIsHydrated(true));
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }
    return unsub;
  }, []);

  // Add a small delay after hydration to ensure all providers are ready
  useEffect(() => {
    if (isHydrated) {
      const timer = setTimeout(() => setIsReady(true), 150);
      return () => clearTimeout(timer);
    }
  }, [isHydrated]);

  // Hide the splash screen once the app is ready and routes are determined
  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  const userExists = !!user;

  // State 1: User is logged in but has no profile picture
  const needsPfp = userExists && !user.pfp;

  // State 2: User has a PFP but has not completed their profile details
  const isProfileComplete =
    userExists &&
    !!user.issuedto &&
    !!user.email &&
    !!user.mobno &&
    !!user.address &&
    !!user.dob &&
    !!user.gender &&
    !!user.idType &&
    !!user.idNo &&
    !!user.country &&
    !!user.state &&
    !!user.city &&
    !!user.pin &&
    !!user.center;

  const needsProfileCompletion = userExists && !!user.pfp && !isProfileComplete;

  // State 3: User is fully logged in and onboarded
  const isFullyOnboarded = userExists && isProfileComplete;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Protected guard={!userExists}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={needsPfp}>
        <Stack.Screen name="(onboarding)/imageCapture" />
      </Stack.Protected>

      <Stack.Protected guard={needsProfileCompletion}>
        <Stack.Screen name="(onboarding)/completeProfile" />
      </Stack.Protected>

      <Stack.Protected guard={isFullyOnboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(home)" />
        <Stack.Screen name="(payment)" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="booking" />
        <Stack.Screen name="guestBooking" />
        <Stack.Screen name="mumukshuBooking" />
        <Stack.Screen name="adhyayan" />
        <Stack.Screen name="index" />
      </Stack.Protected>

      <Stack.Protected guard={needsPfp || isFullyOnboarded}>
        <Stack.Screen name="(common)" />
      </Stack.Protected>
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
