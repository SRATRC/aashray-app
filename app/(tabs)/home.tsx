import React, { useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  ScrollView,
  Linking,
  ImageSourcePropType,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Animated } from 'react-native';
import { icons, images, quotes, status } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useRouter } from 'expo-router';
import CustomHomeIcon from '../../components/CustomHomeIcon';

const QuotesBanner = ({ user, images }: any) => {
  const randomQuote = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  }, []);

  return (
    <View className="w-full px-4">
      <ImageBackground className="h-[220px] w-full px-2" source={images.banner} resizeMode="cover">
        <Text className="px-4 pt-6 text-right font-pbold text-lg text-secondary">
          JSDV, {user.issuedto.split(' ')[0]}!
        </Text>
        <Text className="ml-auto max-w-[60%] px-4 pt-4 text-right font-pregular text-base">
          "{randomQuote.quote}"
        </Text>
        <Text className="px-4 pt-2 text-right font-pmedium text-sm">~ {randomQuote.author}</Text>
      </ImageBackground>
    </View>
  );
};

const Home: React.FC = () => {
  const { user } = useGlobalContext();
  const router: any = useRouter();

  // Fade-in animation setup
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!user || !user.issuedto) {
    return (
      <SafeAreaView className="h-full items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-full bg-white" edges={['right', 'top', 'left']}>
      {/* Fade-in wrapper */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
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
              {user.res_status !== status.STATUS_RESIDENT && (
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
                image={icons.maintenanceHome as ImageSourcePropType}
                title={'Maintenance'}
                onPress={() => router.push('/maintenanceRequestList')}
              />
              <CustomHomeIcon
                image={icons.pendingPayment as ImageSourcePropType}
                title={'Pending Payments'}
                onPress={() => router.push('/pendingPayments')}
              />
              <CustomHomeIcon
                image={icons.contact as ImageSourcePropType}
                title={'Contact Info'}
                onPress={() => router.push('/contactInfo')}
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
                image={icons.sparshInsta as ImageSourcePropType}
                title={'Sparsh'}
                onPress={() => Linking.openURL('https://www.instagram.com/sparsh.international/')}
              />
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

export default Home;
