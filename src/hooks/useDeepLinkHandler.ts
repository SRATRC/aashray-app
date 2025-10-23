import { useEffect, useRef, useCallback } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';
import { parseDeepLink, buildRoute } from '@/src/utils/deeplinkParser';
import { ParsedDeepLink, DeepLinkType } from '@/src/types/deeplink';

interface UseDeepLinkHandlerProps {
  isAuthenticated: boolean;
  onUnauthenticatedDeepLink?: (deepLink: ParsedDeepLink) => void;
}

interface UseDeepLinkHandlerReturn {
  isProcessing: boolean;
}

/**
 * Hook to handle deep linking throughout the app
 */
export const useDeepLinkHandler = ({
  isAuthenticated,
  onUnauthenticatedDeepLink,
}: UseDeepLinkHandlerProps): UseDeepLinkHandlerReturn => {
  const router = useRouter();
  const segments = useSegments();

  // Refs for state management without re-renders
  const isProcessingRef = useRef(false);
  const lastProcessedUrlRef = useRef<string | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigationLockTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialUrlHandledRef = useRef(false); // 👈 NEW: Track if initial URL was handled

  /**
   * Check if URL is a development/internal URL that should be ignored
   */
  const isInternalUrl = useCallback((url: string): boolean => {
    const internalPatterns = [
      'exp+aashray://expo-development-client',
      'exp://192.168',
      'exp://localhost',
      'exp://127.0.0.1',
    ];

    return internalPatterns.some((pattern) => url.startsWith(pattern));
  }, []);

  /**
   * Navigates to a parsed deep link
   */
  const navigateToDeepLink = useCallback(
    (deepLink: ParsedDeepLink) => {
      if (isProcessingRef.current) {
        console.log('🚫 Navigation already in progress, ignoring');
        return;
      }

      // Lock navigation
      isProcessingRef.current = true;

      try {
        const targetRoute = buildRoute(deepLink);
        const currentPath = `/${segments.join('/')}`;

        // Check if already on target route
        if (currentPath === targetRoute) {
          console.log('✋ Already on target route:', targetRoute);
          return;
        }

        console.log('🚀 Navigating to:', targetRoute);

        // Navigate based on deep link type
        if (deepLink.type === DeepLinkType.UNKNOWN) {
          router.replace('/+not-found');
        } else {
          router.replace(targetRoute);
        }
      } catch (error) {
        console.error('❌ Navigation error:', error);
        router.replace('/+not-found');
      } finally {
        // Release navigation lock after a delay
        navigationLockTimeoutRef.current = setTimeout(() => {
          isProcessingRef.current = false;
        }, 1000);
      }
    },
    [router, segments]
  );

  /**
   * Processes a deep link URL
   */
  const processDeepLink = useCallback(
    (url: string) => {
      if (isInternalUrl(url)) {
        console.log('🔧 Ignoring development URL');
        return;
      }

      console.log('🔗 Processing deep link:', url);

      // Prevent duplicate processing
      if (isProcessingRef.current) {
        console.log('🚫 Deep link processing already in progress');
        return;
      }

      if (lastProcessedUrlRef.current === url) {
        console.log('🚫 Same URL already processed recently');
        return;
      }

      // Clear any pending processing
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }

      // Debounce processing
      processingTimeoutRef.current = setTimeout(() => {
        try {
          lastProcessedUrlRef.current = url;
          const deepLink = parseDeepLink(url);

          if (!deepLink) {
            console.warn('⚠️ Failed to parse deep link:', url);
            return;
          }

          // Handle based on authentication state
          if (isAuthenticated) {
            navigateToDeepLink(deepLink);
          } else {
            console.log('⏳ User not authenticated, storing pending deep link');
            onUnauthenticatedDeepLink?.(deepLink);
          }
        } catch (error) {
          console.error('❌ Error processing deep link:', error);
        }
      }, 300);
    },
    [isAuthenticated, navigateToDeepLink, onUnauthenticatedDeepLink, isInternalUrl]
  );

  /**
   * 👇 NEW: Separate effect for initial URL - runs only once
   */
  useEffect(() => {
    // Only handle initial URL once
    if (initialUrlHandledRef.current) return;

    const handleInitialUrl = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log('🔗 Initial URL (app launched):', initialUrl);
          processDeepLink(initialUrl);
        }
      } catch (error) {
        console.error('❌ Error getting initial URL:', error);
      } finally {
        initialUrlHandledRef.current = true;
      }
    };

    handleInitialUrl();
  }, []);

  useEffect(() => {
    // Handle deep link while app is running
    const handleDeepLink = (event: { url: string }) => {
      console.log('🔗 Deep link received (app running):', event.url);
      processDeepLink(event.url);
    };

    // Set up listener
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Cleanup
    return () => {
      subscription?.remove();
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      if (navigationLockTimeoutRef.current) {
        clearTimeout(navigationLockTimeoutRef.current);
      }
    };
  }, [processDeepLink]); // Only re-run if processDeepLink changes

  return {
    isProcessing: isProcessingRef.current,
  };
};