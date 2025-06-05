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
  StatusBar,
} from 'react-native';
import { icons } from '../../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import handleAPICall from '../../utils/HandleApiCall';
import FormField from '~/components/FormField';
import CustomModal from '~/components/CustomModal';

const Profile: React.FC = () => {
  const { user, removeItem, setUser, setCurrentUser } = useGlobalContext();
  const router: any = useRouter();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [creditsInfoModalVisible, setCreditsInfoModalVisible] = useState(false);

  const handleResetPassword = async () => {
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

  const closePasswordModal = () => {
    setPasswordModalVisible(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    Keyboard.dismiss();
  };

  const openImageModal = () => {
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
  };

  const openCamera = () => {
    setImageModalVisible(false);
    router.push('/camera');
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
      <View style={{ position: 'relative' }}>
        <TouchableOpacity onPress={openImageModal}>
          <Image
            source={{ uri: user.pfp }}
            className="h-[150] w-[150] rounded-full border-2 border-secondary"
            resizeMode="cover"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={openCamera}
          style={{
            position: 'absolute',
            bottom: 5,
            right: 5,
            backgroundColor: '#FF9500',
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}
          activeOpacity={0.8}>
          <Feather name="edit-2" size={14} color="white" />
        </TouchableOpacity>
      </View>

      <Text className="mt-2 font-psemibold text-base">{user.issuedto}</Text>

      <View className="mt-6 w-full px-6">
        <View
          className={`rounded-xl bg-white p-5 ${
            Platform.OS === 'ios' ? 'shadow-sm shadow-gray-200' : 'shadow-md shadow-gray-300'
          }`}
          style={{
            borderWidth: 1,
            borderColor: '#E5E7EB',
          }}>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-psemibold text-lg text-gray-800">Account Balance</Text>
            <TouchableOpacity
              onPress={() => setCreditsInfoModalVisible(true)}
              className="rounded-full bg-gray-100 p-2"
              activeOpacity={0.7}>
              <Feather name="help-circle" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap">
            <View className="mb-4 w-1/2 pr-2">
              <View className="rounded-lg bg-gray-50 p-4">
                <View className="mb-2 flex-row items-center">
                  <View className="mr-3 rounded-md bg-white p-2">
                    <Image source={icons.coin} className="h-5 w-5" resizeMode="contain" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-pmedium text-xs text-gray-600">Room</Text>
                    <Text className="font-psemibold text-xl text-gray-900">
                      {user?.credits?.room || 0}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="mb-4 w-1/2 pl-2">
              <View className="rounded-lg bg-gray-50 p-4">
                <View className="mb-2 flex-row items-center">
                  <View className="mr-3 rounded-md bg-white p-2">
                    <Image source={icons.coin} className="h-5 w-5" resizeMode="contain" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-pmedium text-xs text-gray-600">Travel</Text>
                    <Text className="font-psemibold text-xl text-gray-900">
                      {user?.credits?.travel || 0}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="w-1/2 pr-2">
              <View className="rounded-lg bg-gray-50 p-4">
                <View className="mb-2 flex-row items-center">
                  <View className="mr-3 rounded-md bg-white p-2">
                    <Image source={icons.coin} className="h-5 w-5" resizeMode="contain" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-pmedium text-xs text-gray-600">Utsav</Text>
                    <Text className="font-psemibold text-xl text-gray-900">
                      {user?.credits?.utsav || 0}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="w-1/2 pl-2">
              <View className="rounded-lg bg-gray-50 p-4">
                <View className="mb-2 flex-row items-center">
                  <View className="mr-3 rounded-md bg-white p-2">
                    <Image source={icons.coin} className="h-5 w-5" resizeMode="contain" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-pmedium text-xs text-gray-600">Food</Text>
                    <Text className="font-psemibold text-xl text-gray-900">
                      {user?.credits?.food || 0}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View
            className="mt-4 flex-row items-center justify-between rounded-lg bg-secondary-50 p-4"
            style={{
              borderWidth: 1,
              borderColor: '#FED7AA',
            }}>
            <Text className="font-pmedium text-sm text-gray-700">Total Available</Text>
            <Text className="font-psemibold text-lg text-gray-900">
              {(user?.credits?.room || 0) +
                (user?.credits?.travel || 0) +
                (user?.credits?.utsav || 0) +
                (user?.credits?.food || 0)}{' '}
              Credits
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
          animationType="fade"
          transparent={false}
          visible={imageModalVisible}
          onRequestClose={closeImageModal}
          statusBarTranslucent={true}>
          <View className="flex-1 bg-black">
            <View
              className="absolute left-0 right-0 top-0"
              style={{
                height: Platform.OS === 'ios' ? 120 : 100,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                zIndex: 20,
              }}>
              <View
                className="flex-row items-center justify-between px-6"
                style={{
                  paddingTop: Platform.OS === 'ios' ? 60 : 45,
                  marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0,
                }}>
                <TouchableOpacity
                  onPress={closeImageModal}
                  className="rounded-full p-3"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                    width: 44,
                    height: 44,
                  }}
                  activeOpacity={0.8}>
                  <View className="flex-1 items-center justify-center">
                    <View style={{ position: 'relative', width: 18, height: 18 }}>
                      <View
                        style={{
                          position: 'absolute',
                          top: 8,
                          left: 2,
                          width: 14,
                          height: 2,
                          backgroundColor: '#ffffff',
                          borderRadius: 1,
                          transform: [{ rotate: '45deg' }],
                        }}
                      />
                      <View
                        style={{
                          position: 'absolute',
                          top: 8,
                          left: 2,
                          width: 14,
                          height: 2,
                          backgroundColor: '#ffffff',
                          borderRadius: 1,
                          transform: [{ rotate: '-45deg' }],
                        }}
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={openCamera}
                  className="rounded-full px-6 py-3"
                  style={{
                    backgroundColor: '#FF9500',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    shadowColor: '#FF9500',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                  activeOpacity={0.9}>
                  <Text className="font-psemibold text-base text-white">Edit Photo</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-1 items-center justify-center px-4">
              <Image
                className="h-[250px] w-[250px] rounded-full border-2 border-secondary"
                source={{ uri: user.pfp }}
                resizeMode="cover"
              />

              <View className="mt-8 items-center">
                <Text className="text-center font-psemibold text-2xl text-white">
                  {user.issuedto}
                </Text>
                <View
                  className="mt-2 h-0.5 w-16"
                  style={{
                    backgroundColor: '#FF9500',
                    borderRadius: 2,
                  }}
                />
              </View>
            </View>

            <TouchableWithoutFeedback onPress={closeImageModal}>
              <View className="absolute inset-0" style={{ backgroundColor: 'transparent' }} />
            </TouchableWithoutFeedback>
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          statusBarTranslucent={true}
          visible={passwordModalVisible}
          onRequestClose={closePasswordModal}>
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
                            onPress={closePasswordModal}>
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

        <CustomModal
          visible={creditsInfoModalVisible}
          onClose={() => setCreditsInfoModalVisible(false)}
          title="About Credits"
          btnText="Got it"
          scrollable={true}
          showCloseButton={true}>
          <>
            <View className="mb-4">
              <Text className="mb-2 font-psemibold text-base text-gray-800">Credit Value</Text>
              <Text className="font-pregular text-sm leading-5 text-gray-600">1 Credit = ₹1</Text>
            </View>
            <View className="mb-4">
              <Text className="mb-2 font-psemibold text-base text-gray-800">
                How to get Credits?
              </Text>
              <Text className="font-pregular text-sm leading-5 text-gray-600">
                You can earn credits only when a booking is canceled after the payment for that
                booking has been completed.
              </Text>
            </View>
            <View>
              <Text className="mb-2 font-psemibold text-base text-gray-800">How to Use?</Text>
              <Text className="font-pregular text-sm leading-5 text-gray-600">
                When you make a booking for a Room, Travel, Utsav, or Guest Food, any available
                credits in your account will be automatically applied at checkout for respective
                booking. These credits cannot be cashed out and can only be used to reduce the cost
                of your bookings.
              </Text>
            </View>
          </>
        </CustomModal>
      </View>
    </SafeAreaView>
  );
};

export default Profile;
