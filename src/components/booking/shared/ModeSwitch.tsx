import React from 'react';
import { View, Text, Pressable } from 'react-native';

import { colors } from '@/src/constants';

/**
 * A choice between mutually exclusive modes of one booking type, e.g. a stay by
 * dates against a single day visit.
 *
 * Same control as the audience switch in PartySection, so the two reads as one
 * language. Segments are 40pt tall, which keeps them comfortably tappable.
 */

interface ModeSwitchProps {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}

const ModeSwitch: React.FC<ModeSwitchProps> = ({ options, value, onChange, className = '' }) => {
  if (options.length < 2) return null;

  return (
    <View className={`flex-row rounded-full bg-gray-200 p-1 ${className}`}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            // Tapping the segment already selected is not a change. Firing it
            // anyway made callers redo their reset work, which remounted the
            // calendar and threw away its data.
            onPress={() => {
              if (!active) onChange(o.key);
            }}
            className={`min-h-[40px] flex-1 items-center justify-center rounded-full ${
              active ? 'bg-white' : ''
            }`}
            style={
              active
                ? {
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowRadius: 3,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 2,
                  }
                : undefined
            }>
            <Text
              className="font-pmedium text-sm"
              style={{ color: active ? colors.gray_900 : colors.gray_500 }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default ModeSwitch;
