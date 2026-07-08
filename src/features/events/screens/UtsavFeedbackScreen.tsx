import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState, useEffect } from 'react';
import { View } from 'react-native';

import { submitUtsavFeedback, validateUtsavFeedback } from '../api';
import { UTSAV_QUESTIONS } from '../questions/utsavFeedback';
import type { UtsavFeedbackAnswer } from '../types';

import CustomAlert from '@/components/CustomAlert';
import CustomErrorMessage from '@/components/CustomErrorMessage';
import { SteppedFeedback, SteppedFeedbackShimmer } from '@/components/SteppedFeedback';
import type { AnswerValue } from '@/components/SteppedFeedback';
import { useAuthStore } from '@/stores';

const mapAnswersToPayload = (
  answers: Record<string | number, AnswerValue>
): UtsavFeedbackAnswer[] =>
  UTSAV_QUESTIONS.map((question) => ({
    question_id: String(question.id),
    question_text: question.text,
    question_type: question.type,
    answer: answers[question.id],
  }));

const UtsavFeedbackScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const utsavId = useMemo(() => {
    const parsed = parseInt(Array.isArray(id) ? id[0] : (id as string), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }, [id]);

  useEffect(() => {
    if (!user?.cardno || utsavId === null) {
      setValidationError('Invalid utsav or user information');
      setIsValidating(false);
      return;
    }

    const validateFeedbackAccess = async () => {
      setIsValidating(true);
      try {
        await validateUtsavFeedback(String(utsavId), user.cardno);
        setValidationError(null);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'You are not allowed to submit feedback.';
        setValidationError(message ?? 'You are not allowed to submit feedback.');
      } finally {
        setIsValidating(false);
      }
    };

    validateFeedbackAccess();
  }, [utsavId, user?.cardno]);

  const handleSubmit = async (answers: Record<string | number, AnswerValue>) => {
    if (utsavId === null) return;

    const payload = mapAnswersToPayload(answers);

    await submitUtsavFeedback(user.cardno, String(utsavId), payload);
    queryClient.invalidateQueries({ queryKey: ['utsavBooking', user?.cardno] });
  };

  const handleDismiss = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleClose = () => {
    CustomAlert.alert(
      'Exit Feedback?',
      'Your responses have not been saved. Are you sure you want to exit?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: handleDismiss },
      ]
    );
  };

  if (isValidating) {
    return <SteppedFeedbackShimmer />;
  }

  if (validationError) {
    return (
      <View className="flex-1 bg-white">
        <CustomErrorMessage errorTitle="Access Denied" errorMessage={validationError} />
      </View>
    );
  }

  return (
    <SteppedFeedback
      questions={UTSAV_QUESTIONS}
      onSubmit={handleSubmit}
      onBack={handleDismiss}
      onClose={handleClose}
      onDismiss={handleDismiss}
      successTitle="Thank you."
      successSubtitle="See you at the next Utsav."
    />
  );
};

export default UtsavFeedbackScreen;
