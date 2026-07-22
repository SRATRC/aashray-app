import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState, useEffect } from 'react';
import { View } from 'react-native';

import { submitAdhyayanFeedback, validateAdhyayanFeedback } from '../api';
import { ADHYAYAN_QUESTIONS } from '../questions/adhyayanFeedback';

import CustomAlert from '@/components/CustomAlert';
import CustomErrorMessage from '@/components/CustomErrorMessage';
import { SteppedFeedback, SteppedFeedbackShimmer } from '@/components/SteppedFeedback';
import type { AnswerValue } from '@/components/SteppedFeedback';
import { useAuthStore } from '@/stores';

const AdhyayanFeedbackScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const shibirId = useMemo(() => {
    const parsed = parseInt(Array.isArray(id) ? id[0] : (id as string), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }, [id]);

  useEffect(() => {
    if (!user?.cardno || shibirId === null) {
      setValidationError('Invalid shibir or user information');
      setIsValidating(false);
      return;
    }

    const validateFeedbackAccess = async () => {
      setIsValidating(true);
      try {
        await validateAdhyayanFeedback(String(shibirId), user.cardno);
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
  }, [shibirId, user?.cardno]);

  const handleSubmit = async (answers: Record<string | number, AnswerValue>) => {
    if (!user?.cardno || shibirId === null) return;

    const payload = Object.fromEntries(ADHYAYAN_QUESTIONS.map((q) => [q.id, answers[q.id]]));

    await submitAdhyayanFeedback(user.cardno, String(shibirId), payload);
    queryClient.invalidateQueries({ queryKey: ['adhyayanBooking', user?.cardno] });
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
      questions={ADHYAYAN_QUESTIONS}
      onSubmit={handleSubmit}
      onBack={handleDismiss}
      onClose={handleClose}
      onDismiss={handleDismiss}
      successTitle="Thank you."
      successSubtitle="See you at the next Adhyayan."
    />
  );
};

export default AdhyayanFeedbackScreen;
