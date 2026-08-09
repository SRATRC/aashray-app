import { View, TouchableOpacity, Image } from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { icons, surfaces } from '@/src/constants';
import * as Haptics from 'expo-haptics';

interface AddonItemProps {
  children: any;
  visibleContent: any;
  containerStyles: any;
  backgroundColor?: any;
  onCollapse: any;
  onToggle?: (isOpen: boolean) => void;
}

const AddonItem: React.FC<AddonItemProps> = ({
  children,
  visibleContent,
  containerStyles,
  backgroundColor,
  onCollapse,
  onToggle,
}) => {
  const [selected, setSelected] = useState(false);

  const [key, setKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setKey((prevKey) => prevKey + 1);
    }, [])
  );

  const toggleSelection = () => {
    const newSelected = !selected;
    setSelected(newSelected);
    if (onCollapse) onCollapse();
    if (onToggle) onToggle(newSelected);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    // Same surface as a booking card: a hairline border, no drop shadow. The
    // shadowed variant made the add-on rows look like a different design from
    // the cards directly above them.
    <View key={key} className={`mb-3 p-3 ${surfaces.CARD} ${backgroundColor ?? ''}`}>
      <View className="flex-row justify-between overflow-hidden">
        <View className="flex-1 flex-row items-center gap-x-4">{visibleContent}</View>
        <TouchableOpacity onPress={toggleSelection} className="items-center justify-center">
          <Image
            source={selected ? icons.remove : icons.addon}
            className="h-6 w-6"
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
      {selected && <View className={`${containerStyles}`}>{children}</View>}
    </View>
  );
};

export default AddonItem;
