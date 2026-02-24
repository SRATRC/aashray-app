import React, { useMemo, useState, useEffect } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  accommodation_rating: answers.accommodation,
  qr_rating: answers.qr_system,
  food_rating: answers.food,
  program_rating: answers.program,
  volunteer_rating: answers.volunteers,
  infrastructure_rating: answers.infrastructure,
  decor_rating: answers.decor,
  internal_transport_rating: answers.transport_int,
  raj_pravas_rating: answers.transport_raj,
  sparsh_rating: answers.sparsh,
  av_rating: answers.av_setup,
  loved_most: answers.loved,
  improvement_suggestions: answers.suggestions,
});

const UtsavFeedbackScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = useAuthStore((s) => s.user);

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
      await new Promise((resolve) => {
        handleAPICall(
          'GET',
          '/utsav/feedback/validate',
          { utsav_id: utsavId, cardno: user.cardno },
          null,
          () => resolve(true),
          () => {
            setIsValidating(false);
          }
        );
      });
      setValidationError(null);
    };

    validateFeedbackAccess();
  }, [utsavId, user?.cardno]);

  const handleSubmit = async (answers: Record<string | number, AnswerValue>) => {
    if (!user?.cardno || utsavId === null) return;

    const payload = mapAnswersToPayload(answers, user.cardno, utsavId);

    await new Promise<void>((resolve, reject) => {
      handleAPICall(
        'POST',
        '/utsav/feedback',
        null,
        payload,
        () => resolve(),
        () => {},
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
