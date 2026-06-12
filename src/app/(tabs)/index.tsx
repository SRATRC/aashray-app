import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  ScrollView,
  Linking,
  ImageSourcePropType,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { SafeAreaView } from 'react-native-safe-area-context';

import CustomHomeIcon from '@/src/components/CustomHomeIcon';
import { useBottomTabOverflow } from '@/src/components/TabBarBackground';
import { icons, images, quotes } from '@/src/constants';
import { useAuthStore } from '@/src/stores';

const mmkv = new MMKV();

const QuotesBanner = ({ user, images }: any) => {
  const randomQuote = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  }, []);

  return (
    <View className="w-full px-4">
      <ImageBackground
        className="min-h-[220px] w-full px-2 py-8"
        source={images.banner}
        resizeMode="cover">
        <View className="flex-1 justify-center">
          <View>
            <Text
              className="px-4 pb-3 text-right font-pbold text-lg text-secondary"
              allowFontScaling={false}>
              JSDV, {user.issuedto.split(' ')[0]}!
            </Text>

            <Text
              className="ml-auto max-w-[60%] px-4 pb-2 text-right font-pregular text-base"
              adjustsFontSizeToFit
              minimumFontScale={0.4}
              allowFontScaling={false}>
              "{randomQuote.quote}"
            </Text>

            <Text className="px-4 text-right font-pmedium text-sm" allowFontScaling={false}>
              ~ {randomQuote.author}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const Home: React.FC = () => {
  const { user } = useAuthStore();
  const router: any = useRouter();
  const tabBarHeight = useBottomTabOverflow();
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);

  useEffect(() => {
    if (user && user.issuedto) {
      try {
        const isConfirmed = mmkv.getBoolean('whatsapp_confirmed');
        if (!isConfirmed) {
          setShowWhatsappModal(true);
        }
      } catch (err) {
        console.error('Failed to read whatsapp_confirmed from MMKV:', err);
      }
    }
  }, [user]);

  const handleConfirmYes = () => {
    try {
      mmkv.set('whatsapp_confirmed', true);
    } catch (err) {
      console.error('Failed to set whatsapp_confirmed in MMKV:', err);
    }
    setShowWhatsappModal(false);
  };

  const handleUpdateNo = () => {
    setShowWhatsappModal(false);
    router.push('/profile/profileDetails');
  };

  if (!user || !user.issuedto) {
    return (
      <SafeAreaView className="h-full items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-full bg-white" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'ios' ? tabBarHeight + 20 : 20,
        }}>
        <View className=" flex-row items-center justify-start px-4">
          <Image
            source={images.sratrcLogo as ImageSourcePropType}
            className="h-[60px] w-[150px] px-4"
            resizeMode="contain"
          />
        </View>

        {/* Banner */}
        <QuotesBanner user={user} images={images} />

        {/* Services */}
        <View className="mt-7 w-full">
          <Text className="px-4 font-pmedium text-lg text-black">Quick Access</Text>
          <View className="mt-3 flex-row flex-wrap gap-y-4 px-4">
            <CustomHomeIcon
              image={icons.wifiHome as ImageSourcePropType}
              title="Wifi"
              onPress={() => router.push('/wifi')}
            />
            <CustomHomeIcon
              image={icons.menuHome as ImageSourcePropType}
              title="Menu"
              onPress={() => router.push('/menu')}
            />
            <CustomHomeIcon
              image={icons.maintenanceHome as ImageSourcePropType}
              title="Maintenance"
              onPress={() => router.push('/maintenanceRequestList')}
            />
            <CustomHomeIcon
              image={icons.contact as ImageSourcePropType}
              title="Contact Info"
              onPress={() => router.push('/contactInfo')}
            />
            <CustomHomeIcon
              image={icons.support as ImageSourcePropType}
              title="Support"
              onPress={() => router.push('/support')}
            />
            <CustomHomeIcon
              image={icons.pendingPayment as ImageSourcePropType}
              title="Pending Payments"
              onPress={() => router.push('/pendingPayments')}
            />
          </View>
        </View>

        {/* Socials */}
        <View className="mt-7 w-full">
          <Text className="px-4 font-pmedium text-lg text-black">Checkout Our Social Media!</Text>
          <View className="mb-6 mt-3 flex-row flex-wrap gap-y-4 px-4">
            <CustomHomeIcon
              image={icons.satshrut as ImageSourcePropType}
              title="Satshrut"
              onPress={() => Linking.openURL('https://satshrut.vitraagvigyaan.org/')}
            />
            <CustomHomeIcon
              image={icons.smilestones as ImageSourcePropType}
              title="Smilestones"
              onPress={() => Linking.openURL('https://smilestones.vitraagvigyaan.org/')}
            />
            <CustomHomeIcon
              image={icons.vvYt as ImageSourcePropType}
              title="Youtube"
              onPress={() => Linking.openURL('https://youtube.com/@vitraagvigyaan')}
            />
            <CustomHomeIcon
              image={icons.vvInsta as ImageSourcePropType}
              title="VV Insta"
              onPress={() => Linking.openURL('https://www.instagram.com/vitraag.vigyaan/')}
            />
            <CustomHomeIcon
              image={icons.rcGlobalInsta as ImageSourcePropType}
              title="RC Global"
              onPress={() => Linking.openURL('https://www.instagram.com/researchcentre_global/')}
            />
            <CustomHomeIcon
              image={icons.rcLinkedin as ImageSourcePropType}
              title="LinkedIn"
              onPress={() =>
                Linking.openURL('https://www.linkedin.com/company/researchcentre-global/')
              }
            />
            <CustomHomeIcon
              image={icons.sparshInsta as ImageSourcePropType}
              title="Sparsh"
              onPress={() => Linking.openURL('https://www.instagram.com/sparsh.international/')}
            />
          </View>
        </View>
      </ScrollView>

      {/* WhatsApp verification modal */}
      <Modal
        visible={showWhatsappModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {}}>
        <View className="flex-1 items-center justify-center bg-black/45 px-6">
          <View className="w-full max-w-[340px] items-center rounded-3xl bg-white p-6 shadow-xl">
            {/* Green WhatsApp Circle Icon */}
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <FontAwesome name="whatsapp" size={36} color="#25D366" />
            </View>

            <Text className="mb-2 text-center font-psemibold text-xl text-gray-800">
              Is this your WhatsApp number?
            </Text>

            <Text className="mb-6 text-center font-pregular text-sm leading-5 text-gray-500">
              We send booking updates and instructions to WhatsApp.
            </Text>

            {/* Displaying user's mobile number in a neat capsule */}
            <View className="mb-8 rounded-2xl border border-gray-200/50 bg-gray-100 px-6 py-3">
              <Text className="font-psemibold text-lg tracking-wider text-gray-800">
                +91 {user?.mobno}
              </Text>
            </View>

            {/* Actions */}
            <View className="w-full flex-row gap-x-3">
              <TouchableOpacity
                className="h-12 flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white"
                onPress={handleUpdateNo}
                activeOpacity={0.7}>
                <Text className="font-psemibold text-base text-gray-600">No, Update</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="h-12 flex-1 items-center justify-center rounded-xl bg-[#25D366]"
                onPress={handleConfirmYes}
                activeOpacity={0.7}>
                <Text className="font-psemibold text-base text-white">Yes, Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Home;
