import {
  View,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
  Alert
} from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { images } from '../../constants';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { useRouter } from 'expo-router';

const guestReferral = () => {
  const [form, setForm] = useState({
    referral: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

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
              text="Invite Code"
              value={form.referral}
              handleChangeText={(e) => setForm({ ...form, referral: e })}
              otherStyles="mt-7"
              placeholder="XXXXXX"
              autoCapitalize={'none'}
              autoComplete={'off'}
              autoCorrect={false}
              maxLength={6}
            />

            <CustomButton
              text="Sign Up"
              handlePress={() => {
                if (!form.referral || form.referral.length != 6) {
                  Alert.alert('Error', 'Please fill the fields corectly');
                  return;
                }
                router.push('/guestRegistration');
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

export default guestReferral;
