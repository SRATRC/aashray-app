import { Stack } from 'expo-router';
import React from 'react';

const CommonLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="wifi" options={{ headerShown: false }} />
        <Stack.Screen name="maintenanceRequestList" options={{ headerShown: false }} />
        <Stack.Screen name="menu" options={{ headerShown: false }} />
        <Stack.Screen name="pendingPayments" options={{ headerShown: false }} />
        <Stack.Screen name="contactInfo" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

export default CommonLayout;
