/** @type {import('tailwindcss').Config} */
const palette = require('./src/theme/palette');

module.exports = {
  content: [
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/features/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: palette.primary,
        secondary: palette.secondary,
        black: palette.black,
        white: palette.white,
        gray: palette.gray,
        green: palette.green,
        red: palette.red,
      },
      fontFamily: {
        pthin: ['Poppins-Thin', 'sans-serif'],
        pextralight: ['Poppins-ExtraLight', 'sans-serif'],
        plight: ['Poppins-Light', 'sans-serif'],
        pregular: ['Poppins-Regular', 'sans-serif'],
        pmedium: ['Poppins-Medium', 'sans-serif'],
        psemibold: ['Poppins-SemiBold', 'sans-serif'],
        pbold: ['Poppins-Bold', 'sans-serif'],
        pextrabold: ['Poppins-ExtraBold', 'sans-serif'],
        pblack: ['Poppins-Black', 'sans-serif'],
        dmlight: ['DMSans-Light', 'sans-serif'],
        dmregular: ['DMSans-Regular', 'sans-serif'],
        dmmedium: ['DMSans-Medium', 'sans-serif'],
        dmserif: ['DMSerifDisplay-Regular', 'serif'],
      },
    },
  },
  plugins: [],
};
