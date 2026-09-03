import { FlashList } from '@shopify/flash-list';
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface CustomChipGroupProps {
  chips: string[];
  selectedChip: string;
  handleChipPress: (chip: string) => void;
  containerStyles?: string;
  chipContainerStyles?: string;
  textStyles?: string;
}

const CustomChipGroup: React.FC<CustomChipGroupProps> = ({
  chips,
  selectedChip,
  handleChipPress,
  containerStyles = '',
  chipContainerStyles = '',
  textStyles = '',
}) => {
  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <TouchableOpacity
        className={`mr-2 rounded-[12px] px-6 py-3 ${
          selectedChip === item ? 'bg-secondary' : 'bg-gray-200'
        } ${chipContainerStyles}`}
        activeOpacity={1}
        onPress={() => handleChipPress(item)}>
        <Text
          className={`font-pmedium ${
            selectedChip === item ? 'text-white' : 'text-gray-400'
          } ${textStyles}`}>
          {item}
        </Text>
      </TouchableOpacity>
    ),
    [selectedChip, handleChipPress, chipContainerStyles, textStyles]
  );

  return (
    <View className={`mt-5 ${containerStyles}`}>
      <FlashList
        data={chips}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        renderItem={renderItem}
      />
    </View>
  );
};

export default CustomChipGroup;
