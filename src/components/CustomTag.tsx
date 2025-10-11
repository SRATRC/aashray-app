import { View, Text, Image, ImageSourcePropType } from 'react-native';
import React from 'react';

interface CustomTagProps {
  containerStyles?: any;
  text: any;
  textStyles?: any;
  icon?: any;
  iconStyles?: any;
  tintColor?: any;
}

const CustomTag: React.FC<CustomTagProps> = ({
  containerStyles = '',
  text,
  textStyles = '',
  icon,
  iconStyles = '',
  tintColor,
}) => {
  return (
    <View className={`${containerStyles} flex-row gap-x-2 self-start rounded-lg px-2 py-1`}>
      {icon && (
        <Image className={iconStyles} source={icon} resizeMode="contain" style={{ tintColor }} />
      )}
      <Text className={`${textStyles} font-pregular text-sm`}>{text}</Text>
    </View>
  );
};

export default CustomTag;
