import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';

const { width } = Dimensions.get('window');

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
  const [internalSelectedIndex, setInternalSelectedIndex] = useState<number>(0);
  const selectedIndex =
    controlledSelectedIndex !== undefined ? controlledSelectedIndex : internalSelectedIndex;
  const translateValue = useRef(new Animated.Value(0)).current;

  const segmentWidth = (width - 32) / segments.length;

  const handlePress = (segment: string, index: number) => {
    // Only update internal state if not controlled
    if (controlledSelectedIndex === undefined) {
      setInternalSelectedIndex(index);
    }
    onSegmentChange(segment);

    Animated.timing(translateValue, {
      toValue: index * segmentWidth,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    translateValue.setValue(selectedIndex * segmentWidth);
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
          key={index}
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
