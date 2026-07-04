import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

test('jest-expo renders', () => {
  const { getByText } = render(<Text>ok</Text>);
  expect(getByText('ok')).toBeTruthy();
});
