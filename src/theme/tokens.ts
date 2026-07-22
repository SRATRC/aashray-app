import palette from './palette';

export { palette };

// Flat aliases preserving the exact keys the legacy `colors` object exposed,
// so existing `colors.xxx` call sites keep working after Task 4.
export const colors = {
  orange: palette.orange,
  secondary_50: palette.secondary[50],
  secondary_100: palette.secondary[100],
  secondary_200: palette.secondary[200],
  gray_100: palette.gray[100],
  gray_200: palette.gray[200],
  gray_400: palette.gray[400],
  gray_500: palette.gray[500],
  gray_600: palette.gray[600],
  gray_700: palette.gray[700],
  gray_800: palette.gray[800],
  gray_900: palette.gray[900],
  black: palette.black.DEFAULT,
  black_100: palette.black[100],
  black_200: palette.black[200],
  white: palette.white.DEFAULT,
  white_100: palette.white[100],
  zinc_100: palette.zinc[100],
} as const;

export type Colors = typeof colors;
