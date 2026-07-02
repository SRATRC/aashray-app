import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing } from 'react-native';
import type { Question, AnswerValue } from './types';

const SCREEN_WIDTH = Dimensions.get('window').width;

type Answers = Record<string | number, AnswerValue>;

export function useSteppedFeedback(questions: Question[]) {
  const total = questions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;

  const animateProgress = useCallback(
    (toIndex: number) => {
      Animated.timing(progressAnim, {
        toValue: ((toIndex + 1) / total) * SCREEN_WIDTH,
        duration: 280,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    },
    [progressAnim, total]
  );

  const translateX = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;

  const slideTransition = useCallback(
    (direction: 1 | -1, nextIndex: number) => {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -direction * SCREEN_WIDTH * 0.3,
          duration: 220,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex(nextIndex);
        translateX.setValue(direction * SCREEN_WIDTH * 0.3);
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 0,
            duration: 260,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 260,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [translateX, contentOpacity]
  );

  const buttonOpacity = useRef(new Animated.Value(0.26)).current;

  const animateButtonOpacity = useCallback(
    (enabled: boolean) => {
      Animated.timing(buttonOpacity, {
        toValue: enabled ? 1 : 0.26,
        duration: 200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    },
    [buttonOpacity]
  );

  const successOpacity = useRef(new Animated.Value(0)).current;

  const fadeToSuccess = useCallback(() => {
    setSubmitted(true);
    Animated.timing(successOpacity, {
      toValue: 1,
      duration: 400,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [successOpacity]);

  const pillScales = useRef([1, 2, 3, 4, 5].map(() => new Animated.Value(1))).current;

  const animatePillPress = useCallback(
    (index: number) => {
      pillScales.forEach((s, i) => {
        if (i !== index) {
          Animated.spring(s, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
        }
      });
      Animated.spring(pillScales[index], {
        toValue: 1.08,
        useNativeDriver: true,
      }).start();
    },
    [pillScales]
  );

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion?.id];
  const isAnswered = currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== '';
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;

  useEffect(() => {
    const type = currentQuestion?.type;
    if (type !== 'rating' && type !== 'boolean') return;

    let selectedIndex = -1;
    if (type === 'rating' && typeof currentAnswer === 'number') {
      selectedIndex = currentAnswer - 1;
    } else if (type === 'boolean' && typeof currentAnswer === 'boolean') {
      selectedIndex = currentAnswer ? 0 : 1;
    }

    pillScales.forEach((s, i) => {
      Animated.spring(s, {
        toValue: i === selectedIndex ? 1.08 : 1,
        useNativeDriver: true,
      }).start();
    });
  }, [currentIndex]);

  const setAnswer = useCallback(
    (value: AnswerValue) => {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    },
    [currentQuestion]
  );

  const goForward = useCallback(() => {
    if (!isAnswered) return;
    if (isLast) return; // handled by submit
    const nextIndex = currentIndex + 1;
    animateProgress(nextIndex);
    slideTransition(1, nextIndex);
  }, [isAnswered, isLast, currentIndex, animateProgress, slideTransition]);

  const skip = useCallback(() => {
    if (isLast) return; // skip on last question handled by the view (submit with current answers)
    const nextIndex = currentIndex + 1;
    animateProgress(nextIndex);
    slideTransition(1, nextIndex);
  }, [isLast, currentIndex, animateProgress, slideTransition]);

  const goBack = useCallback(() => {
    if (isFirst) return;
    const prevIndex = currentIndex - 1;
    animateProgress(prevIndex);
    slideTransition(-1, prevIndex);
  }, [isFirst, currentIndex, animateProgress, slideTransition]);

  const isOptional = currentQuestion?.optional === true;

  return {
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
  };
}
