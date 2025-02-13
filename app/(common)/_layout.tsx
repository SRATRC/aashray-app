import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Stack } from 'expo-router';

const CommonLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="wifi" options={{ headerShown: false }} />
        <Stack.Screen name="camera" options={{ headerShown: false }} />
        <Stack.Screen
          name="maintenanceRequestList"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="menu" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

export default CommonLayout;
