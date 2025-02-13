import { Stack } from 'expo-router';

const GuestDetailsLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="[booking]" options={{ headerShown: false }} />
      <Stack.Screen name="guestBookingConfirmation" options={{ headerShown: false }} />
    </Stack>
  );
};

export default GuestDetailsLayout;
