import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/stores';
import { colors } from '@/src/constants';
import PageHeader from '@/src/components/PageHeader';
import FormField from '@/src/components/FormField';
import CustomButton from '@/src/components/CustomButton';
import handleAPICall from '@/src/utils/HandleApiCall';
import ErrorText from '@/src/components/ErrorText';
import CustomAlert from '@/src/components/CustomAlert';
import CustomErrorMessage from '@/src/components/CustomErrorMessage';
import Shimmer from '@/src/components/Shimmer';

export type UtsavFeedbackData = {
  accommodation_rating: number | null;
  qr_rating: number | null;
  food_rating: number | null;
  program_rating: number | null;
  volunteer_rating: number | null;
  infrastructure_rating: number | null;
  decor_rating: number | null;
  internal_transport_rating: number | null;
  raj_pravas_rating: number | null;
  sparsh_rating: number | null;
  av_rating: number | null;
  loved_most: string;
  improvement_suggestions: string;
};

export const getInitialUtsavFeedbackForm = (): UtsavFeedbackData => ({
  accommodation_rating: null,
  qr_rating: null,
  food_rating: null,
  program_rating: null,
  volunteer_rating: null,
  infrastructure_rating: null,
  decor_rating: null,
  internal_transport_rating: null,
  raj_pravas_rating: null,
  sparsh_rating: null,
  av_rating: null,
  loved_most: '',
  improvement_suggestions: '',
});

const StarRating: React.FC<{
  value: number | null;
  onChange: (n: number) => void;
  size?: number;
}> = ({ value, onChange, size = 26 }) => {
  const current = value || 0;
  return (
    <View className="mt-2 flex-row items-center gap-x-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} activeOpacity={0.8}>
          <Ionicons
            name={n <= current ? 'star' : 'star-outline'}
            size={size}
            color={colors.orange}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const FieldLabel: React.FC<{ label: string; helper?: string }> = ({ label, helper }) => (
  <View className="mt-5">
    <View className="flex-row items-baseline gap-x-1">
      <Text className="font-pmedium text-base text-gray-700">{label}</Text>
    </View>
    {helper ? <Text className="mt-1 font-pregular text-xs text-gray-500">{helper}</Text> : null}
  </View>
);

const UtsavFeedbackForm: React.FC<{
  value: UtsavFeedbackData;
  onChange: (data: UtsavFeedbackData) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  containerStyles?: string;
  showValidation?: boolean;
}> = ({
  value,
  onChange,
  onSubmit,
  isSubmitting = false,
  containerStyles = '',
  showValidation = false,
}) => {
  const fieldError = (cond: boolean) => showValidation && cond;

  return (
    <View className={`w-full ${containerStyles}`}>
      <FieldLabel label="How would you rate the accommodation?" />
      <StarRating
        value={value.accommodation_rating}
        onChange={(n) => onChange({ ...value, accommodation_rating: n })}
      />
      <ErrorText
        show={fieldError(!value.accommodation_rating)}
        message="Accommodation rating is required"
      />

      <FieldLabel label="How convenient was the QR code system?" />
      <StarRating value={value.qr_rating} onChange={(n) => onChange({ ...value, qr_rating: n })} />
      <ErrorText show={fieldError(!value.qr_rating)} message="QR rating is required" />

      <FieldLabel label="How was the food quality & variety?" />
      <StarRating
        value={value.food_rating}
        onChange={(n) => onChange({ ...value, food_rating: n })}
      />
      <ErrorText show={fieldError(!value.food_rating)} message="Food rating is required" />

      <FieldLabel label="How was the program structure & engagement?" />
      <StarRating
        value={value.program_rating}
        onChange={(n) => onChange({ ...value, program_rating: n })}
      />
      <ErrorText show={fieldError(!value.program_rating)} message="Program rating is required" />

      <FieldLabel label="How would you rate the volunteer performance?" />
      <StarRating
        value={value.volunteer_rating}
        onChange={(n) => onChange({ ...value, volunteer_rating: n })}
      />
      <ErrorText
        show={fieldError(!value.volunteer_rating)}
        message="Volunteer rating is required"
      />

      <FieldLabel label="How was the infrastructure?" />
      <StarRating
        value={value.infrastructure_rating}
        onChange={(n) => onChange({ ...value, infrastructure_rating: n })}
      />
      <ErrorText
        show={fieldError(!value.infrastructure_rating)}
        message="Infrastructure rating is required"
      />

      <FieldLabel label="How was the decor?" />
      <StarRating
        value={value.decor_rating}
        onChange={(n) => onChange({ ...value, decor_rating: n })}
      />
      <ErrorText show={fieldError(!value.decor_rating)} message="Decor rating is required" />

      <FieldLabel label="How was the internal transport coordination?" />
      <StarRating
        value={value.internal_transport_rating}
        onChange={(n) => onChange({ ...value, internal_transport_rating: n })}
      />
      <ErrorText
        show={fieldError(!value.internal_transport_rating)}
        message="Internal transport rating is required"
      />

      <FieldLabel label="How was the Raj Pravas transport (Mumbai → Venue)?" />
      <StarRating
        value={value.raj_pravas_rating}
        onChange={(n) => onChange({ ...value, raj_pravas_rating: n })}
      />
      <ErrorText
        show={fieldError(!value.raj_pravas_rating)}
        message="Raj Pravas rating is required"
      />

      <FieldLabel label="How was the Sparsh performance?" />
      <StarRating
        value={value.sparsh_rating}
        onChange={(n) => onChange({ ...value, sparsh_rating: n })}
      />
      <ErrorText show={fieldError(!value.sparsh_rating)} message="Sparsh rating is required" />

      <FieldLabel label="How was the audio-visual setup?" />
      <StarRating value={value.av_rating} onChange={(n) => onChange({ ...value, av_rating: n })} />
      <ErrorText show={fieldError(!value.av_rating)} message="AV rating is required" />

      <FormField
        text="What did you love the most about this Utsav?"
        placeholder="What did you love the most?"
        value={value.loved_most}
        handleChangeText={(t: string) => onChange({ ...value, loved_most: t })}
        otherStyles="mt-5"
        inputStyles="font-pmedium text-base"
        error={fieldError(!value.loved_most)}
        errorMessage="Required"
        useNeomorphic
      />

      <FormField
        text="Any suggestions for improvement?"
        placeholder="What can be improved?"
        value={value.improvement_suggestions}
        handleChangeText={(t: string) => onChange({ ...value, improvement_suggestions: t })}
        otherStyles="mt-5"
        inputStyles="font-pmedium text-base"
        error={fieldError(!value.improvement_suggestions)}
        errorMessage="Required"
        useNeomorphic
      />

      <CustomButton
        text="Submit Feedback"
        handlePress={onSubmit}
        containerStyles="my-7 min-h-[62px]"
        bgcolor="bg-secondary"
        textStyles="text-white"
        isLoading={isSubmitting}
        isDisabled={isSubmitting}
      />
    </View>
  );
};

const UtsavFeedbackScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState<UtsavFeedbackData>(getInitialUtsavFeedbackForm());
  const [submitting, setSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
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
      await new Promise((resolve, reject) => {
        handleAPICall(
          'GET',
          '/utsav/feedback/validate',
          { utsav_id: utsavId, cardno: user.cardno },
          null,
          () => resolve(true),
          () => {
            setIsValidating(false);
          }
          // (err) => {
          //   setValidationError(
          //     err?.message || 'You are not authorized to submit feedback for this utsav'
          //   );
          // },
          // false
        );
      });
      setValidationError(null);
    };

    validateFeedbackAccess();
  }, [utsavId, user?.cardno, router]);

  const valid = useMemo(() => {
    return (
      !!user?.cardno &&
      utsavId !== null &&
      !!form.accommodation_rating &&
      !!form.qr_rating &&
      !!form.food_rating &&
      !!form.program_rating &&
      !!form.volunteer_rating &&
      !!form.infrastructure_rating &&
      !!form.decor_rating &&
      !!form.internal_transport_rating &&
      !!form.raj_pravas_rating &&
      !!form.sparsh_rating &&
      !!form.av_rating &&
      !!form.loved_most &&
      !!form.improvement_suggestions
    );
  }, [form, utsavId, user?.cardno]);

  const submit = async () => {
    if (!valid) {
      setShowValidation(true);
      return;
    }

    setSubmitting(true);

    await new Promise((resolve, reject) => {
      handleAPICall(
        'POST',
        '/utsav/feedback',
        null,
        {
          cardno: user!.cardno,
          utsav_id: utsavId,
          accommodation_rating: form.accommodation_rating,
          qr_rating: form.qr_rating,
          food_rating: form.food_rating,
          program_rating: form.program_rating,
          volunteer_rating: form.volunteer_rating,
          infrastructure_rating: form.infrastructure_rating,
          decor_rating: form.decor_rating,
          internal_transport_rating: form.internal_transport_rating,
          raj_pravas_rating: form.raj_pravas_rating,
          sparsh_rating: form.sparsh_rating,
          av_rating: form.av_rating,
          loved_most: form.loved_most,
          improvement_suggestions: form.improvement_suggestions,
        },
        () => resolve(true),
        () => {},
        (err) => reject(err)
      );
    });

    CustomAlert.alert('Thank you!', 'Your feedback has been submitted successfully.');
    router.back();
    setSubmitting(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <PageHeader
        title="Utsav Feedback"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />

      {isValidating && (
        <Shimmer.Container className="p-6">
          <View className="mb-6">
            <Shimmer.Line width="50%" height={24} className="mb-2" />
            <Shimmer.Stars />
          </View>

          {[1, 2, 3, 4].map((n) => (
            <Shimmer.TextArea key={n} className="mb-6" />
          ))}

          <Shimmer.Button className="mt-4" />
        </Shimmer.Container>
      )}

      {validationError && (
        <CustomErrorMessage errorTitle="Access Denied" errorMessage={validationError} />
      )}

      {!isValidating && !validationError && (
        <KeyboardAwareScrollView
          bottomOffset={62}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled">
          <UtsavFeedbackForm
            value={form}
            onChange={setForm}
            onSubmit={submit}
            isSubmitting={submitting}
            showValidation={showValidation}
            containerStyles="px-4"
          />
        </KeyboardAwareScrollView>
      )}
    </SafeAreaView>
  );
};

export default UtsavFeedbackScreen;
