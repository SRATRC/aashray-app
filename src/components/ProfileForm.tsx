import { useEffect, useRef, useState } from 'react';
import { Animated, View, Text, Platform, Modal, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { dropdowns } from '@/src/constants';
import CustomButton from '@/src/components/CustomButton';
import handleAPICall from '@/src/utils/HandleApiCall';
import CustomSelectBottomSheet from '@/src/components/CustomSelectBottomSheet';
import FieldGroup, {
  FieldRow,
  FieldRowError,
  FieldTextRow,
} from '@/src/components/booking/shared/FieldGroup';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

export interface ProfileFormData {
  issuedto: string;
  gender: string;
  dob: string;
  idType: string;
  idNo: string;
  address: string;
  mobno: string | number;
  email: string;
  country: string;
  state: string;
  city: string;
  pin: string;
  center: string;
}

interface ProfileFormProps {
  initialData?: Partial<ProfileFormData>;
  onSubmit: (data: ProfileFormData) => Promise<void>;
  submitButtonText?: string;
  isSubmitting?: boolean;
  showSectionHeaders?: boolean;
}

// API Functions
const fetchCountries = () => {
  return new Promise((resolve, reject) => {
    handleAPICall(
      'GET',
      '/location/countries',
      null,
      null,
      (res: any) => resolve(Array.isArray(res.data) ? res.data : []),
      () => reject(new Error('Failed to fetch countries'))
    );
  });
};

const fetchStates = (country: string) => {
  return new Promise((resolve, reject) => {
    handleAPICall(
      'GET',
      `/location/states/${country}`,
      null,
      null,
      (res: any) => resolve(Array.isArray(res.data) ? res.data : []),
      () => reject(new Error('Failed to fetch states'))
    );
  });
};

const fetchCities = (country: string, state: string) => {
  return new Promise((resolve, reject) => {
    handleAPICall(
      'GET',
      `/location/cities/${country}/${state}`,
      null,
      null,
      (res: any) => resolve(Array.isArray(res.data) ? res.data : []),
      () => reject(new Error('Failed to fetch cities'))
    );
  });
};

const fetchCentres = () => {
  return new Promise((resolve, reject) => {
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

// Validation helpers
export const validateProfileForm = (form: ProfileFormData): boolean => {
  return !!(
    form.issuedto &&
    form.gender &&
    form.dob &&
    form.address &&
    form.mobno &&
    form.email &&
    form.idType &&
    form.idNo &&
    form.country &&
    form.state &&
    form.city &&
    form.pin &&
    form.center &&
    form.mobno.toString().length === 10 &&
    /^[A-Za-z0-9\s\-]{4,8}$/.test(form.pin.toString()) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  );
};

const getDefaultFormData = (initial?: Partial<ProfileFormData>): ProfileFormData => ({
  issuedto: initial?.issuedto || '',
  gender: initial?.gender || '',
  dob: initial?.dob || '',
  idType: initial?.idType || '',
  idNo: initial?.idNo || '',
  address: initial?.address || '',
  mobno: initial?.mobno || '',
  email: initial?.email || '',
  country: initial?.country || '',
  state: initial?.state || '',
  city: initial?.city || '',
  pin: initial?.pin || '',
  center: initial?.center || '',
});

// Main Component
const ProfileForm = ({
  initialData,
  onSubmit,
  submitButtonText = 'Submit',
  isSubmitting = false,
  showSectionHeaders = true,
}: ProfileFormProps) => {
  const [form, setForm] = useState<ProfileFormData>(() => getDefaultFormData(initialData));
  const [showValidation, setShowValidation] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  // The spinner writes on every scroll tick, so it edits a draft the sheet
  // commits on Done. Otherwise Cancel would still have changed the date.
  const [draftDob, setDraftDob] = useState<Date>(new Date());
  // `animationType="slide"` moves the whole modal, so the dim backdrop slid up
  // with the sheet. The backdrop fades and only the sheet travels, which means
  // driving both here and keeping the modal mounted until the exit finishes.
  const [isSheetMounted, setSheetMounted] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isDatePickerVisible) {
      setSheetMounted(true);
      Animated.timing(sheetAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      return;
    }
    Animated.timing(sheetAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(
      ({ finished }) => {
        if (finished) setSheetMounted(false);
      }
    );
  }, [isDatePickerVisible, sheetAnim]);
  const [selectedCountry, setSelectedCountry] = useState(initialData?.country || '');
  const [selectedState, setSelectedState] = useState(initialData?.state || '');
  const [touchedFields, setTouchedFields] = useState<Set<string>>(() => new Set());

  const fieldError = (cond: unknown, fieldName?: string): boolean => {
    // Show error if validation is enabled OR if the field has been touched
    return Boolean((showValidation || (fieldName && touchedFields.has(fieldName))) && cond);
  };

  const markFieldTouched = (fieldName: string) => {
    setTouchedFields((prev) => new Set(prev).add(fieldName));
  };

  // Queries
  const { data: countries, isLoading: isCountriesLoading }: any = useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 30,
  });

  const { data: states, isLoading: isStatesLoading }: any = useQuery({
    queryKey: ['states', selectedCountry],
    queryFn: () => fetchStates(selectedCountry),
    enabled: !!selectedCountry,
    staleTime: 1000 * 60 * 30,
  });

  const { data: cities, isLoading: isCitiesLoading }: any = useQuery({
    queryKey: ['cities', selectedCountry, selectedState],
    queryFn: () => fetchCities(selectedCountry, selectedState),
    enabled: !!selectedState,
    staleTime: 1000 * 60 * 30,
  });

  const { data: centres, isLoading: isCentresLoading }: any = useQuery({
    queryKey: ['centres'],
    queryFn: fetchCentres,
    staleTime: 1000 * 60 * 30,
  });

  const handleSubmit = async () => {
    // Trimmed here rather than per-keystroke: transforming the value on the way
    // into state makes the controlled echo differ from what was typed.
    const cleaned = { ...form, idNo: form.idNo.trim() };
    if (!validateProfileForm(cleaned)) {
      setShowValidation(true);
      return;
    }
    await onSubmit(cleaned);
  };

  return (
    <View className="w-full gap-y-6">
      <FieldGroup title={showSectionHeaders ? 'Personal details' : undefined}>
        <FieldTextRow
          label="Name"
          value={form.issuedto}
          placeholder="Your name"
          autoCapitalize="words"
          onChangeText={(e: string) => {
            setForm((prev) => ({ ...prev, issuedto: e }));
            markFieldTouched('issuedto');
          }}
          error={fieldError(!form.issuedto, 'issuedto')}
          errorMessage="Name is required"
        />
        <View>
          <FieldRow
            label="Date of birth"
            value={form.dob ? moment(form.dob).format('Do MMMM YYYY') : ''}
            placeholder="Select"
            error={fieldError(!form.dob, 'dob')}
            onPress={() => {
              setDraftDob(form.dob ? moment(form.dob, 'YYYY-MM-DD').toDate() : new Date());
              setDatePickerVisibility(true);
              markFieldTouched('dob');
            }}
          />
          <FieldRowError
            message={fieldError(!form.dob, 'dob') ? 'Date of birth is required' : undefined}
          />
        </View>
        <View>
          <CustomSelectBottomSheet
            variant="row"
            label="Gender"
            placeholder="Select"
            options={dropdowns.GENDER_LIST}
            selectedValue={form.gender}
            onValueChange={(val: any) => {
              setForm((prev) => ({ ...prev, gender: val }));
              markFieldTouched('gender');
            }}
          />
          <FieldRowError
            message={fieldError(!form.gender, 'gender') ? 'Gender is required' : undefined}
          />
        </View>
      </FieldGroup>

      {/* Android opens its own dialog. On iOS the spinner has no chrome of its
          own, so inline it just lands in the page and shoves the form around —
          it goes in the same bottom sheet every other picker here uses. */}
      {isDatePickerVisible && Platform.OS === 'android' && (
        <RNDateTimePicker
          themeVariant="light"
          mode="date"
          display="default"
          value={form.dob ? moment(form.dob, 'YYYY-MM-DD').toDate() : new Date()}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
          onChange={(event, date) => {
            setDatePickerVisibility(false);
            if (date) {
              setForm((prev) => ({ ...prev, dob: moment(date).format('YYYY-MM-DD') }));
              markFieldTouched('dob');
            }
          }}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          visible={isSheetMounted}
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={() => setDatePickerVisibility(false)}>
          <View className="flex-1 justify-end">
            <Animated.View
              className="absolute inset-0 bg-black/50"
              style={{ opacity: sheetAnim }}
            />
            <Pressable
              className="absolute inset-0"
              onPress={() => setDatePickerVisibility(false)}
            />
            <Animated.View
              className="overflow-hidden rounded-t-3xl bg-white pb-8"
              style={{
                transform: [
                  {
                    translateY: sheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [420, 0],
                    }),
                  },
                ],
              }}>
              <View className="items-center pb-3 pt-2">
                <View className="h-1.5 w-16 rounded-full bg-gray-300" />
              </View>

              <View className="flex-row items-center justify-between border-b border-gray-200 px-4 pb-4">
                <Pressable onPress={() => setDatePickerVisibility(false)} hitSlop={10}>
                  <Text className="font-pmedium text-base text-gray-500">Cancel</Text>
                </Pressable>
                <Text className="font-psemibold text-lg text-gray-900">Date of birth</Text>
                <Pressable
                  onPress={() => {
                    setForm((prev) => ({ ...prev, dob: moment(draftDob).format('YYYY-MM-DD') }));
                    markFieldTouched('dob');
                    setDatePickerVisibility(false);
                  }}
                  hitSlop={10}>
                  <Text className="font-psemibold text-base text-secondary-200">Done</Text>
                </Pressable>
              </View>

              <RNDateTimePicker
                themeVariant="light"
                mode="date"
                display="spinner"
                value={draftDob}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
                onChange={(event, date) => {
                  if (date) setDraftDob(date);
                }}
              />
            </Animated.View>
          </View>
        </Modal>
      )}

      <FieldGroup title={showSectionHeaders ? 'Contact' : undefined}>
        <FieldTextRow
          label="Phone"
          value={form.mobno?.toString() || ''}
          placeholder="10 digits"
          keyboardType="number-pad"
          maxLength={10}
          onChangeText={(e: string) => {
            setForm((prev) => ({ ...prev, mobno: e }));
            markFieldTouched('mobno');
          }}
          error={fieldError(!form.mobno || form.mobno.toString().length !== 10, 'mobno')}
          errorMessage="A 10 digit mobile number is required"
        />
        <FieldTextRow
          label="Email"
          value={form.email}
          placeholder="you@example.com"
          keyboardType="email-address"
          maxLength={100}
          onChangeText={(e: string) => {
            setForm((prev) => ({ ...prev, email: e }));
            markFieldTouched('email');
          }}
          error={fieldError(!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email), 'email')}
          errorMessage="A valid email is required"
        />
      </FieldGroup>

      <FieldGroup title={showSectionHeaders ? 'Identity' : undefined}>
        <View>
          <CustomSelectBottomSheet
            variant="row"
            label="ID type"
            placeholder="Select"
            options={dropdowns.ID_TYPE_LIST}
            selectedValue={form.idType}
            saveKeyInsteadOfValue
            onValueChange={(val: any) => {
              setForm((prev) => ({ ...prev, idType: val }));
              markFieldTouched('idType');
            }}
          />
          <FieldRowError
            message={fieldError(!form.idType, 'idType') ? 'ID type is required' : undefined}
          />
        </View>
        <FieldTextRow
          label="ID number"
          value={form.idNo}
          placeholder="Enter ID number"
          autoCapitalize="characters"
          onChangeText={(e: string) => {
            setForm((prev) => ({ ...prev, idNo: e }));
            markFieldTouched('idNo');
          }}
          error={fieldError(
            !form.idNo ||
              (form.idNo && form.idType == 'PAN' && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.idNo)) ||
              (form.idNo && form.idType == 'PASSPORT' && !/^[A-Z0-9]{6,12}$/.test(form.idNo)),
            'idNo'
          )}
          errorMessage="A valid government ID is required"
        />
      </FieldGroup>

      <FieldGroup title={showSectionHeaders ? 'Address & centre' : undefined}>
        <View>
          <CustomSelectBottomSheet
            variant="row"
            label="Centre"
            placeholder="Select"
            options={centres}
            selectedValue={form.center}
            onValueChange={(val: any) => {
              setForm((prev) => ({ ...prev, center: val }));
              markFieldTouched('center');
            }}
            searchable
            searchPlaceholder="Search Centres..."
            noResultsText="No Centres Found"
            isLoading={isCentresLoading}
            onRetry={fetchCentres}
            saveKeyInsteadOfValue={false}
          />
          <FieldRowError
            message={fieldError(!form.center, 'center') ? 'Centre is required' : undefined}
          />
        </View>
        <FieldTextRow
          label="Address"
          value={form.address}
          placeholder="Enter your address"
          multiline
          maxLength={200}
          onChangeText={(e: string) => {
            setForm((prev) => ({ ...prev, address: e }));
            markFieldTouched('address');
          }}
          error={fieldError(!form.address, 'address')}
          errorMessage="Address is required"
        />
        <View>
          <CustomSelectBottomSheet
            variant="row"
            label="Country"
            placeholder="Select"
            options={countries}
            selectedValue={form.country}
            onValueChange={(val: any) => {
              setForm((prev) => ({ ...prev, country: val, state: '', city: '' }));
              setSelectedCountry(val);
              setSelectedState('');
              markFieldTouched('country');
            }}
            searchable
            searchPlaceholder="Search Countries..."
            noResultsText="No Countries Found"
            isLoading={isCountriesLoading}
            onRetry={fetchCountries}
            saveKeyInsteadOfValue={false}
          />
          <FieldRowError
            message={fieldError(!form.country, 'country') ? 'Country is required' : undefined}
          />
        </View>
        {selectedCountry ? (
          <View>
            <CustomSelectBottomSheet
              variant="row"
              label="State"
              placeholder="Select"
              options={states}
              selectedValue={form.state}
              onValueChange={(val: any) => {
                setForm((prev) => ({ ...prev, state: val, city: '' }));
                setSelectedState(val);
                markFieldTouched('state');
              }}
              searchable
              searchPlaceholder="Search States..."
              noResultsText="No States Found"
              isLoading={isStatesLoading}
              onRetry={() => fetchStates(selectedCountry)}
              saveKeyInsteadOfValue={false}
            />
            <FieldRowError
              message={fieldError(!form.state, 'state') ? 'State is required' : undefined}
            />
          </View>
        ) : null}
        {selectedState ? (
          <View>
            <CustomSelectBottomSheet
              variant="row"
              label="City"
              placeholder="Select"
              options={cities}
              selectedValue={form.city}
              onValueChange={(val: any) => {
                setForm((prev) => ({ ...prev, city: val }));
                markFieldTouched('city');
              }}
              searchable
              searchPlaceholder="Search Cities..."
              noResultsText="No Cities Found"
              isLoading={isCitiesLoading}
              onRetry={() => fetchCities(selectedCountry, selectedState)}
              saveKeyInsteadOfValue={false}
            />
            <FieldRowError
              message={fieldError(!form.city, 'city') ? 'City is required' : undefined}
            />
          </View>
        ) : null}
        <FieldTextRow
          label="Pin code"
          value={form.pin || ''}
          placeholder="Postal code"
          keyboardType="number-pad"
          maxLength={8}
          onChangeText={(e: string) => {
            setForm((prev) => ({ ...prev, pin: e }));
            markFieldTouched('pin');
          }}
          error={fieldError(
            !form.pin || !/^[A-Za-z0-9\s\-]{4,8}$/.test(form.pin.toString()),
            'pin'
          )}
          errorMessage="Enter a valid pin or postal code"
        />
      </FieldGroup>

      <CustomButton
        text={submitButtonText}
        handlePress={handleSubmit}
        containerStyles="min-h-[62px]"
        isLoading={isSubmitting}
      />
    </View>
  );
};

export default ProfileForm;
