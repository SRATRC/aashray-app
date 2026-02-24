import { colors } from '@/src/constants';
import React from 'react';
import { StyleSheet, Text, TextInput as RNTextInput, View } from 'react-native';

type FeedbackTextInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

const MAX_LENGTH = 300;

export const FeedbackTextInput: React.FC<FeedbackTextInputProps> = ({
  value,
  onChangeText,
  placeholder,
}) => {
  return (
    <View style={styles.container}>
      <RNTextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.gray_400}
        multiline
        maxLength={MAX_LENGTH}
        textAlignVertical="top"
      />
      {value.length > 0 && (
        <Text style={styles.charCount}>
          {value.length}/{MAX_LENGTH}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  input: {
    backgroundColor: colors.white_100,
    borderRadius: 16,
    padding: 16,
    fontSize: 18,
    fontFamily: 'DMSerifDisplay-Regular',
    color: colors.black,
    minHeight: 120,
    maxHeight: 180,
  },
  charCount: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    fontSize: 12,
    fontFamily: 'DMSans-Regular',
    color: colors.gray_400,
  },
});
