import { Stack } from 'expo-router';
import React from 'react';

const PaymentsLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="paymentConfirmation" options={{ headerShown: false }} />
        <Stack.Screen name="bookingConfirmation" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

export default PaymentsLayout;
