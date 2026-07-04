// src/design/index.ts
// Public barrel for the Sanctuary design system.
// Usage: import { Button, Field, Text, Touchable, Icon, useTheme, ThemeProvider } from '@/src/design';

// Tokens
export { semantic, light, dark, spacing, radius, zIndex, motion, elevation, typography } from './tokens';
export type { TextVariant } from './tokens';

// Theme
export { ThemeProvider } from './theme/ThemeProvider';
export type { Theme } from './theme/ThemeProvider';
export { useTheme } from './theme/useTheme';

// Primitives
export { Text, Touchable, Icon, icons } from './primitives';
export type { IconName } from './primitives';

// Components
export { Button, Field } from './components';
export type { ButtonVariant, ButtonSize } from './components';
