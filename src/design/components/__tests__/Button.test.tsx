import { render, fireEvent } from '@testing-library/react-native';

import { ThemeProvider } from '../../theme/ThemeProvider';
import { Button } from '../Button';

const wrap = (ui: React.ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

// Note: @testing-library/react-native's `fireEvent.press` invokes the `onPress`
// prop directly and does not synthesize the full native gesture lifecycle, so a
// real tap (which always fires `onPressIn` before `onPress`) is simulated here
// as `pressIn` followed by `press`, matching Touchable.test.tsx.
test('loading hides label + blocks press; disabled blocks press', () => {
  const onPress = jest.fn();
  const { queryByText, getByTestId } = wrap(<Button text="Sign In" loading onPress={onPress} />);
  expect(queryByText('Sign In')).toBeNull();
  expect(getByTestId('button-spinner')).toBeTruthy();
  fireEvent(getByTestId('button-root'), 'pressIn');
  fireEvent.press(getByTestId('button-root'));
  expect(onPress).not.toHaveBeenCalled();
});

test('renders label and calls onPress when enabled', () => {
  const onPress = jest.fn();
  const { getByText, getByTestId } = wrap(<Button text="Sign In" onPress={onPress} />);
  expect(getByText('Sign In')).toBeTruthy();
  fireEvent(getByTestId('button-root'), 'pressIn');
  fireEvent.press(getByTestId('button-root'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('disabled blocks press', () => {
  const onPress = jest.fn();
  const { getByTestId } = wrap(<Button text="Sign In" disabled onPress={onPress} />);
  fireEvent(getByTestId('button-root'), 'pressIn');
  fireEvent.press(getByTestId('button-root'));
  expect(onPress).not.toHaveBeenCalled();
});
