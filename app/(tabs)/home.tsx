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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { icons, images, status } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useRouter } from 'expo-router';
import CustomHomeIcon from '../../components/CustomHomeIcon';

const quotes = [
  {
    quote:
      'Every living being is capable of becoming Self-realised; one who realises this is himself bound to become a Realised Soul',
    author: 'Shrimad Rajchandra',
  },
  {
    quote:
      'The greatest glory in living lies not in never falling, but in rising every time we fall.',
    author: 'Nelson Mandela',
  },
  {
    quote: 'The way to get started is to quit talking and begin doing.',
    author: 'Walt Disney',
  },
  {
    quote: "Your time is limited, so don't waste it living someone else's life.",
    author: 'Steve Jobs',
  },
  {
    quote: 'If life were predictable it would cease to be life, and be without flavor.',
    author: 'Eleanor Roosevelt',
  },
  {
    quote:
      "If you look at what you have in life, you'll always have more. If you look at what you don't have in life, you'll never have enough.",
    author: 'Oprah Winfrey',
  },
  {
    quote:
      "If you set your goals ridiculously high and it's a failure, you will fail above everyone else's success.",
    author: 'James Cameron',
  },
  {
    quote: "Life is what happens when you're busy making other plans.",
    author: 'John Lennon',
  },
  {
    quote: 'Happiness is not something ready-made. It comes from your own actions.',
    author: 'Dalai Lama',
  },
  {
    quote: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
  },
];

const QuotesBanner = ({ user, images }: any) => {
  // Select a random quote when component renders
  // Using useMemo to ensure the quote only changes on re-render, not on every function call
  const randomQuote = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  }, []);

  return (
    <View className="w-full px-4">
      <ImageBackground className="h-[220px] w-full px-2" source={images.banner} resizeMode="cover">
        <Text className="px-4 pt-6 font-pbold text-lg text-secondary">
          JSDV, {user.issuedto.split(' ')[0]}!
        </Text>
        <Text className="max-w-[63%] px-4 pt-4 font-pregular" adjustsFontSizeToFit>
          "{randomQuote.quote}"
        </Text>
        <Text className="px-4 pt-2" adjustsFontSizeToFit>
          ~ {randomQuote.author}
        </Text>
      </ImageBackground>
    </View>
  );
};

const Home: React.FC = () => {
  const { user } = useGlobalContext();
  const router: any = useRouter();

  if (!user || !user.issuedto) {
    return (
      <SafeAreaView className="h-full items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-full bg-white" edges={['right', 'top', 'left']}>
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1" bounces={false}>
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
    </SafeAreaView>
  );
};

export default Home;
