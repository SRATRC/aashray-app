import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  RefreshControl,
  ScrollView,
  ImageSourcePropType,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomTabOverflow } from '@/src/components/TabBarBackground';
import HomeSection from '@/src/components/home/HomeSection';
import PendingPaymentAlert from '@/src/components/home/PendingPaymentAlert';
import ShortcutRow from '@/src/components/home/ShortcutRow';
import SocialRow from '@/src/components/home/SocialRow';
import UpcomingBookingsCarousel from '@/src/components/home/UpcomingBookingsCarousel';
import { icons, images, quotes } from '@/src/constants';
import { useAuthStore } from '@/src/stores';

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

// The home queries never refetch on their own: the global defaults disable
// refetch on mount/focus/reconnect and this tab stays mounted for the whole
// session. Pull-to-refresh is the member's manual way to get fresh data.
const HOME_QUERY_KEYS = [
  ['nextStay'],
  ['homeAdhyayans'],
  ['homeTravels'],
  ['homeUtsavs'],
  ['transactions'],
];

const Home: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const router: any = useRouter();
  const tabBarHeight = useBottomTabOverflow();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all(
        HOME_QUERY_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey }))
      );
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  if (!user || !user.issuedto) {
    return (
      <SafeAreaView className="h-full items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-full bg-gray-50" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{
          paddingBottom: (Platform.OS === 'ios' ? tabBarHeight : 0) + 48,
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

        {/* Your booking. Urgent first, then the stay itself. */}
        <View className="mt-6 w-full gap-y-3 px-4">
          <PendingPaymentAlert />
        </View>

        <UpcomingBookingsCarousel className="mt-3" />

        <HomeSection title="At the centre" className="mt-8 w-full">
          <ShortcutRow
            items={[
              {
                key: 'wifi',
                icon: icons.wifiHome as ImageSourcePropType,
                label: 'Wifi',
                onPress: () => router.push('/wifi'),
              },
              {
                key: 'menu',
                icon: icons.menuHome as ImageSourcePropType,
                label: 'Menu',
                onPress: () => router.push('/menu'),
              },
              {
                key: 'maintenance',
                icon: icons.maintenanceHome as ImageSourcePropType,
                label: 'Maintenance',
                onPress: () => router.push('/maintenanceRequestList'),
              },
              {
                key: 'payments',
                icon: icons.pendingPayment as ImageSourcePropType,
                label: 'Payments',
                onPress: () => router.push('/pendingPayments'),
              },
              {
                key: 'contact',
                icon: icons.contact as ImageSourcePropType,
                label: 'Contact',
                onPress: () => router.push('/contactInfo'),
              },
            ]}
          />
        </HomeSection>

        <HomeSection title="Follow us" className="mt-8 w-full">
          <SocialRow
            items={[
              {
                key: 'satshrut',
                icon: icons.satshrut as ImageSourcePropType,
                label: 'Satshrut',
                url: 'https://satshrut.vitraagvigyaan.org/',
              },
              {
                key: 'smilestones',
                icon: icons.smilestones as ImageSourcePropType,
                label: 'Smilestones',
                url: 'https://smilestones.vitraagvigyaan.org/',
              },
              {
                key: 'yt',
                icon: icons.vvYt as ImageSourcePropType,
                label: 'Youtube',
                url: 'https://youtube.com/@vitraagvigyaan',
              },
              {
                key: 'vvinsta',
                icon: icons.vvInsta as ImageSourcePropType,
                label: 'VV Insta',
                url: 'https://www.instagram.com/vitraag.vigyaan/',
              },
              {
                key: 'rcglobal',
                icon: icons.rcGlobalInsta as ImageSourcePropType,
                label: 'RC Global',
                url: 'https://www.instagram.com/researchcentre_global/',
              },
              {
                key: 'linkedin',
                icon: icons.rcLinkedin as ImageSourcePropType,
                label: 'LinkedIn',
                url: 'https://www.linkedin.com/company/researchcentre-global/',
              },
              {
                key: 'sparsh',
                icon: icons.sparshInsta as ImageSourcePropType,
                label: 'Sparsh',
                url: 'https://www.instagram.com/sparsh.international/',
              },
            ]}
          />
        </HomeSection>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;
