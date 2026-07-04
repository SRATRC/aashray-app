import { render, fireEvent } from '@testing-library/react-native';

import { ThemeProvider } from '../../theme/ThemeProvider';
import { Field } from '../Field';

const wrap = (ui: React.ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

// Note: @testing-library/react-native's `fireEvent.press` invokes the `onPress`
// prop directly and does not synthesize the full native gesture lifecycle, so a
// real tap (which always fires `onPressIn` before `onPress`) is simulated here
// as `pressIn` followed by `press`, matching Touchable.test.tsx / Button.test.tsx.
test('shows error text and toggles secure entry', () => {
  const { getByText, getByTestId, getByLabelText } = wrap(
    <Field
      label="Password"
      value="x"
      onChangeText={() => {}}
      error="Required"
      secureToggle
      placeholder="pw"
    />
  );
  expect(getByText('Required')).toBeTruthy(); // error helper shown

  const input = getByTestId('field-input');
  expect(input.props.secureTextEntry).toBe(true); // secure by default when secureToggle

  fireEvent(getByLabelText('Show password'), 'pressIn');
  fireEvent.press(getByLabelText('Show password')); // eye toggle
  expect(getByTestId('field-input').props.secureTextEntry).toBe(false);
});

test('forwards maxLength via ...rest to the underlying input', () => {
  const { getByTestId } = wrap(
    <Field label="Phone" value="" onChangeText={() => {}} maxLength={10} />
  );
  expect(getByTestId('field-input').props.maxLength).toBe(10);
});
