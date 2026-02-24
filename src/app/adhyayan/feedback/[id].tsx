import React, { useMemo, useState, useEffect } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/src/stores';
import { SteppedFeedback, SteppedFeedbackShimmer } from '@/src/components/SteppedFeedback';
import type { AnswerValue } from '@/src/components/SteppedFeedback';
import { ADHYAYAN_QUESTIONS } from '@/src/questions/adhyayanFeedback';
import handleAPICall from '@/src/utils/HandleApiCall';
import CustomAlert from '@/src/components/CustomAlert';
import CustomErrorMessage from '@/src/components/CustomErrorMessage';

const AdhyayanFeedbackScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = useAuthStore((s) => s.user);

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
      await new Promise((resolve) => {
        handleAPICall(
          'GET',
          '/adhyayan/feedback/validate',
          { shibir_id: shibirId, cardno: user.cardno },
          null,
          () => resolve(true),
          () => {
            setIsValidating(false);
          },
          (err: any) => {
            setValidationError(
              err?.message || 'You are not authorized to submit feedback for this shibir'
            );
          },
          false
        );
      });
      setValidationError(null);
    };

    validateFeedbackAccess();
  }, [shibirId, user?.cardno]);

  const handleSubmit = async (answers: Record<string | number, AnswerValue>) => {
    if (!user?.cardno || shibirId === null) return;

    await new Promise<void>((resolve, reject) => {
      handleAPICall(
        'POST',
        '/adhyayan/feedback',
        null,
        {
          cardno: user.cardno,
          shibir_id: shibirId,
          ...answers,
        },
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
