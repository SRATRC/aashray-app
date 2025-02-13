import { View, TextInput, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { icons } from '../constants';

interface SearchInputProps {
  value: any;
  placeholder: any;
  handleChangeText: any;
  inputStyles?: any;
  autoComplete?: any;
  autoCorrect?: any;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  placeholder,
  handleChangeText,
  inputStyles,
  autoComplete,
  autoCorrect,
}) => {
  return (
    <View
      className={`h-12 w-full flex-row items-center gap-x-2 rounded-2xl border border-gray-300 px-4 focus:border-2 focus:border-secondary`}>
      <TextInput
        className={`flex-1 ${inputStyles ? inputStyles : 'font-pregular text-base'} `}
        value={value}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        onChangeText={handleChangeText}
        autoComplete={autoComplete}
        autoCorrect={autoCorrect}
      />

      <TouchableOpacity>
        <Image source={icons.search} className="h-5 w-5" resizeMode="contain" />
      </TouchableOpacity>
    </View>
  );
};

export default SearchInput;
