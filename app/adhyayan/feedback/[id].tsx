import React, { useMemo, useState } from 'react';
import { Alert, View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores';
import { colors } from '@/constants';
import PageHeader from '@/components/PageHeader';
import FormField from '@/components/FormField';
import CustomButton from '@/components/CustomButton';
import handleAPICall from '@/utils/HandleApiCall';

export type AdhyayanFeedbackData = {
  swadhay_karta_rating: number | null;
  personal_interaction_rating: number | null;
  swadhay_karta_suggestions: string;
  raj_adhyayan_interest: boolean | null;
  future_topics: string;
  loved_most: string;
  improvement_suggestions: string;
  food_rating: number | null;
  stay_rating: number | null;
};

export const getInitialFeedbackForm = (): AdhyayanFeedbackData => ({
  swadhay_karta_rating: null,
  personal_interaction_rating: null,
  swadhay_karta_suggestions: '',
  raj_adhyayan_interest: null,
  future_topics: '',
  loved_most: '',
  improvement_suggestions: '',
  food_rating: null,
  stay_rating: null,
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
        <Text key={n} onPress={() => onChange(n)}>
          <Ionicons
            name={n <= current ? 'star' : 'star-outline'}
            size={size}
            color={colors.orange}
          />
        </Text>
      ))}
    </View>
  );
};

const FieldLabel: React.FC<{ label: string; required?: boolean; helper?: string }> = ({
  label,
  required,
  helper,
}) => (
  <View className="mt-5">
    <View className="flex-row items-baseline gap-x-1">
      <Text className="font-pmedium text-base text-gray-700">{label}</Text>
      {required && <Text className="font-pregular text-sm text-red-500">*</Text>}
    </View>
    {helper ? <Text className="mt-1 font-pregular text-xs text-gray-500">{helper}</Text> : null}
  </View>
);

const ErrorText: React.FC<{ show?: boolean }> = ({ show }) =>
  show ? <Text className="ml-1 mt-1 font-pregular text-sm text-red-600">Required</Text> : null;

const AdhyayanFeedbackForm: React.FC<{
  value: AdhyayanFeedbackData;
  onChange: (data: AdhyayanFeedbackData) => void;
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
      <FieldLabel label="Swadhyay Karta Rating" required />
      <StarRating
        value={value.swadhay_karta_rating}
        onChange={(n) => onChange({ ...value, swadhay_karta_rating: n })}
      />
      <ErrorText show={fieldError(!value.swadhay_karta_rating)} />

      <FieldLabel label="Personal Interaction Rating" required />
      <StarRating
        value={value.personal_interaction_rating}
        onChange={(n) => onChange({ ...value, personal_interaction_rating: n })}
      />
      <ErrorText show={fieldError(!value.personal_interaction_rating)} />

      <FormField
        text="Swadhyay Karta Suggestions"
        placeholder="Share your suggestions"
        value={value.swadhay_karta_suggestions}
        handleChangeText={(t: string) => onChange({ ...value, swadhay_karta_suggestions: t })}
        multiline
        numberOfLines={3}
        otherStyles="mt-5"
        inputStyles="font-pmedium text-base"
        containerStyles="bg-gray-100"
        error={fieldError(!value.swadhay_karta_suggestions)}
        errorMessage="Required"
      />

      <FieldLabel label="Raj Adhyayan Interest" required helper="Let us know your interest level" />
      <View className="mt-2 flex-row gap-x-3">
        <TouchableOpacity
          className={`flex-1 rounded-xl border px-4 py-3 ${
            value.raj_adhyayan_interest === false
              ? 'border-secondary bg-secondary/10'
              : 'border-gray-200 bg-white'
          }`}
          activeOpacity={0.9}
          onPress={() => onChange({ ...value, raj_adhyayan_interest: false })}>
          <View className="flex-row items-center justify-center gap-x-2">
            <Ionicons name="thumbs-down" size={18} color={colors.gray_600} />
            <Text className="font-pmedium text-gray-800">Not Interested</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 rounded-xl border px-4 py-3 ${
            value.raj_adhyayan_interest === true
              ? 'border-secondary bg-secondary/10'
              : 'border-gray-200 bg-white'
          }`}
          activeOpacity={0.9}
          onPress={() => onChange({ ...value, raj_adhyayan_interest: true })}>
          <View className="flex-row items-center justify-center gap-x-2">
            <Ionicons name="thumbs-up" size={18} color={colors.gray_600} />
            <Text className="font-pmedium text-gray-800">Interested</Text>
          </View>
        </TouchableOpacity>
      </View>
      <ErrorText show={fieldError(value.raj_adhyayan_interest === null)} />

      <FormField
        text="Future Topics"
        placeholder="What future topics interest you?"
        value={value.future_topics}
        handleChangeText={(t: string) => onChange({ ...value, future_topics: t })}
        multiline
        numberOfLines={2}
        otherStyles="mt-5"
        inputStyles="font-pmedium text-base"
        containerStyles="bg-gray-100"
        error={fieldError(!value.future_topics)}
        errorMessage="Required"
      />

      <FormField
        text="Loved Most"
        placeholder="What did you love the most?"
        value={value.loved_most}
        handleChangeText={(t: string) => onChange({ ...value, loved_most: t })}
        multiline
        numberOfLines={2}
        otherStyles="mt-5"
        inputStyles="font-pmedium text-base"
        containerStyles="bg-gray-100"
        error={fieldError(!value.loved_most)}
        errorMessage="Required"
      />

      <FormField
        text="Improvement Suggestions"
        placeholder="What can be improved?"
        value={value.improvement_suggestions}
        handleChangeText={(t: string) => onChange({ ...value, improvement_suggestions: t })}
        multiline
        numberOfLines={3}
        otherStyles="mt-5"
        inputStyles="font-pmedium text-base"
        containerStyles="bg-gray-100"
        error={fieldError(!value.improvement_suggestions)}
        errorMessage="Required"
      />

      <FieldLabel label="Food Rating" required />
      <StarRating
        value={value.food_rating}
        onChange={(n) => onChange({ ...value, food_rating: n })}
      />
      <ErrorText show={fieldError(!value.food_rating)} />

      <FieldLabel label="Stay Rating" required />
      <StarRating
        value={value.stay_rating}
        onChange={(n) => onChange({ ...value, stay_rating: n })}
      />
      <ErrorText show={fieldError(!value.stay_rating)} />

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

const FeedbackScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState<AdhyayanFeedbackData>(getInitialFeedbackForm());
  const [submitting, setSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const shibirId = useMemo(() => {
    const parsed = parseInt(Array.isArray(id) ? id[0] : (id as string), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }, [id]);

  const valid = useMemo(() => {
    return (
      !!user?.cardno &&
      shibirId !== null &&
      !!form.swadhay_karta_rating &&
      !!form.personal_interaction_rating &&
      form.raj_adhyayan_interest !== null &&
      !!form.swadhay_karta_suggestions &&
      !!form.future_topics &&
      !!form.loved_most &&
      !!form.improvement_suggestions &&
      !!form.food_rating &&
      !!form.stay_rating
    );
  }, [form, shibirId, user?.cardno]);

  const submit = async () => {
    if (!valid) {
      setShowValidation(true);
      return;
    }

    setSubmitting(true);
    try {
      await new Promise((resolve, reject) => {
        handleAPICall(
          'POST',
          '/adhyayan/feedback',
          null,
          {
            cardno: user!.cardno,
            shibir_id: shibirId,
            swadhay_karta_rating: form.swadhay_karta_rating,
            personal_interaction_rating: form.personal_interaction_rating,
            swadhay_karta_suggestions: form.swadhay_karta_suggestions,
            raj_adhyayan_interest: form.raj_adhyayan_interest,
            future_topics: form.future_topics,
            loved_most: form.loved_most,
            improvement_suggestions: form.improvement_suggestions,
            food_rating: form.food_rating,
            stay_rating: form.stay_rating,
          },
          () => resolve(true),
          () => {},
          (err) => reject(err)
        );
      });

      Alert.alert('Thank you!', 'Your feedback has been submitted successfully.');
      router.back();
    } catch (e: any) {
      // handleAPICall already shows a toast; optionally add alert
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <PageHeader title="Adhyayan Feedback" />
      <KeyboardAwareScrollView
        bottomOffset={62}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled">
        <AdhyayanFeedbackForm
          value={form}
          onChange={setForm}
          onSubmit={submit}
          isSubmitting={submitting}
          showValidation={showValidation}
          containerStyles="px-4"
        />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default FeedbackScreen;
