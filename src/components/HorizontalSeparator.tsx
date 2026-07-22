import React from 'react';
import { View } from 'react-native';

interface HorizontalSeparatorProps {
  otherStyles?: any;
}
const HorizontalSeparator: React.FC<HorizontalSeparatorProps> = ({ otherStyles }) => {
  return <View className={`flex-grow border-t border-gray-200 ${otherStyles}`} />;
};

export default HorizontalSeparator;
