import React from 'react';
import { InputValidation } from '@/components/demo/input/input-validation';
import { SafeAreaView } from 'react-native-safe-area-context';

const temp = () => {
  return (
    <SafeAreaView className="h-full bg-white">
      <InputValidation />
    </SafeAreaView>
  );
};

export default temp;
