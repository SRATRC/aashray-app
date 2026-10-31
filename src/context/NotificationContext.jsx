import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
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
  const expoPushTokenRef = useRef(null);
  const askedThisLaunchRef = useRef(false);

  const router = useRouter();

  useEffect(() => {
    const register = (ask) => {
      if (ask) askedThisLaunchRef.current = true;
      registerForPushNotificationsAsync({ ask }).then(
        (token) => {
          expoPushTokenRef.current = token;
          setExpoPushToken(token);
          setError(null);
        },
        (error) => setError(error)
      );
    };

    if (AppState.currentState === 'active') {
      register(true);
    }

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && !expoPushTokenRef.current) {
        register(!askedThisLaunchRef.current);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;

      if (data?.screen) {
        try {
          const screen = data.screen.replace(/^\/+/, '');

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
          try {
            router.push('/');
          } catch (fallbackError) {
            console.error('Fallback navigation failed:', fallbackError);
          }
        }
      }
    });

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
