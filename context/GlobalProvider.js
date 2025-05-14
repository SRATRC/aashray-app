import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

// const getCurrentUser = async () => {
//   const data = await AsyncStorage.getItem('user');
//   return data ? JSON.parse(data) : null;
// };

const getStorage = async () => {
  const data = await AsyncStorage.multiGet(['user', 'settings']);
  return data;
};

const setCurrentUser = async (user) => {
  await addItem('user', user);
};

const removeItem = async (key) => {
  await AsyncStorage.removeItem(key);
};

const addItem = async (key, value) => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [data, setData] = useState({});
  const [guestData, setGuestData] = useState({});
  const [mumukshuData, setMumukshuData] = useState({});
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});

  // Save settings to AsyncStorage whenever they change
  useEffect(() => {
    if (Object.keys(settings).length > 0) {
      addItem('settings', settings);
    }
  }, [settings]);

  useEffect(() => {
    let isMounted = true; // track if component is mounted
    getStorage()
      .then((res) => {
        if (isMounted) {
          if (res) {
            setUser(res[0][1] ? JSON.parse(res[0][1]) : null);
            setSettings(res[1][1] ? JSON.parse(res[1][1]) : {});
          } else {
            setUser(null);
            setSettings({});
          }
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    getStorage();
    // .then((res) => {
    //   if (isMounted) {
    //     if (res) {
    //       log(res);
    //       // setSettings(res.settings);
    //     } else {
    //       setSettings({});
    //     }
    //   }
    // })
    // .catch((error) => {
    //   console.log(error);
    // })
    // .finally(() => {
    //   if (isMounted) setLoading(false);
    // });

    return () => {
      isMounted = false; // cleanup on unmount
    };
  }, []);

  const updateBooking = async (bookingType, item) => {
    setData((prev) => {
      const updated = { ...prev, [bookingType]: item, primary: bookingType };
      const keysToDelete = ['room', 'travel', 'food', 'adhyayan', 'validationData'].filter(
        (key) => key !== bookingType
      );
      keysToDelete.forEach((key) => delete updated[key]);
      return updated;
    });
  };

  const updateGuestBooking = async (bookingType, item) => {
    setGuestData((prev) => {
      const updated = { ...prev, [bookingType]: item, primary: bookingType };
      const keysToDelete = ['room', 'travel', 'food', 'adhyayan', 'validationData'].filter(
        (key) => key !== bookingType
      );
      keysToDelete.forEach((key) => delete updated[key]);
      return updated;
    });
  };

  const updateMumukshuBooking = async (bookingType, item) => {
    setMumukshuData((prev) => {
      const updated = { ...prev, [bookingType]: item, primary: bookingType };
      const keysToDelete = ['room', 'travel', 'food', 'adhyayan', 'validationData'].filter(
        (key) => key !== bookingType
      );
      keysToDelete.forEach((key) => delete updated[key]);
      return updated;
    });
  };

  // Function to clean up validation-related state
  const cleanupValidationState = () => {
    setMumukshuData((prev) => {
      // Clean up all validation data but preserve error tracking if needed
      const { validationData, ...rest } = prev;
      return rest;
    });
  };

  // Function to reset all validation and error states
  const resetValidationState = () => {
    setMumukshuData((prev) => {
      const { validationData, dismissedValidationError, errorAlreadyShown, errorMessage, ...rest } =
        prev;
      return rest;
    });
  };

  return (
    <GlobalContext.Provider
      value={{
        user,
        setUser,
        data,
        setData,
        guestData,
        setGuestData,
        mumukshuData,
        setMumukshuData,
        loading,
        setCurrentUser,
        removeItem,
        updateBooking,
        updateGuestBooking,
        updateMumukshuBooking,
        cleanupValidationState,
        resetValidationState,
        settings,
        setSettings,
      }}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
