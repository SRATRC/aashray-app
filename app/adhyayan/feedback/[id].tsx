import React, { useMemo, useState, useEffect } from 'react';
import { Alert, View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
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

      <FieldLabel
        label="Raj Adhyayan Interest"
        required
        helper="Let us know if you are interested in participating in future Raj Adhyayans"
      />
      <View className="mt-3 flex-row gap-x-4">
        <TouchableOpacity
          className={`flex-1 rounded-2xl px-6 py-5 ${
            value.raj_adhyayan_interest === true
              ? 'bg-green-500'
              : 'border border-gray-200 bg-white'
          } ${Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'}`}
          activeOpacity={0.8}
          onPress={() => onChange({ ...value, raj_adhyayan_interest: true })}>
          <View className="items-center">
            <Ionicons
              name="heart"
              size={28}
              color={value.raj_adhyayan_interest === true ? '#FFFFFF' : '#6B7280'}
            />
            <Text
              className={`mt-2 font-pbold text-base ${
                value.raj_adhyayan_interest === true ? 'text-white' : 'text-gray-700'
              }`}>
              I'm In!
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 rounded-2xl px-6 py-5 ${
            value.raj_adhyayan_interest === false ? 'bg-red-500' : 'border border-gray-200 bg-white'
          } ${Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'}`}
          activeOpacity={0.8}
          onPress={() => onChange({ ...value, raj_adhyayan_interest: false })}>
          <View className="items-center">
            <Ionicons
              name="close-outline"
              size={28}
              color={value.raj_adhyayan_interest === false ? '#FFFFFF' : '#6B7280'}
            />
            <Text
              className={`mt-2 font-pbold text-base ${
                value.raj_adhyayan_interest === false ? 'text-white' : 'text-gray-700'
              }`}>
              Not Now
            </Text>
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
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const shibirId = useMemo(() => {
    const parsed = parseInt(Array.isArray(id) ? id[0] : (id as string), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }, [id]);

  // Validate feedback access on mount
  useEffect(() => {
    if (!user?.cardno || shibirId === null) {
      setValidationError('Invalid shibir or user information');
      setIsValidating(false);
      return;
    }

    const validateFeedbackAccess = async () => {
      setIsValidating(true);
      await new Promise((resolve, reject) => {
        handleAPICall(
          'GET',
          '/adhyayan/feedback/validate',
          { shibir_id: shibirId, cardno: user.cardno },
          null,
          () => resolve(true),
          () => {
            setIsValidating(false);
          },
          (err) => {
            setValidationError(
              err?.message || 'You are not authorized to submit feedback for this shibir'
            );
          }
        );
      });
      setValidationError(null);
    };

    validateFeedbackAccess();
  }, [shibirId, user?.cardno, router]);

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

  if (isValidating) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <PageHeader
          title="Adhyayan Feedback"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
        />
        {/* Shimmer Loading UI */}
        <View className="animate-pulse p-6">
          {/* Ratings Shimmer */}
          <View className="mb-6">
            <View className="mb-2 h-6 w-1/2 rounded-lg bg-gray-200" />
            <View className="flex-row gap-x-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <View key={n} className="h-7 w-7 rounded-full bg-gray-200" />
              ))}
            </View>
          </View>

          {/* Text Inputs Shimmer */}
          {[1, 2, 3, 4].map((n) => (
            <View key={n} className="mb-6">
              <View className="mb-2 h-6 w-3/4 rounded-lg bg-gray-200" />
              <View className="h-24 rounded-xl bg-gray-200" />
            </View>
          ))}

          {/* Submit Button Shimmer */}
          <View className="mt-4 h-[62px] w-full rounded-xl bg-gray-200" />
        </View>
      </SafeAreaView>
    );
  }

  if (validationError) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <PageHeader
          title="Adhyayan Feedback"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
        />
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="warning-outline" size={48} color="#DC2626" />
          <Text className="mb-2 mt-4 text-center font-psemibold text-xl text-gray-900">
            Access Denied
          </Text>
          <Text className="mb-6 text-center text-base text-gray-600">{validationError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <PageHeader
        title="Adhyayan Feedback"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
      />
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
