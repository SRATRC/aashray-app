import { View, Text, Image, TouchableWithoutFeedback } from 'react-native';
import React, { FC } from 'react';
import { ShadowBox } from './ShadowBox';

interface CustomHomeIconProps {
  image: any;
  title: string;
  onPress: () => void;
  containerStyles?: string;
}

const CustomHomeIcon: FC<CustomHomeIconProps> = ({ image, title, onPress, containerStyles }) => {
  return (
    <View className={`mr-2 ${containerStyles || ''}`}>
      <TouchableWithoutFeedback onPress={onPress}>
        <View className="w-[76px] items-center justify-center">
          <ShadowBox interactive={false} className="rounded-xl bg-white p-2">
            <Image source={image} className="h-12 w-12" />
          </ShadowBox>
          <Text
            className="mt-2 text-center font-pregular text-[10px] text-black"
            adjustsFontSizeToFit
            minimumFontScale={0.8}>
            {title}
          </Text>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default CustomHomeIcon;
