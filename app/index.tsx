import { Redirect } from 'expo-router';

// This component's only job is to redirect the user.
// The routing logic in `_layout.tsx` will handle where the user should actually go.
export default function Index() {
  return <Redirect href="/home" />;
}
