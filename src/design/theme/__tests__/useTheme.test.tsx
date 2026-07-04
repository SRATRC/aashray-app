import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider } from '../ThemeProvider';
import { useTheme } from '../useTheme';

function Probe() {
  const t = useTheme();
  return <Text>{t.color.text.primary}</Text>;
}

test('provides light tokens by default', () => {
  const { getByText } = render(
    <ThemeProvider forceScheme="light">
      <Probe />
    </ThemeProvider>
  );
  expect(getByText('#211C15')).toBeTruthy();
});
