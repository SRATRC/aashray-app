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
// import CustomSelectBottomSheet from '~/components/CustomSelectBottomSheet';

const Home: React.FC = () => {
  const { user } = useGlobalContext();
  const router: any = useRouter();

  // const [selectedFruit, setSelectedFruit] = React.useState<string | null>(null);
  // const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);

  // const fruitOptions = [
  //   { key: 'Apple', value: 'apple' },
  //   { key: 'Banana', value: 'banana' },
  //   { key: 'Orange', value: 'orange' },
  //   { key: 'Strawberry', value: 'strawberry' },
  //   { key: 'Mango', value: 'mango' },
  //   { key: 'Pineapple', value: 'pineapple' },
  //   { key: 'Watermelon', value: 'watermelon' },
  //   { key: 'Grapes', value: 'grapes' },
  // ];

  // const categoryOptions = [
  //   { key: 'Electronics', value: 'electronics' },
  //   { key: 'Clothing', value: 'clothing' },
  //   { key: 'Food & Beverages', value: 'food' },
  //   { key: 'Home & Garden', value: 'home' },
  //   { key: 'Sports & Outdoors', value: 'sports' },
  //   { key: 'Books', value: 'books' },
  //   { key: 'Toys & Games', value: 'toys' },
  //   { key: 'Health & Beauty', value: 'health' },
  // ];

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
          resizeMode="cover">
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
        <View className="mt-3 flex w-full flex-row items-start">
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="mb-6 mt-3 flex-row items-baseline px-4">
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
        </ScrollView>
      </View>

      {/* <CustomSelectBottomSheet
        label="Choose a fruit"
        options={fruitOptions}
        selectedValue={selectedFruit}
        onValueChange={(value) => setSelectedFruit(value as string)}
        placeholder="Select a fruit"
        className="px-4"
      />

      <CustomSelectBottomSheet
        label="Choose categories"
        options={categoryOptions}
        selectedValues={selectedCategories}
        onValuesChange={(values) => setSelectedCategories(values as string[])}
        placeholder="Select categories"
        multiSelect={true}
        confirmButtonText="Apply Categories"
        maxSelectedDisplay={3}
        className="px-4"
      /> */}
    </SafeAreaView>
  );
};

export default Home;
