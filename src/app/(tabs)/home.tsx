import React, { useMemo } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { icons, images, quotes, status } from '@/src/constants';
import { useAuthStore } from '@/src/stores';
import { useBottomTabOverflow } from '@/src/components/TabBarBackground';
import CustomHomeIcon from '@/src/components/CustomHomeIcon';

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
            {![status.STATUS_SEVA_KUTIR].includes(user.res_status) && (
              <CustomHomeIcon
                image={icons.wifiHome as ImageSourcePropType}
                title={'Wifi'}
                onPress={() => router.push('/wifi')}
              />
            )}
            <CustomHomeIcon
              image={icons.menuHome as ImageSourcePropType}
              title={'Menu'}
              onPress={() => router.push('/menu')}
            />
            <CustomHomeIcon
              image={icons.contact as ImageSourcePropType}
              title={'Contact Info'}
              onPress={() => router.push('/contactInfo')}
            />
            <CustomHomeIcon
              image={icons.support as ImageSourcePropType}
              title={'Support'}
              onPress={() => router.push('/support')}
            />
            <CustomHomeIcon
              image={icons.pendingPayment as ImageSourcePropType}
              title={'Pending Payments'}
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
              title={'Satshrut'}
              onPress={() => Linking.openURL('https://satshrut.vitraagvigyaan.org/')}
            />
            <CustomHomeIcon
              image={icons.smilestones as ImageSourcePropType}
              title={'Smilestones'}
              onPress={() => Linking.openURL('https://smilestones.vitraagvigyaan.org/')}
            />
            <CustomHomeIcon
              image={icons.vvYt as ImageSourcePropType}
              title={'Youtube'}
              onPress={() => Linking.openURL('https://youtube.com/@vitraagvigyaan')}
            />
            <CustomHomeIcon
              image={icons.vvInsta as ImageSourcePropType}
              title={'VV Insta'}
              onPress={() => Linking.openURL('https://www.instagram.com/vitraag.vigyaan/')}
            />
            <CustomHomeIcon
              image={icons.rcGlobalInsta as ImageSourcePropType}
              title={'RC Global'}
              onPress={() => Linking.openURL('https://www.instagram.com/researchcentre_global/')}
            />
            <CustomHomeIcon
              image={icons.rcLinkedin as ImageSourcePropType}
              title={'LinkedIn'}
              onPress={() =>
                Linking.openURL('https://www.linkedin.com/company/researchcentre-global/')
              }
            />
            <CustomHomeIcon
              image={icons.sparshInsta as ImageSourcePropType}
              title={'Sparsh'}
              onPress={() => Linking.openURL('https://www.instagram.com/sparsh.international/')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;
