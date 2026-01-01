import '../../global.css';
import { StrictMode, useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { SystemBars } from 'react-native-edge-to-edge';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationProvider } from '@/src/context/NotificationContext';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/src/stores';
import { useDeepLinkHandler } from '@/src/hooks/useDeepLinkHandler';
import { ParsedDeepLink } from '@/src/types/deeplink';
import Toast from 'react-native-toast-message';
import UpdateManager from '@/src/utils/updateManager';
import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { CustomAlert } from '@/src/components/CustomAlert';

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
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.mobileReplayIntegration({
      maskAllText: false,
      maskAllImages: false,
      maskAllVectors: false,
    }),
  ],
});

SplashScreen.preventAutoHideAsync();

/**
 * Helper hook to determine user authentication state
 */
const useAuthState = () => {
  const user = useAuthStore((state) => state.user);

  const userExists = !!user;
  const needsPfp = userExists && !user.pfp;

  // Check if all required fields are present
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
  const isFullyOnboarded = userExists && isProfileComplete;

  return {
    userExists,
    needsPfp,
    needsProfileCompletion,
    isFullyOnboarded,
  };
};

const AppNavigator = () => {
  const authState = useAuthState();

  // Handle deep links when user is not authenticated
  const handleUnauthenticatedDeepLink = (deepLink: ParsedDeepLink) => {
    console.log('📌 Storing pending deep link for after authentication:', deepLink);
    // You could store this in AsyncStorage or a global state if needed
    // For now, we'll just log it
  };

  // Set up deep link handling
  useDeepLinkHandler({
    isAuthenticated: authState.isFullyOnboarded,
    onUnauthenticatedDeepLink: handleUnauthenticatedDeepLink,
  });

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!authState.userExists}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={authState.needsPfp}>
        <Stack.Screen name="(onboarding)/imageCapture" />
      </Stack.Protected>
      <Stack.Protected guard={authState.needsProfileCompletion}>
        <Stack.Screen name="(onboarding)/completeProfile" />
      </Stack.Protected>
      <Stack.Protected guard={authState.isFullyOnboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(home)" />
        <Stack.Screen name="(payment)" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="booking" />
        <Stack.Screen name="guestBooking" />
        <Stack.Screen name="mumukshuBooking" />
        <Stack.Screen name="adhyayan" />
        <Stack.Screen name="utsav" />

        <Stack.Screen name="+not-found" />
      </Stack.Protected>
    </Stack>
  );
};

const RootLayout = () => {
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Black': require('@/src/assets/fonts/Poppins-Black.ttf'),
    'Poppins-Bold': require('@/src/assets/fonts/Poppins-Bold.ttf'),
    'Poppins-ExtraBold': require('@/src/assets/fonts/Poppins-ExtraBold.ttf'),
    'Poppins-ExtraLight': require('@/src/assets/fonts/Poppins-ExtraLight.ttf'),
    'Poppins-Light': require('@/src/assets/fonts/Poppins-Light.ttf'),
    'Poppins-Medium': require('@/src/assets/fonts/Poppins-Medium.ttf'),
    'Poppins-Regular': require('@/src/assets/fonts/Poppins-Regular.ttf'),
    'Poppins-SemiBold': require('@/src/assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Thin': require('@/src/assets/fonts/Poppins-Thin.ttf'),
  });

  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setIsAuthReady(true));
    if (useAuthStore.persist.hasHydrated()) {
      setIsAuthReady(true);
    }
    return unsub;
  }, []);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    async function hideSplash() {
      if (fontsLoaded && isAuthReady) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        await SplashScreen.hideAsync();
      }
    }
    hideSplash();
  }, [fontsLoaded, isAuthReady]);

  if (!fontsLoaded || !isAuthReady) {
    return null;
  }

  return (
    <StrictMode>
      <NotificationProvider>
        <QueryClientProvider client={queryClient}>
          <RootLayoutContent />
        </QueryClientProvider>
      </NotificationProvider>
    </StrictMode>
  );
};

const RootLayoutContent = () => {
  return (
    <KeyboardProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <SystemBars style="dark" />
          <AppNavigator />
          <CustomAlert />
          <UpdateManager />
          <Toast />
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </KeyboardProvider>
  );
};

export default Sentry.wrap(RootLayout);
