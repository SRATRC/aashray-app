import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '@/src/stores';
import { colors } from '@/src/constants';
import { ShadowBox } from '@/src/components/ShadowBox';
import PageHeader from '@/src/components/PageHeader';
import FormField from '@/src/components/FormField';
import CustomButton from '@/src/components/CustomButton';
import handleAPICall from '@/src/utils/HandleApiCall';
import ErrorText from '@/src/components/ErrorText';
import CustomAlert from '@/src/components/CustomAlert';
import CustomErrorMessage from '@/src/components/CustomErrorMessage';
import Shimmer from '@/src/components/Shimmer';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export type UtsavFeedbackData = {
  mumukshu_name: string;
  accommodation_type: string;
  room_number: string;

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
  mumukshu_name: '',
  accommodation_type: '',
  room_number: '',

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

/* -------------------------------------------------------------------------- */
/*                             REUSABLE COMPONENTS                             */
/* -------------------------------------------------------------------------- */

const StarRating: React.FC<{
  value: number | null;
  onChange: (n: number) => void;
  size?: number;
}> = ({ value, onChange, size = 26 }) => {
  const current = value || 0;
  return (
    <View className="mt-2 flex-row gap-x-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)}>
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

const FieldLabel: React.FC<{ label: string }> = ({ label }) => (
  <Text className="mt-5 font-pmedium text-base text-gray-700">{label}</Text>
);

/* -------------------------------------------------------------------------- */
/*                              FORM COMPONENT                                 */
/* -------------------------------------------------------------------------- */

const UtsavFeedbackForm: React.FC<{
  value: UtsavFeedbackData;
  onChange: (data: UtsavFeedbackData) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  showValidation?: boolean;
}> = ({ value, onChange, onSubmit, isSubmitting, showValidation }) => {
  const err = (c: boolean) => showValidation && c;

  return (
    <View className="px-4">

      <FormField
        text="Name of Mumukshu"
        value={value.mumukshu_name}
        handleChangeText={(t) => onChange({ ...value, mumukshu_name: t })}
        error={err(!value.mumukshu_name)}
        errorMessage="Required"
        useNeomorphic
      />

      <FormField
        text="Accommodation during the event"
        placeholder="Lotus Leaf / RC Room / RC Flat"
        value={value.accommodation_type}
        handleChangeText={(t) => onChange({ ...value, accommodation_type: t })}
        error={err(!value.accommodation_type)}
        errorMessage="Required"
        useNeomorphic
      />

      <FormField
        text="Room / Flat Number"
        value={value.room_number}
        handleChangeText={(t) => onChange({ ...value, room_number: t })}
        error={err(!value.room_number)}
        errorMessage="Required"
        useNeomorphic
      />

      <FieldLabel label="Accommodation satisfaction" />
      <StarRating
        value={value.accommodation_rating}
        onChange={(n) => onChange({ ...value, accommodation_rating: n })}
      />
      <ErrorText show={err(!value.accommodation_rating)} message="Required" />

      <FieldLabel label="QR code convenience" />
      <StarRating
        value={value.qr_rating}
        onChange={(n) => onChange({ ...value, qr_rating: n })}
      />

      <FieldLabel label="Food quality & variety" />
      <StarRating
        value={value.food_rating}
        onChange={(n) => onChange({ ...value, food_rating: n })}
      />

      <FieldLabel label="Program structure & engagement" />
      <StarRating
        value={value.program_rating}
        onChange={(n) => onChange({ ...value, program_rating: n })}
      />

      <FieldLabel label="Volunteer performance" />
      <StarRating
        value={value.volunteer_rating}
        onChange={(n) => onChange({ ...value, volunteer_rating: n })}
      />

      <FieldLabel label="Infrastructure" />
      <StarRating
        value={value.infrastructure_rating}
        onChange={(n) => onChange({ ...value, infrastructure_rating: n })}
      />

      <FieldLabel label="Decor" />
      <StarRating
        value={value.decor_rating}
        onChange={(n) => onChange({ ...value, decor_rating: n })}
      />

      <FieldLabel label="Internal transport coordination" />
      <StarRating
        value={value.internal_transport_rating}
        onChange={(n) => onChange({ ...value, internal_transport_rating: n })}
      />

      <FieldLabel label="Raj Pravaas transport (Mumbai → Venue)" />
      <StarRating
        value={value.raj_pravas_rating}
        onChange={(n) => onChange({ ...value, raj_pravas_rating: n })}
      />

      <FieldLabel label="Sparsh performance" />
      <StarRating
        value={value.sparsh_rating}
        onChange={(n) => onChange({ ...value, sparsh_rating: n })}
      />

      <FieldLabel label="Audio-visual setup" />
      <StarRating
        value={value.av_rating}
        onChange={(n) => onChange({ ...value, av_rating: n })}
      />

      <FormField
        text="Things you loved the most"
        value={value.loved_most}
        handleChangeText={(t) => onChange({ ...value, loved_most: t })}
        error={err(!value.loved_most)}
        errorMessage="Required"
        useNeomorphic
      />

      <FormField
        text="Things you want us to improve"
        value={value.improvement_suggestions}
        handleChangeText={(t) =>
          onChange({ ...value, improvement_suggestions: t })
        }
        error={err(!value.improvement_suggestions)}
        errorMessage="Required"
        useNeomorphic
      />

      <CustomButton
        text="Submit Feedback"
        handlePress={onSubmit}
        isLoading={isSubmitting}
        isDisabled={isSubmitting}
        containerStyles="my-7 min-h-[62px]"
      />
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                               SCREEN WRAPPER                                */
/* -------------------------------------------------------------------------- */

const UtsavFeedbackScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState(getInitialUtsavFeedbackForm());
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
      setValidationError('Invalid utsav or user');
      setIsValidating(false);
      return;
    }

    handleAPICall(
      'GET',
      '/feedback/validate',
      { utsavid: utsavId, cardno: user.cardno },
      null,
      () => setIsValidating(false),
      () => setIsValidating(false),
      (err) =>
        setValidationError(err?.message || 'Not authorized to submit feedback'),
      false
    );
  }, [utsavId, user?.cardno]);

  const valid = useMemo(() => {
    return Object.values(form).every((v) => v !== '' && v !== null);
  }, [form]);

  const submit = async () => {
    if (!valid) {
      setShowValidation(true);
      return;
    }

    setSubmitting(true);

    handleAPICall(
      'POST',
      '/feedback',
      null,
      { ...form, utsav_id: utsavId, cardno: user!.cardno },
      () => {
        CustomAlert.alert('Thank you!', 'Your feedback has been submitted.');
        router.back();
      },
      () => setSubmitting(false),
      () => setSubmitting(false)
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <PageHeader title="Utsav Feedback" onPress={() => router.back()} />

      {isValidating && <Shimmer.Container className="p-6" />}

      {validationError && (
        <CustomErrorMessage errorTitle="Access Denied" errorMessage={validationError} />
      )}

      {!isValidating && !validationError && (
        <KeyboardAwareScrollView keyboardShouldPersistTaps="handled">
          <UtsavFeedbackForm
            value={form}
            onChange={setForm}
            onSubmit={submit}
            isSubmitting={submitting}
            showValidation={showValidation}
          />
        </KeyboardAwareScrollView>
      )}
    </SafeAreaView>
  );
};

export default UtsavFeedbackScreen;
