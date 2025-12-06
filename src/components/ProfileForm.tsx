import { useState } from 'react';
import { View, Platform, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { dropdowns } from '@/src/constants';
import FormField from '@/src/components/FormField';
import FormDisplayField from '@/src/components/FormDisplayField';
import CustomButton from '@/src/components/CustomButton';
import handleAPICall from '@/src/utils/HandleApiCall';
import CustomSelectBottomSheet from '@/src/components/CustomSelectBottomSheet';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import ErrorText from '@/src/components/ErrorText';
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

// Section Header Component
const SectionHeader = ({ title }: { title: string }) => (
  <View className="mb-4 mt-6 border-b border-gray-200 pb-2">
    <Text className="text-lg font-semibold text-gray-800">{title}</Text>
  </View>
);

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
  const [selectedCountry, setSelectedCountry] = useState(initialData?.country || '');
  const [selectedState, setSelectedState] = useState(initialData?.state || '');
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const fieldError = (cond: boolean, fieldName?: string) => {
    // Show error if validation is enabled OR if the field has been touched
    return (showValidation || (fieldName && touchedFields.has(fieldName))) && cond;
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
    if (!validateProfileForm(form)) {
      setShowValidation(true);
      return;
    }
    await onSubmit(form);
  };

  return (
    <View className="w-full">
      {/* Personal Details */}
      {showSectionHeaders && <SectionHeader title="Personal Details" />}
      <FormField
        text="Name"
        value={form.issuedto}
        handleChangeText={(e: string) => {
          setForm({ ...form, issuedto: e });
          markFieldTouched('issuedto');
        }}
        otherStyles={showSectionHeaders ? 'mt-2' : ''}
        inputStyles="font-pmedium text-base"
        keyboardType="default"
        placeholder="Enter Your Name"
        containerStyles="bg-gray-100"
        error={fieldError(!form.issuedto, 'issuedto')}
        errorMessage="Name is required"
      />

      <FormDisplayField
        text="Date of Birth"
        value={form.dob ? moment(form.dob).format('Do MMMM YYYY') : ''}
        placeholder="Select Date of Birth"
        otherStyles="mt-5"
        backgroundColor="bg-gray-100"
        onPress={() => {
          setDatePickerVisibility(true);
          markFieldTouched('dob');
        }}
      />
      <ErrorText show={fieldError(!form.dob, 'dob')} message="Date of Birth is required" />

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
              markFieldTouched('dob');
            }
          }}
        />
      )}

      <CustomSelectBottomSheet
        className="mt-5"
        label="Gender"
        placeholder="Select Gender"
        options={dropdowns.GENDER_LIST}
        selectedValue={form.gender}
        onValueChange={(val: any) => {
          setForm({ ...form, gender: val });
          markFieldTouched('gender');
        }}
      />
      <ErrorText show={fieldError(!form.gender, 'gender')} message="Gender is required" />

      {/* Contact Info */}
      {showSectionHeaders && <SectionHeader title="Contact Info" />}
      <FormField
        text="Phone Number"
        value={form.mobno?.toString() || ''}
        handleChangeText={(e: string) => {
          setForm({ ...form, mobno: Number(e) });
          markFieldTouched('mobno');
        }}
        otherStyles={showSectionHeaders ? 'mt-2' : 'mt-5'}
        inputStyles="font-pmedium text-base"
        keyboardType="number-pad"
        placeholder="Enter Your Phone Number"
        maxLength={10}
        containerStyles="bg-gray-100"
        error={fieldError(!form.mobno || form.mobno.toString().length !== 10, 'mobno')}
        errorMessage="Mobile Number is required"
      />

      <FormField
        text="Email"
        value={form.email}
        handleChangeText={(e: string) => {
          setForm({ ...form, email: e });
          markFieldTouched('email');
        }}
        otherStyles="mt-5"
        inputStyles="font-pmedium text-base"
        keyboardType="email-address"
        placeholder="Enter Your Email ID"
        maxLength={100}
        containerStyles="bg-gray-100"
        error={fieldError(!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email), 'email')}
        errorMessage="Email is required"
      />

      {/* Identity */}
      {showSectionHeaders && <SectionHeader title="Identity" />}
      <CustomSelectBottomSheet
        className={showSectionHeaders ? 'mt-2' : 'mt-5'}
        label="Select Government ID Type"
        placeholder="Select Government ID Type"
        options={dropdowns.ID_TYPE_LIST}
        selectedValue={form.idType}
        saveKeyInsteadOfValue
        onValueChange={(val: any) => {
          setForm({ ...form, idType: val });
          markFieldTouched('idType');
        }}
      />
      <ErrorText show={fieldError(!form.idType, 'idType')} message="ID Type is required" />

      <FormField
        text="Enter ID Number"
        value={form.idNo}
        autoCapitalize="characters"
        handleChangeText={(e: string) => {
          setForm({ ...form, idNo: e.trim() });
          markFieldTouched('idNo');
        }}
        otherStyles="mt-5"
        inputStyles="font-pmedium text-base"
        keyboardType="default"
        placeholder="Enter Your ID Number"
        containerStyles="bg-gray-100"
        error={fieldError(
          !form.idNo ||
            (form.idNo && form.idType == 'PAN' && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.idNo)) ||
            (form.idNo && form.idType == 'PASSPORT' && !/^[A-Z0-9]{6,12}$/.test(form.idNo)),
          'idNo'
        )}
        errorMessage="Valid Government ID is required"
      />

      {/* Address & Centre */}
      {showSectionHeaders && <SectionHeader title="Address & Centre" />}
      <CustomSelectBottomSheet
        className={showSectionHeaders ? 'mt-2' : 'mt-5'}
        label="Centre"
        placeholder="Select Centre"
        options={centres}
        selectedValue={form.center}
        onValueChange={(val: any) => {
          setForm({ ...form, center: val });
          markFieldTouched('center');
        }}
        searchable
        searchPlaceholder="Search Centres..."
        noResultsText="No Centres Found"
        isLoading={isCentresLoading}
        onRetry={fetchCentres}
        saveKeyInsteadOfValue={false}
      />
      <ErrorText show={fieldError(!form.center, 'center')} message="Center is required" />

      <FormField
        text="Address"
        value={form.address}
        handleChangeText={(e: string) => {
          setForm({ ...form, address: e });
          markFieldTouched('address');
        }}
        multiline
        numberOfLines={4}
        otherStyles="mt-5"
        inputStyles="font-pmedium text-base"
        keyboardType="default"
        placeholder="Enter Your Address"
        maxLength={200}
        containerStyles="bg-gray-100"
        error={fieldError(!form.address, 'address')}
        errorMessage="Address is required"
      />

      <CustomSelectBottomSheet
        className="mt-5"
        label="Country"
        placeholder="Select Country"
        options={countries}
        selectedValue={form.country}
        onValueChange={(val: any) => {
          setForm({ ...form, country: val, state: '', city: '' });
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
      <ErrorText show={fieldError(!form.country, 'country')} message="Country is required" />

      {selectedCountry && (
        <>
          <CustomSelectBottomSheet
            className="mt-5"
            label="State"
            placeholder="Select State"
            options={states}
            selectedValue={form.state}
            onValueChange={(val: any) => {
              setForm({ ...form, state: val, city: '' });
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
          <ErrorText show={fieldError(!form.state, 'state')} message="State is required" />
        </>
      )}

      {selectedState && (
        <>
          <CustomSelectBottomSheet
            className="mt-5"
            label="City"
            placeholder="Select City"
            options={cities}
            selectedValue={form.city}
            onValueChange={(val: any) => {
              setForm({ ...form, city: val });
              markFieldTouched('city');
            }}
            searchable
            searchPlaceholder="Search Cities..."
            noResultsText="No Cities Found"
            isLoading={isCitiesLoading}
            onRetry={() => fetchCities(selectedCountry, selectedState)}
            saveKeyInsteadOfValue={false}
          />
          <ErrorText show={fieldError(!form.city, 'city')} message="City is required" />
        </>
      )}

      <FormField
        text="Pin Code"
        value={form.pin || ''}
        handleChangeText={(e: string) => {
          setForm({ ...form, pin: e });
          markFieldTouched('pin');
        }}
        otherStyles="mt-5"
        inputStyles="font-pmedium text-base"
        keyboardType="number-pad"
        placeholder="Enter Your Pin Code"
        maxLength={8}
        containerStyles="bg-gray-100"
        error={fieldError(!form.pin || !/^[A-Za-z0-9\s\-]{4,8}$/.test(form.pin.toString()), 'pin')}
        errorMessage="Please enter a valid Pin / Postal Code"
      />

      <CustomButton
        text={submitButtonText}
        handlePress={handleSubmit}
        containerStyles={`mt-8 mb-10 min-h-[62px] ${Platform.OS === 'android' && 'mb-3'}`}
        isLoading={isSubmitting}
      />
    </View>
  );
};

export default ProfileForm;
