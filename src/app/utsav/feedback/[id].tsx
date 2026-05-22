import React, { useMemo, useState, useEffect } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/stores';
import { SteppedFeedback, SteppedFeedbackShimmer } from '@/src/components/SteppedFeedback';
import type { AnswerValue } from '@/src/components/SteppedFeedback';
import { UTSAV_QUESTIONS } from '@/src/questions/utsavFeedback';
import handleAPICall from '@/src/utils/HandleApiCall';
import CustomAlert from '@/src/components/CustomAlert';
import CustomErrorMessage from '@/src/components/CustomErrorMessage';

const mapAnswersToPayload = (
  answers: Record<string | number, AnswerValue>,
  cardno: string,
  utsavId: number
) => ({
  cardno,
  utsav_id: utsavId,
  answers: UTSAV_QUESTIONS.map((question) => ({
    question_id: question.id,
    question_text: question.text,
    question_type: question.type,
    answer: answers[question.id],
  })),
});

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
      await new Promise<void>((resolve, reject) => {
        handleAPICall(
          'GET',
          '/utsav/feedback/validate',
          { utsav_id: utsavId, cardno: user.cardno },
          null,
          () => {
            setValidationError(null);
            setIsValidating(false);
            resolve();
          },
          () => {
            setValidationError(
              'You are not allowed to submit feedback.'
            );

            setIsValidating(false);

            reject(new Error('Feedback validation failed'));
          });
      });
      setValidationError(null);
    };

    validateFeedbackAccess().catch(() => { });
  }, [utsavId, user?.cardno]);

  const handleSubmit = async (answers: Record<string | number, AnswerValue>) => {
    if (utsavId === null) return;

    const payload = mapAnswersToPayload(
      answers,
      user.cardno,
      utsavId
    );

    await new Promise<void>((resolve, reject) => {
      handleAPICall(
        'POST',
        '/utsav/feedback',
        null,
        payload,
        () => {
          queryClient.invalidateQueries({ queryKey: ['utsavBooking', user?.cardno] });
          resolve();
        },
        () => { },
        (err: unknown) => reject(err)
      );
    });
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
