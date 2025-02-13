import { Text, View, Image, Platform, TouchableOpacity } from 'react-native';
import { colors, icons, images } from '../../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import Toast from 'react-native-toast-message';
import handleAPICall from '../../utils/HandleApiCall';

const Profile: React.FC = () => {
  const { user, removeItem } = useGlobalContext();
  const router: any = useRouter();

  const profileList: any = [
    {
      name: 'Profile Details',
      icon: icons.profileCircle,
      onPress: () => {
        router.push('/profile/profileDetails');
      },
    },
    {
      name: 'Transaction History',
      icon: icons.transactions,
      onPress: () => {
        router.push('/profile/transactions');
      },
    },
    {
      name: 'Logout',
      icon: icons.logout,
      onPress: async () => {
        try {
          const onSuccess = async (_data: any) => {
            removeItem('user');
            router.replace('/sign-in');
          };

          await handleAPICall(
            'GET',
            '/client/logout',
            { cardno: user.cardno },
            null,
            onSuccess,
            () => {}
          );
        } catch (error: any) {
          Toast.show({
            type: 'error',
            text1: 'An error occurred!',
            text2: error.message,
          });
        }
      },
    },
  ];

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      className={`mb-5 rounded-2xl p-4 ${
        Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400'
      } mx-4 flex flex-row items-center justify-between bg-white`}
      onPress={item.onPress}>
      <View className="flex-row items-center gap-x-4">
        <Image source={item.icon} className="h-6 w-6" resizeMode="contain" />
        <Text className="font-pregular text-base">{item.name}</Text>
      </View>
      <View className="rounded-lg bg-secondary-50 p-2">
        <Image source={icons.yellowArrowRight} className="h-3 w-3" resizeMode="contain" />
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View className="mb-10 mt-8 flex-col items-center justify-center">
      <TouchableOpacity onPress={() => router.push('/camera')}>
        <Image
          source={user.pfp ? { uri: user.pfp } : images.pfp}
          className="h-[150] w-[150] rounded-full"
          resizeMode="cover"
          style={{
            borderWidth: 2,
            borderColor: colors.orange,
            borderRadius: 100,
          }}
        />
      </TouchableOpacity>
      <Text className="mt-2 font-psemibold text-base">{user.issuedto}</Text>
    </View>
  );

  return (
    <SafeAreaView className="h-full bg-white" edges={['right', 'top', 'left']}>
      <View className="h-full w-full">
        <FlashList
          className="h-full py-2"
          showsVerticalScrollIndicator={false}
          data={profileList}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          estimatedItemSize={6}
          bounces={false}
        />
      </View>
    </SafeAreaView>
  );
};

export default Profile;
