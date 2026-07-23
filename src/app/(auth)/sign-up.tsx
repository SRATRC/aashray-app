import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Keyboard, Pressable, Text, View, Platform, TouchableOpacity } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import CustomButton from '@/src/components/CustomButton';
import CustomSelectBottomSheet from '@/src/components/CustomSelectBottomSheet';
import FormField from '@/src/components/FormField';
import { images } from '@/src/constants';
import { useNotification } from '@/src/context/NotificationContext';
import { useAuthStore } from '@/src/stores';
import handleAPICall from '@/src/utils/HandleApiCall';

// ── Constants ─────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { key: 'M', value: 'Male' },
  { key: 'F', value: 'Female' },
];

const GUEST_TYPE_OPTIONS = [
  { key: 'family', value: 'Family' },
  { key: 'friend', value: 'Friend' },
  { key: 'driver', value: 'Driver' },
  { key: 'vip', value: 'VIP' },
];

// ── Main Screen ───────────────────────────────────────────────────────────────

const fetchCentres = () => {
  return new Promise<any[]>((resolve, reject) => {
    handleAPICall(
      'GET',
      '/location/centres',
      null,
      null,
      (res: any) => resolve(Array.isArray(res.data) ? res.data : []),
      () => reject(new Error('Failed to fetch centres'))
    );
  });
};

const SignUp = () => {
  const setUser = useAuthStore((state: any) => state.setUser);
  const { expoPushToken } = useNotification();

  const [form, setForm] = useState({
    issuedto: '',
    mobno: '',
    gender: 'M',
    res_status: 'MUMUKSHU',
    department: '',
    ref_mobno: '',
    guest_type: 'family',
    password: '',
    confirmPassword: '',
    dob: '',
    center: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPhoneChecking, setIsPhoneChecking] = useState(false);
  const [isRefPhoneChecking, setIsRefPhoneChecking] = useState(false);
  const [refName, setRefName] = useState('');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  // Fetch Centres
  const { data: centres, isLoading: isCentresLoading }: any = useQuery({
    queryKey: ['centres'],
    queryFn: fetchCentres,
    staleTime: 1000 * 60 * 30,
  });

  const centresWithOptions = centres ? [...centres, { key: 'Other', value: 'Other' }] : [];

  // Fetch departments for Seva Kutir picker
  const { data: departmentData } = useQuery({
    queryKey: ['departments'],
    queryFn: () =>
      new Promise<{ key: string; value: string }[]>((resolve, reject) => {
        handleAPICall(
          'GET',
          '/location/departments',
          null,
          null,
          (res: any) => resolve(Array.isArray(res.data) ? res.data : []),
          () => reject(new Error('Failed to fetch departments'))
        );
      }),
    staleTime: Infinity,
  });

  const checkMobileRegistered = async (phone: string) => {
    setIsPhoneChecking(true);
    await handleAPICall(
      'GET',
      `/client/checkMobile/${phone}`,
      null,
      null,
      (res: any) => {
        if (res.exists) {
          setErrors((prev) => ({ ...prev, mobno: 'This phone number is already registered' }));
        } else {
          setErrors((prev) => ({ ...prev, mobno: '' }));
        }
      },
      () => setIsPhoneChecking(false),
      () => {},
      false // disable global error toast
    );
  };

  const checkRefMobileRegistered = async (phone: string) => {
    setIsRefPhoneChecking(true);
    setRefName('');
    await handleAPICall(
      'GET',
      `/client/checkMobile/${phone}`,
      null,
      null,
      (res: any) => {
        if (!res.exists) {
          setErrors((prev) => ({ ...prev, ref_mobno: 'Reference phone number is not registered' }));
        } else {
          if (res.res_status === 'MUMUKSHU') {
            setErrors((prev) => ({ ...prev, ref_mobno: '' }));
            setRefName(res.name);
          } else {
            setErrors((prev) => ({ ...prev, ref_mobno: `Registered to ${res.name} (${res.res_status}), but must be a Mumukshu` }));
          }
        }
      },
      () => setIsRefPhoneChecking(false),
      () => {},
      false // disable global error toast
    );
  };

  const validateNameField = (value: string) => {
    const nameTrimmed = value.trim();
    if (!nameTrimmed) {
      setErrors((prev) => ({ ...prev, issuedto: 'Full name is required' }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else if (!/^[A-Za-z\s]+$/.test(nameTrimmed)) {
      setErrors((prev) => ({ ...prev, issuedto: 'Name must only contain letters and spaces' }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      const parts = nameTrimmed.split(/\s+/);
      if (parts.length < 2) {
        setErrors((prev) => ({ ...prev, issuedto: 'Please enter both your first and last name' }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        setErrors((prev) => ({ ...prev, issuedto: '' }));
      }
    }
  };

  const validatePasswordField = (value: string) => {
    if (!value) {
      setErrors((prev) => ({ ...prev, password: 'Password is required' }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else if (value.length < 6) {
      setErrors((prev) => ({ ...prev, password: 'Password must be at least 6 characters' }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      setErrors((prev) => ({ ...prev, password: '' }));
    }
  };

  const validateConfirmPasswordField = (value: string, passwordValue: string) => {
    if (value !== passwordValue) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: '' }));
    }
  };

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameTrimmed = form.issuedto.trim();
    if (!nameTrimmed) {
      newErrors.issuedto = 'Full name is required';
    } else if (!/^[A-Za-z\s]+$/.test(nameTrimmed)) {
      newErrors.issuedto = 'Name must only contain letters and spaces';
    } else {
      const parts = nameTrimmed.split(/\s+/);
      if (parts.length < 2) {
        newErrors.issuedto = 'Please enter both your first and last name';
      }
    }

    if (form.mobno.length !== 10) {
      newErrors.mobno = 'Enter a valid 10-digit phone number';
    } else if (errors.mobno) {
      newErrors.mobno = errors.mobno;
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!form.dob) {
      newErrors.dob = 'Date of birth is required';
    }

    if (!form.center) {
      newErrors.center = 'Centre is required';
    }

    if (form.res_status === 'SEVA KUTIR' && !form.department)
      newErrors.department = 'Please select a department';

    if (form.res_status === 'GUEST') {
      if (form.ref_mobno.length !== 10) {
        newErrors.ref_mobno = 'Enter a valid 10-digit Mumukshu phone number';
      } else if (errors.ref_mobno) {
        newErrors.ref_mobno = errors.ref_mobno;
      }
    }

    setErrors(newErrors);
    const hasErrors = Object.keys(newErrors).length > 0;
    if (hasErrors) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    return !hasErrors;
  };

  const submit = async () => {
    if (isPhoneChecking || isRefPhoneChecking) return;
    if (!validate()) return;
    setIsSubmitting(true);

    const body: Record<string, any> = {
      issuedto: form.issuedto.trim(),
      mobno: form.mobno,
      gender: form.gender,
      res_status: form.res_status,
      password: form.password,
      token: expoPushToken,
      dob: form.dob,
      center: form.center,
    };

    if (form.res_status === 'SEVA KUTIR') body.department = form.department;
    if (form.res_status === 'GUEST') {
      body.ref_mobno = form.ref_mobno;
      body.guest_type = form.guest_type;
    }

    await handleAPICall(
      'POST',
      '/client/register',
      null,
      body,
      async (data: any) => setUser(data.data),
      () => setIsSubmitting(false)
    );
  };

  const isReady =
    form.issuedto.trim().length > 0 &&
    form.mobno.length === 10 &&
    form.password.length > 0 &&
    form.password === form.confirmPassword &&
    (form.res_status !== 'SEVA KUTIR' || !!form.department) &&
    (form.res_status !== 'GUEST' || form.ref_mobno.length === 10);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAwareScrollView
        bottomOffset={62}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          {/* Header */}
          <Image source={images.vvTra} className="h-[80px] w-[80px]" resizeMode="contain" />
          <Text className="mb-2 font-dmserif text-[36px] leading-[44px] text-black">
            Create Account
          </Text>
          <Text className="mb-8 mt-1 font-pregular text-base text-gray-400">
            Join us and begin your journey inwards
          </Text>

          {/* Full Name */}
          <FormField
            text="Full Name"
            value={form.issuedto}
            handleChangeText={(v: string) => {
              setField('issuedto', v);
              if (errors.issuedto) {
                validateNameField(v);
              }
            }}
            onBlur={() => validateNameField(form.issuedto)}
            placeholder="Enter your full name"
            autoCapitalize="words"
            otherStyles="mb-3"
            variant="clean"
            error={!!errors.issuedto}
            errorMessage={errors.issuedto}
          />

          {/* Phone Number */}
          <FormField
            text="Phone Number"
            value={form.mobno}
            handleChangeText={(v: string) => {
              const cleaned = v.replace(/[^0-9]/g, '');
              setField('mobno', cleaned);
              if (cleaned.length === 10) {
                checkMobileRegistered(cleaned);
              } else if (cleaned.length < 10 && errors.mobno) {
                setErrors((prev) => ({ ...prev, mobno: '' }));
              }
            }}
            placeholder="10-digit phone number"
            keyboardType="number-pad"
            maxLength={10}
            otherStyles="mb-3"
            variant="clean"
            isLoading={isPhoneChecking}
            error={!!errors.mobno}
            errorMessage={errors.mobno}
          />

          {/* Gender */}
          <View className="mb-3">
            <CustomSelectBottomSheet
              label="Gender"
              options={GENDER_OPTIONS}
              selectedValue={form.gender}
              onValueChange={(v: any) => {
                Keyboard.dismiss();
                setField('gender', String(v));
              }}
              placeholder="Select Gender"
              saveKeyInsteadOfValue
            />
          </View>

          {/* Date of Birth */}
          <View className="mb-3 gap-y-2">
            <Text className="font-pregular text-sm text-gray-400">Date of Birth</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                Keyboard.dismiss();
                setDatePickerVisibility(true);
                if (errors.dob) setErrors((prev) => ({ ...prev, dob: '' }));
              }}
              className="h-16 w-full flex-row items-center rounded-2xl bg-gray-100 px-4">
              <Text className={`font-pmedium text-base ${!form.dob ? 'text-gray-400' : 'text-black'}`}>
                {form.dob ? moment(form.dob).format('Do MMMM YYYY') : 'Select Date of Birth'}
              </Text>
            </TouchableOpacity>
            {errors.dob ? (
              <Text className="ml-2 mt-1 font-pmedium text-sm text-red-600">
                {errors.dob}
              </Text>
            ) : null}
          </View>

          {isDatePickerVisible && (
            <RNDateTimePicker
              themeVariant="light"
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              value={form.dob ? moment(form.dob, 'YYYY-MM-DD').toDate() : new Date()}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
              onChange={(event, date) => {
                if (Platform.OS === 'android') setDatePickerVisibility(false);
                if (date) {
                  setForm((prev) => ({ ...prev, dob: moment(date).format('YYYY-MM-DD') }));
                  if (errors.dob) setErrors((prev) => ({ ...prev, dob: '' }));
                }
              }}
            />
          )}

          {/* Centre */}
          <View className="mb-3">
            <CustomSelectBottomSheet
              label="Centre"
              placeholder="Select Centre"
              options={centresWithOptions}
              selectedValue={form.center}
              onValueChange={(v: any) => {
                Keyboard.dismiss();
                setField('center', String(v));
              }}
              searchable
              searchPlaceholder="Search Centres..."
              noResultsText="No Centres Found"
              isLoading={isCentresLoading}
              onRetry={fetchCentres}
              saveKeyInsteadOfValue={false}
            />
            {errors.center ? (
              <Text className="ml-2 mt-1 font-pmedium text-sm text-red-600">
                {errors.center}
              </Text>
            ) : null}
          </View>


          {/* SEVA KUTIR — Department */}
          {form.res_status === 'SEVA KUTIR' && (
            <View className="mb-3">
              <CustomSelectBottomSheet
                label="Department"
                options={departmentData ?? []}
                selectedValue={form.department}
                onValueChange={(v: any) => {
                  Keyboard.dismiss();
                  setField('department', String(v));
                }}
                placeholder="Select your department"
                saveKeyInsteadOfValue
                searchable
              />
              {errors.department ? (
                <Text className="ml-2 mt-1 font-pmedium text-sm text-red-600">
                  {errors.department}
                </Text>
              ) : null}
            </View>
          )}

          {/* GUEST — Ref Mumukshu Phone + Type */}
          {form.res_status === 'GUEST' && (
            <View className="mb-3">
              <FormField
                text="Reference Mumukshu Phone"
                value={form.ref_mobno}
                handleChangeText={(v: string) => {
                  const cleaned = v.replace(/[^0-9]/g, '');
                  setField('ref_mobno', cleaned);
                  if (cleaned.length === 10) {
                    checkRefMobileRegistered(cleaned);
                  } else if (cleaned.length < 10) {
                    if (errors.ref_mobno) setErrors((prev) => ({ ...prev, ref_mobno: '' }));
                    if (refName) setRefName('');
                  }
                }}
                placeholder="10-digit phone number"
                keyboardType="number-pad"
                maxLength={10}
                otherStyles="mb-1"
                variant="clean"
                isLoading={isRefPhoneChecking}
                error={!!errors.ref_mobno}
                errorMessage={errors.ref_mobno}
              />
              {refName ? (
                <Text className="ml-2 mb-3 font-psemibold text-sm text-green-700">
                  Name: {refName}
                </Text>
              ) : null}
              <View className="mb-3">
                <CustomSelectBottomSheet
                  label="Relationship Type"
                  options={GUEST_TYPE_OPTIONS}
                  selectedValue={form.guest_type}
                  onValueChange={(v: any) => {
                    Keyboard.dismiss();
                    setField('guest_type', String(v));
                  }}
                  placeholder="Select Relationship"
                  saveKeyInsteadOfValue
                />
              </View>
            </View>
          )}

          {/* Password */}
          <FormField
            text="Password"
            value={form.password}
            handleChangeText={(v: string) => {
              setField('password', v);
              if (errors.password) {
                validatePasswordField(v);
              }
            }}
            onBlur={() => validatePasswordField(form.password)}
            placeholder="Create a password"
            isPassword
            otherStyles="mb-3"
            variant="clean"
            error={!!errors.password}
            errorMessage={errors.password}
          />

          {/* Confirm Password */}
          <FormField
            text="Confirm Password"
            value={form.confirmPassword}
            handleChangeText={(v: string) => {
              setField('confirmPassword', v);
              if (errors.confirmPassword) {
                validateConfirmPasswordField(v, form.password);
              }
            }}
            onBlur={() => validateConfirmPasswordField(form.confirmPassword, form.password)}
            placeholder="Re-enter your password"
            isPassword
            otherStyles="mb-7"
            variant="clean"
            error={!!errors.confirmPassword}
            errorMessage={errors.confirmPassword}
          />

          {/* Submit */}
          <CustomButton
            text="Create Account"
            handlePress={submit}
            variant="pill"
            isLoading={isSubmitting}
            isDisabled={!isReady}
          />

          {/* Back to Sign In */}
          <Pressable
            onPress={() => router.back()}
            className="mb-2 mt-6 items-center py-1"
            hitSlop={8}>
            <Text className="font-pregular text-sm text-gray-400">
              Already have an account? <Text className="font-pmedium text-black">Sign In</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default SignUp;
