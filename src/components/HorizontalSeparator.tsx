import { View } from 'react-native';
import React from 'react';

interface HorizontalSeparatorProps {
  otherStyles?: any;
}
const HorizontalSeparator: React.FC<HorizontalSeparatorProps> = ({ otherStyles }) => {
  return <View className={`flex-grow border-t border-gray-200 ${otherStyles}`}></View>;
};

export default HorizontalSeparator;
