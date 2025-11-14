import { Stack } from 'expo-router';

const GuestDetailsLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="[booking]" options={{ headerShown: false }} />
      <Stack.Screen name="bookingReview" options={{ headerShown: false }} />
    </Stack>
  );
};

export default GuestDetailsLayout;
