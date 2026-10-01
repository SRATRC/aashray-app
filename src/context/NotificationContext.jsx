import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { createPushTokenRegistrar } from '../utils/createPushTokenRegistrar';
import { registerForPushNotificationsAsync } from '../utils/registerForPushNotificationsAsync';
import { useRouter } from 'expo-router';

const NotificationContext = createContext(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);

  const notificationListener = useRef();
  const responseListener = useRef();
  const pushTokenRegistrar = useRef(null);
  // Terminal failures (permission denied, simulator, missing project id) will
  // not fix themselves on the next foreground; latch them so we stop re-running
  // the whole registration and churning a fresh error object every time.
  const registrationHaltedRef = useRef(false);
  // Notification responses already handled, so the cold-start check and the
  // live listener cannot both navigate for the same tap.
  const handledResponseIdsRef = useRef(new Set());

  if (!pushTokenRegistrar.current) {
    pushTokenRegistrar.current = createPushTokenRegistrar(registerForPushNotificationsAsync);
  }

  const router = useRouter();

  const registerPushToken = () => {
    if (registrationHaltedRef.current) return Promise.resolve(null);
    return pushTokenRegistrar.current.ensureRegistered().then(
      (token) => {
        setExpoPushToken(token);
        return token;
      },
      (registrationError) => {
        if (
          /permission not granted|physical device|project id not found/i.test(
            String(registrationError?.message)
          )
        ) {
          registrationHaltedRef.current = true;
        }
        setError((prev) =>
          prev?.message === registrationError?.message ? prev : registrationError
        );
        throw registrationError;
      }
    );
  };

  useEffect(() => {
    if (AppState.currentState === 'active') {
      registerPushToken().catch(() => {});
    }

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        registerPushToken().catch(() => {});
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    const handleNotificationResponse = (response) => {
      const id = response?.notification?.request?.identifier;
      if (id) {
        if (handledResponseIdsRef.current.has(id)) return;
        handledResponseIdsRef.current.add(id);
      }

      // Extract data from notification
      const data = response?.notification?.request?.content?.data;

      // Navigate using the router if the screen is specified
      if (data?.screen) {
        try {
          // Absolute path: a relative push resolves against whatever route is
          // currently focused and can land on the wrong screen.
          const screen = `/${String(data.screen).replace(/^\/+/, '')}`;

          // Handle any additional params if needed
          if (data.params) {
            router.push({
              pathname: screen,
              params: data.params,
            });
          } else {
            router.push(screen);
          }
        } catch (error) {
          console.error('Navigation error:', error);
          // Fallback navigation if needed
          try {
            router.push('/');
          } catch (fallbackError) {
            console.error('Fallback navigation failed:', fallbackError);
          }
        }
      }
    };

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    // A tap that cold-launches the app fires before the listener above exists;
    // the identifier guard keeps this from double-navigating when both run.
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) handleNotificationResponse(response);
      })
      .catch(() => {});

    return () => {
      appStateSubscription.remove();
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ expoPushToken, notification, error }}>
      {children}
    </NotificationContext.Provider>
  );
};
