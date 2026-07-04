import { render } from '@testing-library/react-native';

import { Button, Field, Text, Touchable, Icon, useTheme, ThemeProvider } from '../../index';
import { Gallery } from '../Gallery';

// Also exercises the public barrel end to end (import path used by consumers).

test('renders the full catalog in both light and dark without throwing', () => {
  const { getByText } = render(<Gallery />);
  expect(getByText('Sanctuary Gallery — light')).toBeTruthy();
  expect(getByText('Sanctuary Gallery — dark')).toBeTruthy();
});

test('public barrel exports resolve', () => {
  expect(Button).toBeDefined();
  expect(Field).toBeDefined();
  expect(Text).toBeDefined();
  expect(Touchable).toBeDefined();
  expect(Icon).toBeDefined();
  expect(useTheme).toBeDefined();
  expect(ThemeProvider).toBeDefined();
});
