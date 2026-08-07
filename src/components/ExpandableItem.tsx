import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useState } from 'react';
import { icons, surfaces } from '../constants';
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
  rootClassName = 'mb-3',
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
    <View className={`${rootClassName} p-3 ${surfaces.CARD} ${backgroundColor ?? ''}`}>
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
      {expanded && <View className={`${containerStyles}`}>{children}</View>}
    </View>
  );
};

export default ExpandableItem;
