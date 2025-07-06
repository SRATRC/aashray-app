import React from 'react';
import { Stack } from 'expo-router';

const CommonLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="camera" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

export default CommonLayout;
