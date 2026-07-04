import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { semantic } from '../tokens';

type Scheme = 'light' | 'dark';

export type Theme = { scheme: Scheme; color: typeof semantic.light };

const ThemeCtx = createContext<Theme>({ scheme: 'light', color: semantic.light });

export function ThemeProvider({
  children,
  forceScheme,
}: {
  children: React.ReactNode;
  forceScheme?: Scheme;
}) {
  const sys = useColorScheme();
  // Phase 0: light only in production; forceScheme enables dark in Gallery/tests. Phase 3 flips to `forceScheme ?? sys`.
  const scheme: Scheme = forceScheme ?? 'light';
  return <ThemeCtx.Provider value={{ scheme, color: semantic[scheme] }}>{children}</ThemeCtx.Provider>;
}

export { ThemeCtx };
