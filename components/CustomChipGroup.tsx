import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';

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
  return (
    <View className={`mt-5 ${containerStyles}`}>
      <FlatList
        data={chips}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_item, index) => index.toString()}
        renderItem={({ item }) => (
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
        )}
      />
    </View>
  );
};

export default CustomChipGroup;
