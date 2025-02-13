import { View, Text } from 'react-native';
import React from 'react';
import CustomButton from './CustomButton';

const CustomErrorMessage = () => {
  return (
    <View className="flex m-4 items-center justify-center">
      <Text className="text-red-500 text-lg font-pregular items-center justify-center">
        An error occurred
      </Text>
      {/* <CustomButton text={'Retry'} onPress/> */}
    </View>
  );
};

export default CustomErrorMessage;
