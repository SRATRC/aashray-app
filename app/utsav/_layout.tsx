import { Stack } from 'expo-router';
import React from 'react';

const UtsavDetailsLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="dailySchedule"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="utsavGuidelines"
          options={{ headerShown: false, presentation: 'modal' }}
        />
      </Stack>
    </>
  );
};

export default UtsavDetailsLayout;
