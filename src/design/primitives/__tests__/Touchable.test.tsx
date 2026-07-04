import { render, fireEvent } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { Text } from 'react-native';
import { Touchable } from '../Touchable';

// Note: @testing-library/react-native's `fireEvent.press` invokes the `onPress`
// prop directly and does not synthesize the full native gesture lifecycle, so a
// real tap (which always fires `onPressIn` before `onPress`) is simulated here
// as `pressIn` followed by `press`.
test('fires light haptic and onPress; respects disabled', () => {
  const onPress = jest.fn();
  const { getByText, rerender } = render(
    <Touchable onPress={onPress} accessibilityLabel="go">
      <Text>go</Text>
    </Touchable>
  );
  fireEvent(getByText('go'), 'pressIn');
  fireEvent.press(getByText('go'));
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(Haptics.impactAsync).toHaveBeenCalled();

  rerender(
    <Touchable onPress={onPress} disabled accessibilityLabel="go">
      <Text>go</Text>
    </Touchable>
  );
  fireEvent(getByText('go'), 'pressIn');
  fireEvent.press(getByText('go'));
  expect(onPress).toHaveBeenCalledTimes(1); // no extra call when disabled
});
