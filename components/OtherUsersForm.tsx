import { View, Text, Image, TouchableOpacity } from 'react-native';
import { colors, icons, dropdowns } from '../constants';
import { useQueries } from '@tanstack/react-query';
import { useGlobalContext } from '../context/GlobalProvider';
import React from 'react';
import FormField from './FormField';
import handleAPICall from '../utils/HandleApiCall';

interface OtherUsersFormProps {
  userForm: any;
  setUserForm: any;
  handleUserFormChange: any;
  addUserForm: any;
  removeUserForm: any;
  children?: any;
}

const OtherUsersForm: React.FC<OtherUsersFormProps> = ({
  userForm,
  setUserForm,
  handleUserFormChange,
  addUserForm,
  removeUserForm,
  children = () => null,
}) => {
  const { user } = useGlobalContext();

  const verifyUser = async (mobno: any) => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        '/mumukshu',
        {
          cardno: user.cardno,
          mobno: mobno,
        },
        null,
        (res: any) => {
          if (res.data) {
            setUserForm((prevForm: any) => {
              const updatedUsers = [...prevForm.users];
              const userIndex = updatedUsers.findIndex((user) => user.mobno === mobno);
              if (userIndex !== -1) {
                updatedUsers[userIndex] = {
                  ...res.data,
                  ...updatedUsers[userIndex],
                  mobno: updatedUsers[userIndex].mobno,
                };
              }
              return { ...prevForm, users: updatedUsers };
            });
          }
          resolve(res.data);
        },
        () => reject(new Error('Failed to fetch users'))
      );
    });
  };

  const userQueries: any = useQueries({
    queries: userForm.users.map((user: any) => ({
      queryKey: ['verifyUsers', user.mobno],
      queryFn: () => verifyUser(user.mobno),
      enabled: user.mobno?.length === 10,
      retry: false,
    })),
  });

  return (
    <View>
      {userForm.users.map((user: any, index: number) => {
        const {
          data,
          isLoading: isUserLoading,
          isError: isVerifyUserError,
        } = user.mobno?.length === 10
          ? userQueries[index]
          : { data: null, isLoading: false, isError: false };

        return (
          <View key={index} className="mt-8">
            <View className="flex flex-row justify-between">
              <Text className="font-psemibold text-base text-black underline">
                Details for User - {index + 1}
              </Text>
              {index !== 0 && (
                <TouchableOpacity className="mr-3 bg-white" onPress={() => removeUserForm(index)}>
                  <Image source={icons.remove} className="h-5 w-5" resizeMode="contain" />
                </TouchableOpacity>
              )}
            </View>

            <FormField
              text="Phone Number"
              value={user.mobno}
              handleChangeText={(e: string) => handleUserFormChange(index, 'mobno', e)}
              otherStyles="mt-7"
              inputStyles="font-pmedium text-base text-gray-400"
              keyboardType="number-pad"
              placeholder="Enter Phone Number of user"
              maxLength={10}
              containerStyles="bg-gray-100"
              additionalText={data?.issuedto}
            />

            {!data && !isUserLoading && user.mobno?.length === 10 && (
              <View>
                <FormField
                  text="Name of the User"
                  value={user.name}
                  autoCorrect={false}
                  handleChangeText={(e: string) => handleUserFormChange(index, 'name', e)}
                  otherStyles="mt-4"
                  inputStyles="font-pmedium text-base text-gray-400"
                  containerStyles="bg-gray-100"
                  keyboardType="default"
                  placeholder="Name of the User"
                />

                {/* <CustomDropdown
                  otherStyles="mt-7"
                  text={'Gender'}
                  placeholder={'Select Gender'}
                  data={dropdowns.GENDER_LIST}
                  value={user.gender}
                  setSelected={(val: string) => handleUserFormChange(index, 'gender', val)}
                />

                <CustomDropdown
                  otherStyles="mt-7"
                  text={'Guest Type'}
                  placeholder={'Select Guest Type'}
                  data={dropdowns.GUEST_TYPE_LIST}
                  value={user.type}
                  setSelected={(val: string) => handleUserFormChange(index, 'type', val)}
                /> */}
              </View>
            )}
            {children(index)}
          </View>
        );
      })}
      <TouchableOpacity
        className="mt-4 w-full flex-row items-center justify-start gap-x-1"
        onPress={addUserForm}>
        <Image
          source={icons.addon}
          tintColor={colors.black}
          className="h-4 w-4"
          resizeMode="contain"
        />
        <Text className="text-base text-black underline">Add More Users</Text>
      </TouchableOpacity>
    </View>
  );
};

export default OtherUsersForm;
