import React from 'react';
import { View, ViewStyle } from 'react-native';

type ShimmerProps = {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  className?: string;
  style?: ViewStyle;
};

// Base shimmer block - use for custom shapes
export const Shimmer: React.FC<ShimmerProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  className = '',
  style,
}) => (
  <View className={`bg-gray-200 ${className}`} style={[{ width, height, borderRadius }, style]} />
);

// Preset: Single line of text
export const ShimmerLine: React.FC<{
  width?: number | string;
  height?: number;
  className?: string;
}> = ({ width = '100%', height = 16, className = '' }) => (
  <Shimmer width={width} height={height} borderRadius={8} className={className} />
);

// Preset: Circle (avatars, icons)
export const ShimmerCircle: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 40, className = '' }) => (
  <Shimmer width={size} height={size} borderRadius={size / 2} className={className} />
);

// Preset: Box (cards, images, text areas)
export const ShimmerBox: React.FC<{
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
}> = ({ width = '100%', height = 100, borderRadius = 12, className = '' }) => (
  <Shimmer width={width} height={height} borderRadius={borderRadius} className={className} />
);

// Preset: Star rating row
export const ShimmerStars: React.FC<{
  count?: number;
  size?: number;
  className?: string;
}> = ({ count = 5, size = 28, className = '' }) => (
  <View className={`flex-row gap-x-2 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <ShimmerCircle key={i} size={size} />
    ))}
  </View>
);

// Preset: Form field (label + input)
export const ShimmerFormField: React.FC<{
  labelWidth?: string;
  inputHeight?: number;
  className?: string;
}> = ({ labelWidth = '75%', inputHeight = 48, className = '' }) => (
  <View className={className}>
    <ShimmerLine width={labelWidth} height={20} className="mb-2" />
    <ShimmerBox height={inputHeight} borderRadius={12} />
  </View>
);

// Preset: Text area field
export const ShimmerTextArea: React.FC<{
  labelWidth?: string;
  height?: number;
  className?: string;
}> = ({ labelWidth = '75%', height = 96, className = '' }) => (
  <View className={className}>
    <ShimmerLine width={labelWidth} height={20} className="mb-2" />
    <ShimmerBox height={height} borderRadius={12} />
  </View>
);

// Preset: Button
export const ShimmerButton: React.FC<{
  height?: number;
  className?: string;
}> = ({ height = 62, className = '' }) => (
  <ShimmerBox height={height} borderRadius={12} className={className} />
);

// Container with pulse animation
export const ShimmerContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <View className={`animate-pulse ${className}`}>{children}</View>
);

// Compound export for convenient access
const ShimmerNamespace = {
  Base: Shimmer,
  Line: ShimmerLine,
  Circle: ShimmerCircle,
  Box: ShimmerBox,
  Stars: ShimmerStars,
  FormField: ShimmerFormField,
  TextArea: ShimmerTextArea,
  Button: ShimmerButton,
  Container: ShimmerContainer,
};

export default ShimmerNamespace;
