import React from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  ScrollView,
  Linking,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { icons, images, status } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useRouter } from 'expo-router';
import CustomHomeIcon from '../../components/CustomHomeIcon';

interface User {
  issuedto: string;
  res_status: string;
}

const Home: React.FC = () => {
  const { user } = useGlobalContext() as { user: User };
  const router: any = useRouter();

  return (
    <SafeAreaView className="h-full bg-white" edges={['right', 'top', 'left']}>
      <View className="justify-start px-4">
        <Image
          source={images.logo as ImageSourcePropType}
          className="h-[60px] w-[60px]"
          resizeMode="contain"
        />
      </View>

      {/* Banner */}
      <View className="w-full px-4">
        <ImageBackground
          className="h-[220px] w-full px-2"
          source={images.banner as ImageSourcePropType}
          resizeMode="contain">
          <Text className="px-4 pt-6 font-pbold text-lg text-secondary">
            JSDV, {user.issuedto.split(' ')[0]}!
          </Text>
          <Text className="max-w-[63%] px-4 pt-4 font-pregular text-xs">
            "Every living being is capable of becoming Self-realised; one who realises this is
            himself bound to become a Realised Soul"
          </Text>
          <Text className="px-4 pt-2">~ Shrimad Rajchandra</Text>
        </ImageBackground>
      </View>

      {/* Services */}
      <View className="mt-7 w-full px-4">
        <Text className="font-pmedium text-lg text-black">Our Services</Text>
        <View className="mt-3 flex w-full flex-row items-center">
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
        </View>
      </View>

      {/* Socials */}
      <View className="mt-7 w-full">
        <Text className="px-4 font-pmedium text-lg text-black">Checkout Our Social Media!</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="mb-6 mt-3 flex-row px-4">
            <CustomHomeIcon
              image={icons.satshrut as ImageSourcePropType}
              title={'Satshrut'}
              onPress={() => Linking.openURL('https://satshrut.vitraagvigyaan.org/')}
            />
            <CustomHomeIcon
              image={icons.smilestones as ImageSourcePropType}
              title={'Smilestones'}
              onPress={() =>
                Linking.openURL('https://datachef.in/smilestones/create_request_user.php')
              }
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
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Home;
