import { useState } from 'react';
import { View, Platform, Text, Image, TouchableWithoutFeedback } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { dropdowns, images, colors, icons } from '@/src/constants';
import { useAuthStore } from '@/src/stores';
import FormField from '@/src/components/FormField';
import FormDisplayField from '@/src/components/FormDisplayField';
import CustomButton from '@/src/components/CustomButton';
import handleAPICall from '@/src/utils/HandleApiCall';
import CustomSelectBottomSheet from '@/src/components/CustomSelectBottomSheet';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import ErrorText from '@/src/components/ErrorText';
import moment from 'moment';

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

const fetchCentres = () => {
  return new Promise((resolve, reject) => {
    handleAPICall(
      'GET',
      '/location/centres',
      null,
      null,
      (res: any) => {
        resolve(Array.isArray(res.data) ? res.data : []);
      },
      () => reject(new Error('Failed to fetch centres'))
    );
  });
};

const SectionHeader = ({ title }: { title: string }) => (
  <View className="mb-4 mt-6 border-b border-gray-200 pb-2">
    <Text className="text-lg font-semibold text-gray-800">{title}</Text>
  </View>
);

const CompleteProfile = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fieldError = (cond: boolean) => showValidation && cond;

  const initialFormState = {
    issuedto: user?.issuedto || '',
    gender: user?.gender || '',
    dob: user?.dob || '',
    idType: user?.idType || '',
    idNo: user?.idNo || '',
    address: user?.address || '',
    mobno: user?.mobno || '',
    email: user?.email || '',
    country: user?.country || '',
    state: user?.state || '',
    city: user?.city || '',
    pin: user?.pin || '',
    center: user?.center || '',
  };

  const [form, setForm] = useState(initialFormState);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(initialFormState.country);
  const [selectedState, setSelectedState] = useState(initialFormState.state);

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

  const isFormValid = () => {
    return (
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
      form.pin &&
      /^[A-Za-z0-9\s\-]{4,8}$/.test(form.pin.toString()) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    );
  };

  const submit = async () => {
    if (!isFormValid()) {
      setShowValidation(true);
      return;
    }

    setIsSubmitting(true);
    const onSuccess = (data: any) => {
      setUser(data.data);
      setIsSubmitting(false);
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
        idType: form.idType,
        idNo: form.idNo,
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

  const handleLogout = async () => {
    const onSuccess = async () => {
      logout();
    };

    await handleAPICall(
      'GET',
      '/client/logout',
      { cardno: user?.cardno },
      null,
      onSuccess,
      () => {}
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAwareScrollView
        bottomOffset={62}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 py-6">
          <View className="items-center">
            <Image source={images.logo} className="h-[60px] w-[60px]" resizeMode="contain" />
          </View>

          <View className="mt-4 items-center justify-center">
            <Text className="mb-2 text-sm text-gray-500">Step 2</Text>
            <View
              style={{
                width: '80%',
                height: 6,
                backgroundColor: '#E0E0E0',
                borderRadius: 3,
                marginBottom: 20,
              }}>
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: colors.orange,
                  borderRadius: 3,
                }}
              />
            </View>

            <Text className="text-center text-lg font-semibold text-gray-700">
              Complete Your Profile
            </Text>
            <Text className="mt-2 px-4 text-center text-sm text-gray-500">
              Help us personalize your experience by sharing some basic information about yourself.
            </Text>
          </View>

          <View className="w-full">
            <SectionHeader title="Personal Details" />
            <FormField
              text="Name"
              value={form.issuedto}
              handleChangeText={(e: any) => setForm({ ...form, issuedto: e })}
              otherStyles="mt-2"
              inputStyles="font-pmedium text-base"
              keyboardType="default"
              placeholder="Enter Your Name"
              containerStyles={'bg-gray-50'}
              error={fieldError(!form.issuedto)}
              errorMessage="Name is required"
            />

            <FormDisplayField
              text="Date of Birth"
              value={form.dob ? moment(form.dob).format('Do MMMM YYYY') : ''}
              placeholder="Select Date of Birth"
              otherStyles="mt-5"
              backgroundColor={'bg-gray-50'}
              onPress={() => setDatePickerVisibility(true)}
            />
            <ErrorText show={fieldError(form.dob == '')} message="Date of Birth is required" />

            {isDatePickerVisible && (
              <RNDateTimePicker
                themeVariant="light"
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                value={
                  form.dob
                    ? moment(form.dob, 'YYYY-MM-DD').toDate()
                    : moment(new Date(), 'YYYY-MM-DD').toDate()
                }
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
                onChange={(event, date) => {
                  if (Platform.OS === 'android') {
                    setDatePickerVisibility(false);
                  }
                  if (date) {
                    setForm((prev) => ({
                      ...prev,
                      dob: moment(date).format('YYYY-MM-DD'),
                    }));
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
              onValueChange={(val: any) => setForm({ ...form, gender: val })}
            />
            <ErrorText show={fieldError(form.gender == '')} message="Gender is required" />

            <SectionHeader title="Contact Info" />
            <FormField
              text="Phone Number"
              value={form.mobno ? form.mobno.toString() : ''}
              handleChangeText={(e: any) => setForm({ ...form, mobno: Number(e) })}
              otherStyles="mt-2"
              inputStyles="font-pmedium text-base"
              keyboardType="number-pad"
              placeholder="Enter Your Phone Number"
              maxLength={10}
              containerStyles={'bg-gray-50'}
              error={fieldError(!form.mobno || form.mobno.toString().length !== 10)}
              errorMessage="Mobile Number is required"
            />

            <FormField
              text="Email"
              value={form.email}
              handleChangeText={(e: any) => setForm({ ...form, email: e })}
              otherStyles="mt-5"
              inputStyles="font-pmedium text-base"
              keyboardType="email-address"
              placeholder="Enter Your Email ID"
              maxLength={100}
              containerStyles={'bg-gray-50'}
              error={fieldError(!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))}
              errorMessage="Email is required"
            />

            <SectionHeader title="Identity" />
            <CustomSelectBottomSheet
              className="mt-2"
              label="Select Government ID Type"
              placeholder="Select Government ID Type"
              options={dropdowns.ID_TYPE_LIST}
              selectedValue={form.idType}
              onValueChange={(val: any) => {
                setForm({ ...form, idType: val });
              }}
            />
            <ErrorText show={fieldError(form.idType == '')} message="ID Type is required" />

            <FormField
              text="Enter ID Number"
              value={form.idNo}
              handleChangeText={(e: any) => setForm({ ...form, idNo: e.trim() })}
              otherStyles="mt-5"
              inputStyles="font-pmedium text-base"
              keyboardType="default"
              placeholder="Enter Your ID Number"
              containerStyles={'bg-gray-50'}
              error={fieldError(!form.idNo)}
              errorMessage="Government ID is required"
            />

            <SectionHeader title="Address & Centre" />
            <CustomSelectBottomSheet
              className="mt-2"
              label="Centre"
              placeholder="Select Centre"
              options={centres}
              selectedValue={form.center}
              onValueChange={(val: any) => {
                setForm({ ...form, center: val });
              }}
              searchable={true}
              searchPlaceholder="Search Centres..."
              noResultsText="No Centres Found"
              isLoading={isCentresLoading}
              onRetry={fetchCentres}
              saveKeyInsteadOfValue={false}
            />
            <ErrorText show={fieldError(form.center == '')} message="Center is required" />

            <FormField
              text="Address"
              value={form.address}
              handleChangeText={(e: any) => setForm({ ...form, address: e })}
              multiline={true}
              numberOfLines={4}
              otherStyles="mt-5"
              inputStyles="font-pmedium text-base"
              keyboardType="default"
              placeholder="Enter Your Address"
              maxLength={200}
              containerStyles={'bg-gray-50'}
              error={fieldError(!form.address)}
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
              }}
              searchable={true}
              searchPlaceholder="Search Countries..."
              noResultsText="No Countries Found"
              isLoading={isCountriesLoading}
              onRetry={fetchCountries}
              saveKeyInsteadOfValue={false}
            />
            <ErrorText show={fieldError(form.country == '')} message="Country is required" />

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
                  }}
                  searchable={true}
                  searchPlaceholder="Search States..."
                  noResultsText="No States Found"
                  isLoading={isStatesLoading}
                  onRetry={() => fetchStates(selectedCountry)}
                  saveKeyInsteadOfValue={false}
                />
                <ErrorText
                  show={fieldError(selectedCountry && form.state == '')}
                  message="State is required"
                />
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
                  onValueChange={(val: any) => setForm({ ...form, city: val })}
                  searchable={true}
                  searchPlaceholder="Search Cities..."
                  noResultsText="No Cities Found"
                  isLoading={isCitiesLoading}
                  onRetry={() => fetchCities(selectedCountry, selectedState)}
                  saveKeyInsteadOfValue={false}
                />
                <ErrorText
                  show={fieldError(selectedCountry && selectedState && form.city == '')}
                  message="City is required"
                />
              </>
            )}

            <FormField
              text="Pin Code"
              value={form.pin || ''}
              handleChangeText={(e: any) => setForm({ ...form, pin: e })}
              otherStyles="mt-5"
              inputStyles="font-pmedium text-base"
              keyboardType="default"
              placeholder="Enter Your Pin Code"
              maxLength={8}
              containerStyles="bg-gray-50"
              error={fieldError(!form.pin || !/^[A-Za-z0-9\s\-]{4,8}$/.test(form.pin.toString()))}
              errorMessage="Please enter a valid Pin / Postal Code"
            />

            <CustomButton
              text="Submit Profile Details"
              handlePress={submit}
              containerStyles={`mt-8 mb-10 min-h-[62px] ${Platform.OS == 'android' && 'mb-3'}`}
              isLoading={isSubmitting}
            />
          </View>

          <View className="w-full items-center pb-10">
            <TouchableWithoutFeedback onPress={handleLogout}>
              <View className="flex flex-row items-center">
                <Image source={icons.logout} className="h-4 w-4" resizeMode="contain" />
                <Text className="ml-2 font-pregular text-sm text-black">Logout</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default CompleteProfile;
