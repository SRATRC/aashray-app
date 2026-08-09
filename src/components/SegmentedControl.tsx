import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';

// Define the prop types for the component
interface SegmentedControlProps {
  segments: string[];
  onSegmentChange: (segment: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
  selectedIndex?: number;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  segments,
  onSegmentChange,
  containerStyle,
  selectedIndex: controlledSelectedIndex,
}) => {
  const { width } = useWindowDimensions();
  const [internalSelectedIndex, setInternalSelectedIndex] = useState<number>(0);
  const selectedIndex =
    controlledSelectedIndex !== undefined ? controlledSelectedIndex : internalSelectedIndex;

  const segmentWidth = (width - 32) / segments.length;

  // Seeded at the correct offset so the pill is never drawn under segment 0
  // and then snapped sideways after the first commit.
  const [translateValue] = useState(() => new Animated.Value(selectedIndex * segmentWidth));

  const handlePress = (segment: string, index: number) => {
    // Only update internal state if not controlled
    if (controlledSelectedIndex === undefined) {
      setInternalSelectedIndex(index);
    }
    onSegmentChange(segment);
  };

  useEffect(() => {
    Animated.timing(translateValue, {
      toValue: selectedIndex * segmentWidth,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [segmentWidth, selectedIndex, translateValue]);

  return (
    <View className="relative flex-row rounded-3xl bg-gray-200 p-1" style={containerStyle}>
      <Animated.View
        className="absolute bottom-1 top-1 rounded-3xl bg-white"
        style={{
          width: segmentWidth - 16,
          transform: [{ translateX: translateValue }],
          marginHorizontal: 8,
          marginVertical: 1,
        }}
      />

      {segments.map((segment, index) => (
        <TouchableOpacity
          key={segment}
          className="items-center justify-center rounded-3xl py-2"
          style={{ width: segmentWidth }}
          onPress={() => handlePress(segment, index)}>
          <Text
            className={`text-center font-pregular text-sm ${
              selectedIndex === index ? 'text-black' : 'text-gray-600'
            }`}>
            {segment}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default SegmentedControl;
