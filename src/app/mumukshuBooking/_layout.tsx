import { Stack } from 'expo-router';

const MumukshuDetailsLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="[booking]" options={{ headerShown: false }} />
      <Stack.Screen name="bookingReview" options={{ headerShown: false }} />
    </Stack>
  );
};

export default MumukshuDetailsLayout;
