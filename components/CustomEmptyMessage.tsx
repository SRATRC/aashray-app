import { View, Text, Image } from 'react-native';
import { images } from '~/constants';

interface CustomEmptyMessageProps {
  lottiePath: any;
  message: any;
}
const CustomEmptyMessage: React.FC<CustomEmptyMessageProps> = ({ lottiePath, message }) => {
  return (
    <View className="h-[80%] items-center justify-center">
      <Image source={images.sadFace} className="h-[160] w-[160]" resizeMode="contain" />
      <Text className="mt-10 w-[80%] text-center font-pmedium text-xl text-secondary">
        {message}
      </Text>
    </View>
  );
};

export default CustomEmptyMessage;
