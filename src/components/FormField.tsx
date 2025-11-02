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
  isPassword?: boolean;
  error?: boolean;
  errorMessage?: string;
  isLoading?: boolean;
  useNeomorphic?: boolean; // NEW PROP
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
  autoCapitalize = 'none',
  autoComplete = 'off',
  autoCorrect = false,
  additionalText,
  multiline = false,
  numberOfLines = 1,
  isPassword = false,
  error = false,
  errorMessage,
  isLoading = false,
  useNeomorphic = false, // NEW PROP - defaults to false for backward compatibility
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Dynamic container styles based on error state
  const getContainerStyles = () => {
    let baseStyles = `w-full flex-row items-center gap-x-2 rounded-2xl px-4 focus:border-2 ${
      multiline ? 'h-auto py-3' : 'h-16'
    }`;

    if (error) {
      baseStyles += ' border-2 border-red-500 bg-red-50';
    } else if (isLoading) {
      baseStyles += ' border-2 border-blue-300 bg-blue-50';
    } else {
      baseStyles += ' focus:border-secondary';
      if (containerStyles) {
        baseStyles += ` ${containerStyles}`;
      } else if (useNeomorphic) {
        // NEOMORPHIC STYLING
        baseStyles +=
          Platform.OS === 'ios'
            ? ' bg-white border border-gray-200 shadow-md shadow-gray-300'
            : ' bg-white border border-gray-200 shadow-lg shadow-gray-400';
      } else {
        // ORIGINAL STYLING
        baseStyles +=
          Platform.OS === 'ios'
            ? ' bg-white shadow-lg shadow-gray-200'
            : ' bg-white shadow-2xl shadow-gray-400';
      }
    }

    return baseStyles;
  };

  return (
    <View className={`gap-y-2 ${otherStyles}`}>
      <Text className="font-pmedium text-base text-gray-600">{text}</Text>
      <View className={getContainerStyles()}>
        {prefix && <Text className="font-pmedium text-base text-gray-400">{prefix}</Text>}
        <TextInput
          className={`flex-1 ${inputStyles ? inputStyles : 'font-pregular text-base'} ${
            error ? 'text-red-700' : ''
          }`}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={error ? '#EF4444' : '#9CA3AF'}
          onChangeText={handleChangeText}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={autoCorrect}
          importantForAutofill="no"
          secureTextEntry={isPassword && !showPassword}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
        />

        {isLoading && <Text className="font-pmedium text-xs text-blue-600">Verifying...</Text>}

        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Image
              source={!showPassword ? icons.eye : icons.eyeHide}
              className="h-6 w-6"
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Error message */}
      {error && errorMessage && (
        <Text className="ml-2 font-pmedium text-sm text-red-600">{errorMessage}</Text>
      )}

      {/* Additional text (success state) */}
      {additionalText && !error && (
        <Text className="font-pmedium text-gray-500">
          Name: <Text className="font-pregular text-green-600">{additionalText}</Text>
        </Text>
      )}
    </View>
  );
};

export default FormField;
