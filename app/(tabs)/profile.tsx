import React, { useState } from 'react';
import {
  Text,
  View,
  Platform,
  TouchableOpacity,
  Modal,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  RefreshControl,
} from 'react-native';
import { colors, icons, images } from '../../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import Toast from 'react-native-toast-message';
import handleAPICall from '../../utils/HandleApiCall';
import FormField from '~/components/FormField';

const Profile: React.FC = () => {
  const { user, removeItem, setUser, setCurrentUser } = useGlobalContext();
  const router: any = useRouter();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleResetPassword = async () => {
    // Validate inputs
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Toast.show({
        type: 'error',
        text1: 'All fields are required',
        swipeable: false,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Passwords do not match',
        text2: 'New password and confirmation must match',
        swipeable: false,
      });
      return;
    }

    setIsLoading(true);

    const onSuccess = () => {
      setIsLoading(false);
      setPasswordModalVisible(false);
      // Clear inputs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      Toast.show({
        type: 'success',
        text1: 'Password updated successfully',
        swipeable: false,
      });
    };

    await handleAPICall(
      'POST',
      '/client/updatePassword',
      null,
      {
        cardno: user?.cardno,
        current_password: currentPassword.trim(),
        new_password: newPassword.trim(),
      },
      onSuccess,
      () => {
        setIsLoading(false);
      }
    );
  };

  const closeModal = () => {
    setPasswordModalVisible(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    Keyboard.dismiss();
  };

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
      name: 'Reset Password',
      icon: icons.resetPassword,
      onPress: () => {
        setPasswordModalVisible(true);
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
            swipeable: false,
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
          source={user.pfp}
          className="h-[150] w-[150] rounded-full"
          resizeMode="cover"
          style={{
            borderWidth: 2,
            borderColor: colors.orange,
            borderRadius: 100,
            width: 150,
            height: 150,
          }}
        />
      </TouchableOpacity>
      <Text className="mt-2 font-psemibold text-base">{user.issuedto}</Text>

      <View className="mt-6 w-full px-6">
        <View
          className={`rounded-xl bg-white p-4 ${
            Platform.OS === 'ios' ? 'shadow-sm shadow-gray-200' : 'shadow-md shadow-gray-300'
          }`}
          style={{
            borderWidth: 1,
            borderColor: '#E5E7EB',
          }}>
          <Text className="mb-3 font-psemibold text-base text-gray-800">Account Balance</Text>

          <View className="flex-row items-center justify-between">
            <View className="flex-1 items-center">
              <View className="mb-2 flex-row items-center">
                <View className="mr-2 rounded-md bg-gray-50 p-1.5">
                  <Image source={icons.coin} className="h-4 w-4" resizeMode="contain" />
                </View>
                <View>
                  <Text className="font-psemibold text-lg text-gray-900">
                    {user?.credits?.room || 0}
                  </Text>
                  <Text className="-mt-1 font-pmedium text-xs text-gray-600">Room</Text>
                </View>
              </View>
            </View>

            <View className="mx-3 h-8 w-px bg-gray-200" />

            <View className="flex-1 items-center">
              <View className="mb-2 flex-row items-center">
                <View className="mr-2 rounded-md bg-gray-50 p-1.5">
                  <Image source={icons.coin} className="h-4 w-4" resizeMode="contain" />
                </View>
                <View>
                  <Text className="font-psemibold text-lg text-gray-900">
                    {user?.credits?.travel || 0}
                  </Text>
                  <Text className="-mt-1 font-pmedium text-xs text-gray-600">Travel</Text>
                </View>
              </View>
            </View>
          </View>

          <View
            className="mt-3 flex-row items-center justify-between pt-3"
            style={{
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
            }}>
            <Text className="font-pmedium text-sm text-gray-700">Total Available</Text>
            <Text className="font-psemibold text-base text-gray-900">
              {(user?.credits?.room || 0) + (user?.credits?.travel || 0)} Credits
            </Text>
          </View>
        </View>
      </View>
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
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={async () => {
                setIsRefreshing(true);
                await handleAPICall(
                  'GET',
                  '/profile',
                  { cardno: user.cardno },
                  null,
                  (data: any) => {
                    setUser((prev: any) => {
                      const updatedUser = { ...prev, ...data.data };
                      setCurrentUser(updatedUser);
                      return updatedUser;
                    });
                  },
                  () => {
                    setIsRefreshing(false);
                  }
                );
              }}
            />
          }
        />

        <Modal
          animationType="slide"
          transparent={true}
          visible={passwordModalVisible}
          onRequestClose={closeModal}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View className="flex-1 items-center justify-center bg-black/50">
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View className="max-h-[80%] w-[90%] rounded-xl bg-white">
                    <ScrollView
                      contentContainerStyle={{ flexGrow: 1 }}
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={false}>
                      <View className="p-6">
                        <Text className="mb-5 text-center font-psemibold text-xl">
                          Reset Password
                        </Text>

                        <FormField
                          text="Current Password"
                          value={currentPassword}
                          placeholder="Enter current password"
                          handleChangeText={setCurrentPassword}
                          otherStyles="mb-4"
                          containerStyles="bg-white border border-gray-300"
                          inputStyles="font-pmedium text-base text-black"
                          isPassword={true}
                        />

                        <FormField
                          text="New Password"
                          value={newPassword}
                          placeholder="Enter new password"
                          handleChangeText={setNewPassword}
                          otherStyles="mb-4"
                          containerStyles="bg-white border border-gray-300"
                          inputStyles="font-pmedium text-base text-black"
                          isPassword={true}
                        />

                        <FormField
                          text="Confirm Password"
                          value={confirmPassword}
                          placeholder="Confirm new password"
                          handleChangeText={setConfirmPassword}
                          otherStyles="mb-6"
                          containerStyles="bg-white border border-gray-300"
                          inputStyles="font-pmedium text-base text-black"
                          isPassword={true}
                        />

                        <View className="flex-row justify-between">
                          <TouchableOpacity
                            className="mr-2 h-12 flex-1 items-center justify-center rounded-lg border border-gray-300"
                            onPress={closeModal}>
                            <Text className="font-pregular text-gray-700">Cancel</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            className={`ml-2 h-12 flex-1 items-center justify-center rounded-lg ${isLoading ? 'bg-gray-400' : 'bg-[#FF9500]'}`}
                            onPress={handleResetPassword}
                            disabled={isLoading}>
                            <Text className="font-psemibold text-white">
                              {isLoading ? 'Updating...' : 'Update Password'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </ScrollView>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default Profile;
