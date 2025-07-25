import { useState } from 'react';
import {
  View,
  ScrollView,
  Platform,
  Text,
  Image,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { dropdowns, images, colors, icons } from '@/constants';
import { useAuthStore } from '@/stores';
import FormField from '@/components/FormField';
import FormDisplayField from '@/components/FormDisplayField';
import CustomButton from '@/components/CustomButton';
import handleAPICall from '@/utils/HandleApiCall';
import CustomSelectBottomSheet from '@/components/CustomSelectBottomSheet';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import PageHeader from '@/components/PageHeader';
import moment from 'moment';
import Toast from 'react-native-toast-message';

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

const CompleteProfile = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

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
      form.center
    );
  };

  const submit = async () => {
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
    try {
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
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'An error occurred!',
        text2: error.message,
        swipeable: false,
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView alwaysBounceVertical={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-between px-6 py-10">
          <View className="mt-4 items-center">
            <Image source={images.logo} className="h-[80px] w-[80px]" resizeMode="contain" />
          </View>

          <View className="flex-1 items-center justify-center">
            <Text className="mb-2 text-sm text-gray-500">Step 2 of 2</Text>
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

          <View className="items-center">
            <CustomButton
              text="Enter Profile Details"
              handlePress={() => setIsModalVisible(true)}
              containerStyles="min-h-[52px] w-full rounded-lg mb-4"
              textStyles="text-white text-base font-medium"
            />
          </View>

          <View className="w-full items-center">
            <TouchableWithoutFeedback onPress={handleLogout}>
              <View className="flex flex-row items-center">
                <Image source={icons.logout} className="h-4 w-4" resizeMode="contain" />
                <Text className="ml-2 font-pregular text-sm text-black">Logout</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        statusBarTranslucent={true}
        presentationStyle="pageSheet"
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}>
        <KeyboardAwareScrollView
          bottomOffset={62}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled">
          <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <PageHeader
              title="Complete your profile"
              iconName="times"
              onPress={() => {
                setIsModalVisible(false);
              }}
            />
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
                value={form.mobno ? form.mobno.toString() : ''}
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
                handleChangeText={(e: any) => setForm({ ...form, email: e })}
                otherStyles="mt-7"
                inputStyles="font-pmedium text-base"
                keyboardType="email-address"
                placeholder="Enter Your Email ID"
                maxLength={100}
                containerStyles={'bg-gray-100'}
              />

              <CustomSelectBottomSheet
                className="mt-7"
                label="Select Government ID Type"
                placeholder="Select Government ID Type"
                options={dropdowns.ID_TYPE_LIST}
                selectedValue={form.idType}
                onValueChange={(val: any) => {
                  setForm({ ...form, idType: val });
                }}
              />

              <FormField
                text="Enter ID Number"
                value={form.idNo}
                handleChangeText={(e: any) => setForm({ ...form, idNo: e.trim() })}
                otherStyles="mt-7"
                inputStyles="font-pmedium text-base"
                keyboardType="default"
                placeholder="Enter Your ID Number"
                containerStyles={'bg-gray-100'}
              />

              <FormDisplayField
                text="Date of Birth"
                value={form.dob ? moment(form.dob).format('Do MMMM YYYY') : 'Select Date of Birth'}
                otherStyles="mt-7"
                backgroundColor={'bg-gray-100'}
                onPress={() => setDatePickerVisibility(true)}
              />

              {isDatePickerVisible && (
                <RNDateTimePicker
                  themeVariant="light"
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  value={form.dob ? moment(form.dob).toDate() : new Date()}
                  maximumDate={moment().toDate()}
                  onChange={(event, date) => {
                    if (Platform.OS === 'android') {
                      setDatePickerVisibility(false);
                    }

                    if (date) {
                      setForm({
                        ...form,
                        dob: moment(date).format('YYYY-MM-DD'),
                      });
                    }
                  }}
                />
              )}

              <CustomSelectBottomSheet
                className="mt-7"
                label="Gender"
                placeholder="Select Gender"
                options={dropdowns.GENDER_LIST}
                selectedValue={form.gender}
                onValueChange={(val: any) => setForm({ ...form, gender: val })}
              />

              <CustomSelectBottomSheet
                className="mt-7"
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
                value={form.pin ? form.pin.toString() : ''}
                handleChangeText={(e: any) => setForm({ ...form, pin: e })}
                otherStyles="mt-7"
                inputStyles="font-pmedium text-base"
                keyboardType="number-pad"
                placeholder="Enter Your Pin Code"
                maxLength={6}
                containerStyles={'bg-gray-100'}
              />

              <CustomButton
                text="Submit Profile Details"
                handlePress={submit}
                containerStyles={`mt-7 mb-10 min-h-[62px] ${Platform.OS == 'android' && 'mb-3'}`}
                isLoading={isSubmitting}
                isDisabled={!isFormValid()}
              />
            </View>
          </SafeAreaView>
        </KeyboardAwareScrollView>
      </Modal>
    </SafeAreaView>
  );
};

export default CompleteProfile;
