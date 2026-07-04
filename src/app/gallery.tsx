// src/app/gallery.tsx
// Dev-only route for the Sanctuary design system catalog. Reachable at `/gallery`.
// Not declared in the root Stack (see src/app/_layout.tsx) — expo-router
// auto-registers file routes that aren't referenced by a `Stack.Screen`, so no
// changes to the existing (guarded) Stack config are needed. Content is gated
// behind `__DEV__` so production builds show a minimal notice instead of the
// full catalog.
import React from 'react';
import { View } from 'react-native';

import { Text, spacing } from '@/src/design';
import { Gallery } from '@/src/design/gallery/Gallery';

export default function GalleryScreen() {
  if (!__DEV__) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[6] }}>
        <Text variant="body" color="muted" align="center">
          The design gallery is only available in development builds.
        </Text>
      </View>
    );
  }
  return <Gallery />;
}
