import { Stack } from 'expo-router';
import React from 'react';

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
