import { View, TouchableOpacity, Image, Platform } from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { icons } from '@/src/constants';
import * as Haptics from 'expo-haptics';

interface AddonItemProps {
  children: any;
  visibleContent: any;
  containerStyles: any;
  backgroundColor?: any;
  shadowShown?: any;
  onCollapse: any;
  onToggle?: (isOpen: boolean) => void;
}

const AddonItem: React.FC<AddonItemProps> = ({
  children,
  visibleContent,
  containerStyles,
  backgroundColor,
  shadowShown,
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
    <View
      key={key}
      className={`mb-5 rounded-2xl p-3 ${
        shadowShown == false
          ? ''
          : Platform.OS === 'ios'
            ? 'shadow-lg shadow-gray-200'
            : 'shadow-2xl shadow-gray-400'
      } ${backgroundColor ? backgroundColor : 'bg-white'}`}>
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
      <View className={`${containerStyles}`} style={{ display: selected ? 'flex' : 'none' }}>
        {children}
      </View>
    </View>
  );
};

export default AddonItem;
