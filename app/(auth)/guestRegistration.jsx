import {
  View,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
  Alert,
  TouchableOpacity
} from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { images } from '../../constants';
import moment from 'moment';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import CustomDropdown from '../../components/CustomDropdown';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import FormDisplayField from '../../components/FormDisplayField';

const guestRegistration = () => {
  const [form, setForm] = useState({
    name: null,
    gender: null,
    dob: null,
    mobno: null,
    email: null,
    idType: null,
    idNo: null,
    address: null,
    city: null,
    state: null,
    pin: null
  });

  const genderList = [
    { key: 'M', value: 'Male' },
    { key: 'F', value: 'Female' }
  ];

  const idTypeList = [
    { key: 'PAN', value: 'PAN Card' },
    { key: 'ADHAAR', value: 'Adhaar Card' },
    { key: 'DL', value: 'Driving Licence' },
    { key: 'PASSPORT', value: 'Passport' }
  ];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date) => {
    setForm({ ...form, dob: moment(date).format('YYYY-MM-DD') });
    hideDatePicker();
  };

  return (
    <SafeAreaView className="h-full bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView alwaysBounceVertical={false}>
          <View className="w-full justify-center min-h-[83vh] px-4 my-6">
            <Image
              source={images.logo}
              className="w-[108px] h-[57px]"
              resizeMode="contain"
            />
            <Text className="text-2xl text-black text-semibold font-psemibold mt-5">
              Welcome to SRATRC
            </Text>

            <FormField
              text="Name"
              value={form.name}
              handleChangeText={(e) => setForm({ ...form, name: e })}
              otherStyles="mt-7"
              inputStyles="font-pmedium text-base text-gray-400"
              placeholder="Enter Your Name"
            />

            <CustomDropdown
              otherStyles={`mt-5 w-full ${
                Platform.OS === 'ios'
                  ? 'shadow-lg border-gray-200'
                  : 'shadow-2xl border-gray-400'
              }`}
              boxbg={'white'}
              text={'Gender'}
              placeholder={'Select Your Gender'}
              data={genderList}
              setSelected={(val) => setForm({ ...form, gender: val })}
            />

            <TouchableOpacity onPress={showDatePicker}>
              <FormDisplayField
                text="Date Of Birth"
                value={form.dob ? form.dob : 'Date of Birth'}
                otherStyles="mt-7"
              />
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={handleConfirm}
              onCancel={hideDatePicker}
            />

            <FormField
              text="Phone Number"
              prefix="+91"
              value={form.mobno}
              handleChangeText={(e) => setForm({ ...form, mobno: e })}
              otherStyles="mt-7"
              inputStyles="font-pmedium text-base text-gray-400"
              keyboardType="number-pad"
              placeholder="Enter Your Phone Number"
              maxLength={10}
            />

            <FormField
              text="Email"
              value={form.email}
              handleChangeText={(e) => setForm({ ...form, email: e })}
              otherStyles="mt-7"
              inputStyles="font-pmedium text-base text-gray-400"
              keyboardType="email-address"
              placeholder="Enter Your Email Address"
              autoCapitalize={'none'}
              autoComplete={'off'}
              autoCorrect={false}
            />

            <CustomDropdown
              otherStyles={`mt-5 w-full ${
                Platform.OS === 'ios'
                  ? 'shadow-lg border-gray-200'
                  : 'shadow-2xl border-gray-400'
              }`}
              boxbg={'white'}
              text={'ID Type'}
              placeholder={'Select ID Type'}
              data={idTypeList}
              setSelected={(val) => setForm({ ...form, idType: val })}
            />

            <FormField
              text="ID Number"
              value={form.idNo}
              handleChangeText={(e) => setForm({ ...form, idNo: e })}
              otherStyles="mt-7"
              inputStyles="font-pmedium text-base text-gray-400"
              placeholder="Enter Your ID Number"
              autoCapitalize={'none'}
              autoComplete={'off'}
              autoCorrect={false}
            />

            <FormField
              text="Address"
              value={form.address}
              handleChangeText={(e) => setForm({ ...form, address: e })}
              otherStyles="mt-7"
              inputStyles="font-pmedium text-base text-gray-400"
              placeholder="Enter Your Address"
            />

            <FormField
              text="City"
              value={form.city}
              handleChangeText={(e) => setForm({ ...form, city: e })}
              otherStyles="mt-7"
              inputStyles="font-pmedium text-base text-gray-400"
              placeholder="Enter Your City"
            />

            <FormField
              text="State"
              value={form.state}
              handleChangeText={(e) => setForm({ ...form, state: e })}
              otherStyles="mt-7"
              inputStyles="font-pmedium text-base text-gray-400"
              placeholder="Enter Your State"
            />

            <FormField
              text="Pincode"
              value={form.pin}
              handleChangeText={(e) => setForm({ ...form, pin: e })}
              otherStyles="mt-7"
              inputStyles="font-pmedium text-base text-gray-400"
              keyboardType="number-pad"
              placeholder="Enter Your Pincode"
              maxLength={6}
            />

            <CustomButton
              text="Sign Up"
              handlePress={() => {
                if (
                  !form.name ||
                  !form.gender ||
                  !form.dob ||
                  !form.mobno ||
                  form.mobno.length !== 10 ||
                  !form.email ||
                  !form.idType ||
                  !form.idNo ||
                  !form.address ||
                  !form.city ||
                  !form.state ||
                  !form.pin ||
                  form.pin.length !== 6
                ) {
                  Alert.alert('Error', 'Please fill the fields corectly');
                  return;
                }
              }}
              containerStyles="mt-7 min-h-[62px]"
              isLoading={isSubmitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default guestRegistration;
