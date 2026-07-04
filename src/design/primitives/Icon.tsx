import React from 'react';
import { View } from 'react-native';
import { icons, IconName } from '../icons/registry';
import { useTheme } from '../theme/useTheme';

export function Icon({
  name,
  size = 24,
  color,
  strokeWidth = 1.5,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const t = useTheme();
  const C = icons[name];
  // lucide-react-native forwards `testID` as the web-only `data-testid` attribute on the
  // underlying react-native-svg node, so it never reaches native as a real `testID` prop
  // (confirmed by inspecting the rendered tree). Wrap in a plain View to carry the testID
  // that @testing-library/react-native's getByTestId (and E2E tooling) rely on.
  return (
    <View testID={`icon-${name}`}>
      <C size={size} color={color ?? t.color.text.primary} strokeWidth={strokeWidth} />
    </View>
  );
}
