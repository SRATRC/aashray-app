// SINGLE SOURCE OF TRUTH for raw color values.
// Consumed by tailwind.config.js (NativeWind classNames) and
// src/constants/colors.js (JS consumers). Do not hard-code hex elsewhere.
const palette = {
  primary: '#161622',
  secondary: { DEFAULT: '#F1AC09', 50: '#FFEFDB', 100: '#FF9001', 200: '#FF8E01' },
  black: { DEFAULT: '#000000', 100: '#1E1E2D', 200: '#232533' },
  white: { DEFAULT: '#FFFFFF', 100: '#F5F5F5' },
  gray: {
    50: '#F9FAFB',
    100: '#FAFAFC',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  green: { 100: '#E7FFEA', 200: '#05B617' },
  red: { 100: '#FFF1F1', 200: '#EB5757' },
  zinc: { 100: '#f4f4f5' },
  orange: '#F1AC09',
};

module.exports = palette;
