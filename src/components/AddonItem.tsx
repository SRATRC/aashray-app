import { View, TouchableOpacity, Image } from 'react-native';
import { useState } from 'react';
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

  // Focus deliberately does nothing here. The previous version bumped a `key` on
  // every focus, remounting the whole children subtree (twice on the first
  // focus) and throwing away everything the member had typed into the add-on.
  // Collapsing on refocus instead is not a substitute: the parent screens gate
  // the booking payload on the open flag, so telling them the add-on closed
  // drops the add-on and its charge from the booking — silently, on the way
  // back from the review screen. Leaving the add-on open and selected matches
  // what members saw before, without the remount.

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
    <View className={`mb-3 p-3 ${surfaces.CARD} ${backgroundColor ?? ''}`}>
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
