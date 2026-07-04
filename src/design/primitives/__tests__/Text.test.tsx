import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { Text } from '../Text';

test('applies variant family/size and token color', () => {
  const { getByText } = render(
    <ThemeProvider>
      <Text variant="title">Hi</Text>
    </ThemeProvider>
  );
  const style = getByText('Hi').props.style;
  const flat = Array.isArray(style) ? Object.assign({}, ...style) : style;
  expect(flat.fontFamily).toBe('Fraunces-SemiBold');
  expect(flat.fontSize).toBe(26);
  expect(flat.color).toBe('#211C15');
});
