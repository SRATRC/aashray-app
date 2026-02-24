import React, { useEffect } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSteppedFeedback } from './useSteppedFeedback';
import { ProgressBar } from './ProgressBar';
import { RatingInput } from './RatingInput';
import { BooleanInput } from './BooleanInput';
import { FeedbackTextInput } from './TextInput';
import { SuccessScreen } from './SuccessScreen';
import type { SteppedFeedbackProps } from './types';
import { colors } from '@/src/constants';

const DEFAULTS = {
  accentColor: colors.orange,
  accentForeground: colors.white,
  backgroundColor: colors.white,
  ratingLabels: ['Poor', 'Excellent'] as [string, string],
  successTitle: 'Thank you.',
  successSubtitle: 'See you next time.',
};

export const SteppedFeedback: React.FC<SteppedFeedbackProps> = ({
  questions,
  onSubmit,
  onBack,
  onClose,
  onDismiss,
  accentColor = DEFAULTS.accentColor,
  accentForeground = DEFAULTS.accentForeground,
  backgroundColor = DEFAULTS.backgroundColor,
  ratingLabels = DEFAULTS.ratingLabels,
  successTitle = DEFAULTS.successTitle,
  successSubtitle = DEFAULTS.successSubtitle,
}) => {
  const insets = useSafeAreaInsets();

  const {
    currentIndex,
    currentQuestion,
    currentAnswer,
    answers,
    isAnswered,
    isFirst,
    isLast,
    submitted,
    total,
    setAnswer,
    goForward,
    goBack,
    skip,
    fadeToSuccess,
    isOptional,
    progressAnim,
    translateX,
    contentOpacity,
    buttonOpacity,
    animateButtonOpacity,
    successOpacity,
    pillScales,
    animatePillPress,
  } = useSteppedFeedback(questions);

  // Sync button opacity with answered state
  useEffect(() => {
    animateButtonOpacity(isAnswered);
  }, [isAnswered, animateButtonOpacity]);

  const handleContinue = () => {
    if (!isAnswered) return;
    if (isLast) {
      onSubmit(answers);
      fadeToSuccess();
    } else {
      goForward();
    }
  };

  const handleSkip = () => {
    if (isLast) {
      onSubmit(answers);
      fadeToSuccess();
    } else {
      skip();
    }
  };

  const handleBack = () => {
    if (isFirst) {
      onBack?.();
    } else {
      goBack();
    }
  };

  return (
    <View style={[styles.root, { backgroundColor }]}>
      <ProgressBar progressAnim={progressAnim} accentColor={accentColor} topOffset={insets.top} />

      {/* Back chevron */}
      {(onBack || !isFirst) && (
        <Pressable
          onPress={handleBack}
          style={[styles.backButton, { top: insets.top + 12 }]}
          hitSlop={16}>
          <Text style={styles.backChevron}>{'<'}</Text>
        </Pressable>
      )}

      {/* Close button */}
      {onClose && (
        <Pressable
          onPress={onClose}
          style={[styles.closeButton, { top: insets.top + 12 }]}
          hitSlop={16}>
          <Text style={styles.closeIcon}>{'✕'}</Text>
        </Pressable>
      )}

      <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={0}>
        {/* Reading zone */}
        <Animated.View
          style={[
            styles.readingZone,
            {
              transform: [{ translateX }],
              opacity: contentOpacity,
              paddingTop: insets.top + 48,
            },
          ]}>
          <Text style={styles.questionCounter}>
            {currentIndex + 1} / {total}
          </Text>
          <Text style={styles.questionText}>{currentQuestion.text}</Text>
        </Animated.View>

        {/* Thumb zone */}
        <Animated.View
          style={[
            styles.thumbZone,
            {
              paddingBottom: insets.bottom + 24,
              transform: [{ translateX }],
              opacity: contentOpacity,
            },
          ]}>
          {currentQuestion.type === 'rating' ? (
            <RatingInput
              value={typeof currentAnswer === 'number' ? currentAnswer : undefined}
              onSelect={(v) => setAnswer(v)}
              accentColor={accentColor}
              accentForeground={accentForeground}
              ratingLabels={ratingLabels}
              pillScales={pillScales}
              onPillPress={animatePillPress}
            />
          ) : currentQuestion.type === 'boolean' ? (
            <BooleanInput
              value={typeof currentAnswer === 'boolean' ? currentAnswer : undefined}
              onSelect={(v) => setAnswer(v)}
              accentColor={accentColor}
              accentForeground={accentForeground}
              labels={currentQuestion.booleanLabels ?? ['Yes', 'No']}
              pillScales={pillScales}
              onPillPress={animatePillPress}
            />
          ) : (
            <FeedbackTextInput
              value={typeof currentAnswer === 'string' ? currentAnswer : ''}
              onChangeText={(text) => setAnswer(text)}
              placeholder={currentQuestion.placeholder}
            />
          )}

          {/* Continue / Submit button */}
          <Animated.View style={[styles.buttonWrapper, { opacity: buttonOpacity }]}>
            <Pressable
              onPress={handleContinue}
              disabled={!isAnswered}
              style={[styles.button, { backgroundColor: accentColor }]}>
              <Text style={[styles.buttonLabel, { color: accentForeground }]}>
                {isLast ? 'Submit' : 'Continue'}
              </Text>
            </Pressable>
          </Animated.View>

          {/* Skip button */}
          {isOptional && !isAnswered && (
            <Pressable onPress={handleSkip} style={styles.skipButton} hitSlop={8}>
              <Text style={styles.skipLabel}>Skip</Text>
            </Pressable>
          )}
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Success overlay */}
      {submitted && (
        <SuccessScreen
          opacity={successOpacity}
          title={successTitle}
          subtitle={successSubtitle}
          backgroundColor={backgroundColor}
          onDismiss={onDismiss}
        />
      )}
    </View>
  );
};

export type { Question, AnswerValue, SteppedFeedbackProps } from './types';
export { SteppedFeedbackShimmer } from './SteppedFeedbackShimmer';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  readingZone: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  questionCounter: {
    fontSize: 13,
    fontFamily: 'DMSans-Regular',
    color: colors.gray_400,
    marginBottom: 14,
  },
  questionText: {
    fontSize: 28,
    fontFamily: 'DMSerifDisplay-Regular',
    color: colors.black,
    lineHeight: 38,
  },
  thumbZone: {
    flexShrink: 0,
    paddingHorizontal: 28,
    paddingTop: 8,
  },
  buttonWrapper: {
    marginTop: 20,
  },
  button: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 15,
    fontFamily: 'DMSans-Medium',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    fontSize: 22,
    color: colors.gray_400,
    fontFamily: 'DMSans-Medium',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    zIndex: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: colors.gray_400,
  },
  skipButton: {
    alignSelf: 'center',
    marginTop: 14,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  skipLabel: {
    fontSize: 14,
    fontFamily: 'DMSans-Regular',
    color: colors.gray_400,
  },
});
