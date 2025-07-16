import '../global.css';
import { useEffect, useState, useRef } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
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
import * as Linking from 'expo-linking';

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

const AppNavigator = () => {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const segments = useSegments();
  const isProcessingDeepLink = useRef(false);
  const lastProcessedUrl = useRef<string | null>(null);
  const processingTimeout = useRef<NodeJS.Timeout | null>(null);

  const userExists = !!user;
  const needsPfp = userExists && !user.pfp;
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

  const navigateToPath = (path: string) => {
    if (isProcessingDeepLink.current) {
      console.log('🚫 Navigation already in progress, ignoring duplicate request');
      return;
    }

    isProcessingDeepLink.current = true;

    try {
      let targetRoute = '';
      let routeId = '';

      if (path.startsWith('/adhyayan/')) {
        routeId = path.split('/adhyayan/')[1];
        targetRoute = `/adhyayan/${routeId}`;
      } else if (path.startsWith('/event/')) {
        routeId = path.split('/event/')[1];
        targetRoute = `/event/${routeId}`;
      }

      if (targetRoute && routeId) {
        const currentPath = `/${segments.join('/')}`;
        if (currentPath === targetRoute) {
          console.log('✋ Already on target route, skipping navigation');
          isProcessingDeepLink.current = false; // Reset the flag
          return;
        }
        router.replace(targetRoute);
      }
    } catch (error) {
      console.error('❌ Error navigating to path:', error);
    } finally {
      setTimeout(() => {
        isProcessingDeepLink.current = false;
      }, 1000);
    }
  };

  // Deep link handling for events while the app is running
  useEffect(() => {
    const processDeepLink = (url: string) => {
      console.log('🔗 Processing deep link:', url);

      if (isProcessingDeepLink.current) {
        console.log('🚫 Deep link processing already in progress, ignoring');
        return;
      }
      if (lastProcessedUrl.current === url) {
        console.log('🚫 Same URL already processed recently, ignoring');
        return;
      }

      if (processingTimeout.current) {
        clearTimeout(processingTimeout.current);
      }

      processingTimeout.current = setTimeout(() => {
        try {
          lastProcessedUrl.current = url;
          let path = '';

          if (url.startsWith('aashray://')) {
            path = '/' + url.replace('aashray://', '');
          } else if (url.startsWith('https://aashray.vitraagvigyaan.org')) {
            path = url.replace('https://aashray.vitraagvigyaan.org', '');
          }

          if (path && isFullyOnboarded) {
            navigateToPath(path);
          } else if (path && !isFullyOnboarded) {
            console.log('⏳ User not fully authenticated, storing pending deep link:', path);
          }
        } catch (error) {
          console.error('❌ Error processing deep link:', error);
        }
      }, 300);
    };

    const handleDeepLink = (event: { url: string }) => {
      console.log('🔗 Deep link received (app running):', event.url);
      processDeepLink(event.url);
    };

    // Listen for incoming links while the app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // REMOVED the call to handleInitialUrl() to prevent conflict with Expo Router

    return () => {
      subscription?.remove();
      if (processingTimeout.current) {
        clearTimeout(processingTimeout.current);
      }
    };
  }, [isFullyOnboarded]); // Dependency on isFullyOnboarded is still good practice

  return (
    <Stack screenOptions={{ headerShown: false }}>
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
  const [fontsLoaded, fontError] = useFonts({
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
    <NotificationProvider>
      <QueryClientProvider client={queryClient}>
        <RootLayoutContent />
      </QueryClientProvider>
    </NotificationProvider>
  );
};

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
