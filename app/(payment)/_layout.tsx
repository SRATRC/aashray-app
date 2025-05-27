import { Stack } from 'expo-router';
import React from 'react';

const PaymentsLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="bookingConfirmation" options={{ headerShown: false }} />
        <Stack.Screen name="paymentFailed" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

export default PaymentsLayout;
