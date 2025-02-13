import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const getCurrentUser = async () => {
  const data = await AsyncStorage.getItem('user');
  return data ? JSON.parse(data) : null;
};

const setCurrentUser = async (user) => {
  await AsyncStorage.setItem('user', JSON.stringify(user));
};

const removeItem = async (key) => {
  await AsyncStorage.removeItem(key);
};

const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [data, setData] = useState({});
  const [guestData, setGuestData] = useState({});
  const [mumukshuData, setMumukshuData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // track if component is mounted
    getCurrentUser()
      .then((res) => {
        if (isMounted) {
          if (res) {
            setUser(res);
          } else {
            setUser(null);
          }
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false; // cleanup on unmount
    };
  }, []);

  const updateBooking = async (bookingType, item) => {
    setData((prev) => {
      const updated = { ...prev, [bookingType]: item, primary: bookingType };
      const keysToDelete = [
        'room',
        'travel',
        'food',
        'adhyayan',
        'validationData'
      ].filter((key) => key !== bookingType);
      keysToDelete.forEach((key) => delete updated[key]);
      return updated;
    });
  };

  const updateGuestBooking = async (bookingType, item) => {
    setGuestData((prev) => {
      const updated = { ...prev, [bookingType]: item, primary: bookingType };
      const keysToDelete = [
        'room',
        'travel',
        'food',
        'adhyayan',
        'validationData'
      ].filter((key) => key !== bookingType);
      keysToDelete.forEach((key) => delete updated[key]);
      return updated;
    });
  };

  const updateMumukshuBooking = async (bookingType, item) => {
    setMumukshuData((prev) => {
      const updated = { ...prev, [bookingType]: item, primary: bookingType };
      const keysToDelete = [
        'room',
        'travel',
        'food',
        'adhyayan',
        'validationData'
      ].filter((key) => key !== bookingType);
      keysToDelete.forEach((key) => delete updated[key]);
      return updated;
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
        updateMumukshuBooking
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
