import { Stack } from 'expo-router';

export default function SupportLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="[id]" options={{ headerShown: false }} />
        <Stack.Screen name="create" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
    </>
  );
}
