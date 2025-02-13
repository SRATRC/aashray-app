import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef
} from 'react';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../utils/registerForPushNotificationsAsync';
import { useRouter } from 'expo-router';

const NotificationContext = createContext(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);

  const notificationListener = useRef();
  const responseListener = useRef();

  const router = useRouter();

  useEffect(() => {
    registerForPushNotificationsAsync().then(
      (token) => setExpoPushToken(token),
      (error) => setError(error)
    );

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        // Extract data from notification
        const data = response.notification.request.content.data;

        // Navigate using the router if the screen is specified
        if (data?.screen) {
          try {
            // Remove leading slash if present and ensure proper URL format
            const screen = data.screen.replace(/^\/+/, '');

            // Handle any additional params if needed
            if (data.params) {
              router.push({
                pathname: screen,
                params: data.params
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
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{ expoPushToken, notification, error }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
