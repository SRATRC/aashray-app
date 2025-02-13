import React from 'react';
import { Stack } from 'expo-router';

const AuthLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="confirmation" options={{ headerShown: false }} />
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
