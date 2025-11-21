import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { useState } from 'react';
import { icons } from '../constants';
import * as Haptics from 'expo-haptics';

interface ExpandableItemProps {
  children: any;
  visibleContent: any;
  containerStyles?: any;
  backgroundColor?: any;
  shadowShown?: any;
  onToggle?: any;
  rootClassName?: string;
}

const ExpandableItem: React.FC<ExpandableItemProps> = ({
  children,
  visibleContent,
  containerStyles,
  backgroundColor,
  shadowShown,
  onToggle,
  rootClassName = 'mb-5',
}) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    const newExpandedState = !expanded;
    setExpanded(newExpandedState);
    if (onToggle) {
      onToggle(newExpandedState);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View
      className={`${rootClassName} rounded-2xl p-3 ${
        shadowShown == false
          ? ''
          : Platform.OS === 'ios'
            ? 'shadow-lg shadow-gray-200'
            : 'shadow-2xl shadow-gray-400'
      } ${backgroundColor ? backgroundColor : 'bg-white'}`}>
      <TouchableOpacity onPress={toggleExpand} className="flex-row justify-between overflow-hidden">
        <View className="flex-1 flex-row items-center gap-x-4">{visibleContent}</View>
        <View className="h-8 w-8 items-center justify-center rounded-md bg-gray-100">
          <Image
            source={expanded ? icons.collapseArrow : icons.expandArrow}
            className="h-4 w-4"
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>
      <View className={`${containerStyles}`} style={{ display: expanded ? 'flex' : 'none' }}>
        {children}
      </View>
    </View>
  );
};

export default ExpandableItem;
