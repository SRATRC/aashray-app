import { View, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dropdowns, icons } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useRouter } from 'expo-router';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import FormDisplayField from '../../components/FormDisplayField';
import CustomButton from '../../components/CustomButton';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import handleAPICall from '../../utils/HandleApiCall';
import moment from 'moment';
import CustomSelectBottomSheet from '~/components/CustomSelectBottomSheet';

const fetchCountries = () => {
  return new Promise((resolve, reject) => {
    handleAPICall(
      'GET',
      '/location/countries',
      null,
      null,
      (res: any) => {
        resolve(Array.isArray(res.data) ? res.data : []);
      },
      () => reject(new Error('Failed to fetch countries'))
    );
  });
};

const fetchStates = (country: any) => {
  return new Promise((resolve, reject) => {
    handleAPICall(
      'GET',
      `/location/states/${country}`,
      null,
      null,
      (res: any) => {
        resolve(Array.isArray(res.data) ? res.data : []);
      },
      () => reject(new Error('Failed to fetch states'))
    );
  });
};

const fetchCities = (country: any, state: any) => {
  return new Promise((resolve, reject) => {
    handleAPICall(
      'GET',
      `/location/cities/${country}/${state}`,
      null,
      null,
      (res: any) => {
        resolve(Array.isArray(res.data) ? res.data : []);
      },
      () => reject(new Error('Failed to fetch cities'))
    );
  });
};

const profileDetails = () => {
  const { user, setUser, setCurrentUser } = useGlobalContext();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormState = {
    issuedto: user.issuedto,
    gender: user.gender,
    dob: user.dob,
    address: user.address,
    mobno: user.mobno,
    email: user.email,
    country: user.country,
    state: user.state,
    city: user.city,
    pin: user.pin,
    center: user.center,
  };

  const [form, setForm] = useState(initialFormState);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(initialFormState.country);
  const [selectedState, setSelectedState] = useState(initialFormState.state);

  const {
    data: countries,
    isLoading: isCountriesLoading,
    isError: isCountriesError,
  }: any = useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 30,
  });

  const {
    data: states,
    isLoading: isStatesLoading,
    isError: isStatesError,
  }: any = useQuery({
    queryKey: ['states', selectedCountry],
    queryFn: () => fetchStates(selectedCountry),
    enabled: !!selectedCountry,
    staleTime: 1000 * 60 * 30,
  });

  const {
    data: cities,
    isLoading: isCitiesLoading,
    isError: isCitiesError,
  }: any = useQuery({
    queryKey: ['cities', selectedCountry, selectedState],
    queryFn: () => fetchCities(selectedCountry, selectedState),
    enabled: !!selectedState,
    staleTime: 1000 * 60 * 30,
  });

  const isFormModified = () => {
    return JSON.stringify(form) !== JSON.stringify(initialFormState);
  };

  const isFormValid = () => {
    return (
      form.issuedto &&
      form.gender &&
      form.dob &&
      form.address &&
      form.mobno &&
      form.email &&
      form.country &&
      form.state &&
      form.city &&
      form.pin &&
      form.center
    );
  };

  const submit = async () => {
    setIsSubmitting(true);
    const onSuccess = (data: any) => {
      setUser(data.data);
      setCurrentUser(data.data);
      setIsSubmitting(false);
      router.back();
    };
    const onFinally = () => {
      setIsSubmitting(false);
    };
    await handleAPICall(
      'PUT',
      '/profile',
      null,
      {
        cardno: user.cardno,
        issuedto: form.issuedto,
        gender: form.gender,
        dob: form.dob,
        address: form.address,
        mobno: form.mobno,
        email: form.email,
        country: form.country,
        state: form.state,
        city: form.city,
        pin: form.pin,
        center: form.center,
      },
      onSuccess,
      onFinally
    );
  };

  return (
    <SafeAreaView className="h-full bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <PageHeader title={'Profile Details'} />
        <ScrollView>
          <View className="mb-8 w-full px-4">
            <FormField
              text="Name"
              value={form.issuedto}
              handleChangeText={(e: any) => setForm({ ...form, issuedto: e })}
              otherStyles="mt-2"
              inputStyles="font-pmedium text-base"
              keyboardType="default"
              placeholder="Enter Your Name"
              containerStyles={'bg-gray-100'}
            />

            <FormField
              text="Phone Number"
              value={form.mobno.toString()}
              handleChangeText={(e: any) => setForm({ ...form, mobno: Number(e) })}
              otherStyles="mt-7"
              inputStyles="font-pmedium text-base"
              keyboardType="number-pad"
              placeholder="Enter Your Phone Number"
              maxLength={10}
              containerStyles={'bg-gray-100'}
            />

            <FormField
              text="Email"
              value={form.email}
              handleChangeText={(e: any) => setForm({ ...form, email: e.trim() })}
              otherStyles="mt-7"
              inputStyles="font-pmedium text-base"
              keyboardType="email-address"
              placeholder="Enter Your Email ID"
              maxLength={100}
              containerStyles={'bg-gray-100'}
            />

            <FormDisplayField
              text="Date of Birth"
              value={form.dob ? moment(form.dob).format('Do MMMM YYYY') : 'Date of Birth'}
              otherStyles="mt-7"
              backgroundColor={'bg-gray-100'}
              onPress={() => setDatePickerVisibility(true)}
            />

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              date={form.dob ? moment(form.dob).toDate() : moment().toDate()}
              onConfirm={(date) => {
                setForm({
                  ...form,
                  dob: moment(date).format('YYYY-MM-DD'),
                });
                setDatePickerVisibility(false);
              }}
              onCancel={() => setDatePickerVisibility(false)}
              maximumDate={moment().toDate()}
            />

            <CustomSelectBottomSheet
              className="mt-7"
              label="Gender"
              placeholder="Select Gender"
              options={dropdowns.GENDER_LIST}
              selectedValue={form.gender}
              onValueChange={(val: any) => setForm({ ...form, gender: val })}
            />

            <FormField
              text="Center"
              value={form.center}
              handleChangeText={(e: any) => setForm({ ...form, center: e.trim() })}
              otherStyles="mt-7"
              inputStyles="font-pmedium text-base"
              keyboardType="default"
              placeholder="Enter Your Center"
              maxLength={100}
              containerStyles={'bg-gray-100'}
            />

            <FormField
              text="Address"
              value={form.address}
              handleChangeText={(e: any) => setForm({ ...form, address: e })}
              multiline={true}
              numberOfLines={4}
              otherStyles="mt-7"
              inputStyles="font-pmedium text-base"
              keyboardType="default"
              placeholder="Enter Your Address"
              maxLength={200}
              containerStyles={'bg-gray-100'}
            />

            <CustomSelectBottomSheet
              className="mt-7"
              label="Country"
              placeholder="Select Country"
              options={countries}
              selectedValue={form.country}
              onValueChange={(val: any) => {
                setForm({ ...form, country: val, state: '', city: '' });
                setSelectedCountry(val);
              }}
              searchable={true}
              searchPlaceholder="Search Countries..."
              noResultsText="No Countries Found"
              isLoading={isCountriesLoading}
              onRetry={fetchCountries}
              saveKeyInsteadOfValue={false}
            />

            {selectedCountry && (
              <CustomSelectBottomSheet
                className="mt-7"
                label="State"
                placeholder="Select State"
                options={states}
                selectedValue={form.state}
                onValueChange={(val: any) => {
                  setForm({ ...form, state: val, city: '' });
                  setSelectedState(val);
                }}
                searchable={true}
                searchPlaceholder="Search States..."
                noResultsText="No States Found"
                isLoading={isStatesLoading}
                onRetry={() => fetchStates(selectedCountry)}
                saveKeyInsteadOfValue={false}
              />
            )}

            {selectedState && (
              <CustomSelectBottomSheet
                className="mt-7"
                label="City"
                placeholder="Select City"
                options={cities}
                selectedValue={form.city}
                onValueChange={(val: any) => setForm({ ...form, city: val })}
                searchable={true}
                searchPlaceholder="Search Cities..."
                noResultsText="No Cities Found"
                isLoading={isCitiesLoading}
                onRetry={() => fetchCities(selectedCountry, selectedState)}
                saveKeyInsteadOfValue={false}
              />
            )}

            <FormField
              text="Pin Code"
              value={form.pin.toString()}
              handleChangeText={(e: any) => setForm({ ...form, pin: e })}
              otherStyles="mt-7"
              inputStyles="font-pmedium text-base"
              keyboardType="number-pad"
              placeholder="Enter Your pin Code"
              maxLength={6}
              containerStyles={'bg-gray-100'}
            />

            <CustomButton
              text="Update Profile"
              handlePress={submit}
              containerStyles={`mt-7 mb-10 min-h-[62px] ${Platform.OS == 'android' && 'mb-3'}`}
              isLoading={isSubmitting}
              isDisabled={!isFormModified() || !isFormValid()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default profileDetails;
