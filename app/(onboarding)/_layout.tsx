import React from 'react';
import { Stack } from 'expo-router';

const OnboardingLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="imageCapture" options={{ headerShown: false }} />
        <Stack.Screen name="completeProfile" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

export default OnboardingLayout;
