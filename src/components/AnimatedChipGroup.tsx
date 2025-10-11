import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, ScrollView } from 'react-native';

interface ChipData {
  title: string;
  icon: React.ReactElement;
}

interface AnimatedChipGroupProps {
  chips: ChipData[];
  selectedChip: string;
  handleChipPress: (chipTitle: string) => void;
  containerStyles?: string;
  chipContainerStyles?: string;
  textStyles?: string;
}

interface ChipItemProps {
  item: ChipData;
  isSelected: boolean;
  onPress: () => void;
  chipContainerStyles?: string;
  textStyles?: string;
}

const ChipItem: React.FC<ChipItemProps> = ({
  item,
  isSelected,
  onPress,
  chipContainerStyles = '',
  textStyles = '',
}) => {
  const [textWidth, setTextWidth] = useState(0);
  const animatedWidth = useRef(new Animated.Value(48)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const totalWidth = isSelected ? Math.max(48, textWidth + 60) : 48;

    Animated.parallel([
      Animated.spring(animatedWidth, {
        toValue: totalWidth,
        tension: 150,
        friction: 8,
        useNativeDriver: false,
      }),
      Animated.timing(textOpacity, {
        toValue: isSelected ? 1 : 0,
        duration: isSelected ? 200 : 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isSelected, textWidth]);

  const icon = React.cloneElement(item.icon, {
    color: isSelected ? 'white' : '#9CA3AF',
  });

  return (
    <Animated.View
      style={{
        width: animatedWidth,
        height: 48,
        marginRight: 8,
      }}>
      <TouchableOpacity
        className={`h-full flex-row items-center justify-center rounded-[12px] ${
          isSelected ? 'bg-secondary px-4' : 'bg-gray-200'
        } ${chipContainerStyles}`}
        activeOpacity={0.7}
        onPress={onPress}>
        {/* Fixed icon container */}
        <View
          style={{
            width: 24,
            height: 24,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden', // This prevents icon overflow
          }}>
          {icon}
        </View>

        {/* Hidden text for measuring width */}
        <Text
          className={`font-pmedium text-white ${textStyles}`}
          style={{
            position: 'absolute',
            left: -1000,
            top: -1000,
          }}
          numberOfLines={1}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            if (width !== textWidth) setTextWidth(width);
          }}>
          {item.title}
        </Text>

        {/* Animated visible text */}
        {isSelected && (
          <Animated.View
            style={{
              opacity: textOpacity,
              marginLeft: 8,
              maxWidth: textWidth,
            }}>
            <Text className={`font-pmedium text-white ${textStyles}`} numberOfLines={1}>
              {item.title}
            </Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const AnimatedChipGroup: React.FC<AnimatedChipGroupProps> = ({
  chips,
  selectedChip,
  handleChipPress,
  containerStyles = '',
  chipContainerStyles = '',
  textStyles = '',
}) => {
  return (
    <View className={`mt-5 ${containerStyles}`}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16 }}>
        <View className="flex-row">
          {chips.map((chip) => (
            <ChipItem
              key={chip.title}
              item={chip}
              isSelected={selectedChip === chip.title}
              onPress={() => handleChipPress(chip.title)}
              chipContainerStyles={chipContainerStyles}
              textStyles={textStyles}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default AnimatedChipGroup;
