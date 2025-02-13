import { View, Text, TextInput, TouchableOpacity, Image, Platform } from 'react-native';
import React, { useState } from 'react';
import { icons } from '../constants';

interface FormFieldProps {
  text: any;
  value?: any;
  placeholder?: any;
  handleChangeText: any;
  otherStyles?: any;
  keyboardType?: any;
  maxLength?: any;
  prefix?: any;
  containerStyles?: any;
  inputStyles?: any;
  autoCapitalize?: any;
  autoComplete?: any;
  autoCorrect?: any;
  additionalText?: any;
  multiline?: boolean;
  numberOfLines?: number;
}

const FormField: React.FC<FormFieldProps> = ({
  text,
  value,
  placeholder,
  handleChangeText,
  otherStyles = '',
  keyboardType,
  maxLength,
  prefix,
  containerStyles,
  inputStyles,
  autoCapitalize,
  autoComplete,
  autoCorrect = false,
  additionalText,
  multiline = false,
  numberOfLines = 1,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className={`gap-y-2 ${otherStyles}`}>
      <Text className="font-pmedium text-base text-gray-600">{text}</Text>
      <View
        className={`w-full flex-row items-center gap-x-2 rounded-2xl px-4 focus:border-2 focus:border-secondary ${
          containerStyles
            ? containerStyles
            : Platform.OS === 'ios'
              ? 'bg-white shadow-lg shadow-gray-200'
              : 'bg-white shadow-2xl shadow-gray-400'
        } ${multiline ? 'h-auto py-3' : 'h-16'}`}>
        {prefix && <Text className="font-pmedium text-base text-gray-400">{prefix}</Text>}
        <TextInput
          className={`flex-1 ${inputStyles ? inputStyles : 'font-pregular text-base'}`}
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          onChangeText={handleChangeText}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={autoCorrect}
          secureTextEntry={text === 'Password' && !showPassword}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
        />

        {text === 'Password' && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Image
              source={!showPassword ? icons.eye : icons.eyeHide}
              className="h-6 w-6"
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>
      {additionalText && (
        <Text className="font-pmedium text-gray-500">
          Name: <Text className="font-pregular">{additionalText}</Text>
        </Text>
      )}
    </View>
  );
};

export default FormField;
