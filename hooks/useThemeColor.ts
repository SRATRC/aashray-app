/**
 * This hook is deprecated since the app only uses one theme.
 * Use direct color imports from @/constants/colors instead.
 */

import colors from '@/constants/colors';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName?: string
): string {
  // Return light color if provided, otherwise return a default color
  if (props.light) {
    return props.light;
  }

  // Return default colors based on common color names
  switch (colorName) {
    case 'text':
      return colors.gray_900;
    case 'textMuted':
      return colors.gray_500;
    case 'card':
      return colors.white;
    case 'border':
      return colors.gray_200;
    case 'primary':
      return colors.orange;
    case 'icon':
      return colors.gray_700;
    case 'red':
      return '#EB5757';
    default:
      return colors.gray_900;
  }
}
