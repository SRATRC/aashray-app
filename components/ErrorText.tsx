import { Text } from 'react-native';

const ErrorText: React.FC<{ show?: boolean; message?: string }> = ({ show, message }) =>
  show ? (
    <Text className="ml-1 mt-1 font-pregular text-sm text-red-600">
      {message || 'Field is required'}
    </Text>
  ) : null;

export default ErrorText;
