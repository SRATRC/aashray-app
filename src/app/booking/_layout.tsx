import { Stack } from 'expo-router';
import React from 'react';

const DetailsLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="[booking]" options={{ headerShown: false }} />
        <Stack.Screen name="bookingConfirmation" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

export default DetailsLayout;
