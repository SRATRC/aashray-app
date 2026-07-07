import { Stack } from 'expo-router';
import React from 'react';

const CommonLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="qr" options={{ headerShown: false }} />
        <Stack.Screen name="profileDetails" options={{ headerShown: false }} />
        <Stack.Screen name="transactions" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

export default CommonLayout;
