import React from 'react';
import { Stack } from 'expo-router';

const AuthLayout = () => {
  return (
    <>
      {/* Auth stack with fade animation */}
      <Stack screenOptions={{ animation: 'fade' }}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        {/* <Stack.Screen name="guestReferral" options={{ headerShown: false }} />
        <Stack.Screen
          name="guestRegistration"
          options={{ headerShown: false }}
        /> */}
      </Stack>
    </>
  );
};

export default AuthLayout;
