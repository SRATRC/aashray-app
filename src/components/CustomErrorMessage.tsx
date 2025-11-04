import React from 'react';
import { View, Text } from 'react-native';

const CustomErrorMessage = () => {
  return (
    <View className="m-4 flex items-center justify-center">
      <Text className="items-center justify-center font-pregular text-lg text-red-500">
        An error occurred
      </Text>
      {/* <CustomButton text={'Retry'} onPress/> */}
    </View>
  );
};

export default CustomErrorMessage;
