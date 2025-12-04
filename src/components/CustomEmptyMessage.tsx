import { View, Text, Image } from 'react-native';
import { images, colors } from '@/src/constants';

interface CustomEmptyMessageProps {
  message: string;
  containerClassName?: string;
  imageClassName?: string;
  textClassName?: string;
  image?: any;
  showImage?: boolean;
}

const CustomEmptyMessage: React.FC<CustomEmptyMessageProps> = ({
  message,
  containerClassName = '',
  imageClassName = '',
  textClassName = '',
  image = images.sadFace,
  showImage = true,
}) => {
  return (
    <View
      className={`flex-1 items-center justify-center px-4 py-8 ${containerClassName}`}
      style={{ backgroundColor: 'transparent' }}>
      {showImage && (
        <Image
          source={image}
          className={`h-[140px] w-[140px] opacity-90 ${imageClassName}`}
          resizeMode="contain"
        />
      )}
      <Text
        className={`mt-4 text-center font-pmedium text-base ${textClassName}`}
        style={{ color: colors.gray_400 }}>
        {message}
      </Text>
    </View>
  );
};

export default CustomEmptyMessage;
