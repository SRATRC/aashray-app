// src/design/tokens/scale.ts
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 64,
} as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;
export const zIndex = {
  base: 0,
  raised: 10,
  sticky: 20,
  header: 30,
  scrim: 40,
  sheet: 50,
  modal: 60,
  toast: 70,
  tooltip: 80,
} as const;
export const motion = {
  duration: { fast: 150, base: 220, slow: 300, deliberate: 420 },
  spring: {
    gentle: { damping: 18, stiffness: 180, mass: 1 },
    snappy: { damping: 20, stiffness: 260, mass: 1 },
  },
  press: {
    scale: 0.98,
    opacity: 0.92,
    ripple: 'rgba(33,28,21,0.10)',
    disabledOpacity: 0.45,
    durationIn: 80,
    durationOut: 120,
  },
} as const;
// Warm ink-tinted elevation. iOS shadow + Android elevation.
export const elevation = {
  e0: {},
  e1: {
    shadowColor: '#211C15',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  e2: {
    shadowColor: '#211C15',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  e3: {
    shadowColor: '#211C15',
    shadowOpacity: 0.14,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
} as const;
