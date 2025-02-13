import { View, Text } from 'react-native';
import React from 'react';
import LottieView from 'lottie-react-native';

interface CustomEmptyMessageProps {
  lottiePath: any;
  message: any;
}
const CustomEmptyMessage: React.FC<CustomEmptyMessageProps> = ({ lottiePath, message }) => {
  return (
    <View className="flex-1 items-center justify-center">
      <LottieView
        style={{
          width: 200,
          height: 350,
          alignSelf: 'center',
        }}
        autoPlay
        loop
        source={lottiePath}
      />
      <Text className="w-[80%] text-center font-pmedium text-lg text-secondary">{message}</Text>
    </View>
  );
};

export default CustomEmptyMessage;
