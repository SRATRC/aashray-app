import { View, Text, Image } from 'react-native';
import { images } from '~/constants';

interface CustomEmptyMessageProps {
  message: any;
  containerClassName?: string;
}

const CustomEmptyMessage: React.FC<CustomEmptyMessageProps> = ({
  message,
  containerClassName = 'py-10 items-center justify-center',
}) => {
  return (
    <View className={`items-center justify-center ${containerClassName}`}>
      <Image source={images.sadFace} className="h-[120] w-[120]" resizeMode="contain" />
      <Text className="mt-6 w-[80%] text-center font-pmedium text-lg text-secondary">
        {message}
      </Text>
    </View>
  );
};

export default CustomEmptyMessage;
