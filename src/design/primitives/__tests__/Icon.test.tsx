import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { Icon } from '../Icon';

test('renders a named icon', () => {
  const { getByTestId } = render(
    <ThemeProvider>
      <Icon name="chevron-left" />
    </ThemeProvider>
  );
  expect(getByTestId('icon-chevron-left')).toBeTruthy();
});
