import { View, Text, Image, TouchableOpacity } from 'react-native';
import { colors, icons, dropdowns } from '../constants';
import { useQueries } from '@tanstack/react-query';
import { useGlobalContext } from '../context/GlobalProvider';
import React from 'react';
import FormField from './FormField';
import handleAPICall from '../utils/HandleApiCall';
import CustomSelectBottomSheet from './CustomSelectBottomSheet';

interface GuestFormProps {
  guestForm: any;
  setGuestForm: any;
  handleGuestFormChange: any;
  addGuestForm: any;
  removeGuestForm: any;
  children?: any;
}

const GuestForm: React.FC<GuestFormProps> = ({
  guestForm,
  setGuestForm,
  handleGuestFormChange,
  addGuestForm,
  removeGuestForm,
  children = () => null,
}) => {
  const { user } = useGlobalContext();

  const verifyGuest = async (mobno: string): Promise<Partial<any> | null> => {
    return new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        `/guest/check/${mobno}`,
        {
          cardno: user.cardno,
        },
        null,
        (res: any) => {
          if (res.data) {
            setGuestForm((prevForm: any) => {
              const updatedGuests = [...prevForm.guests];
              const guestIndex = updatedGuests.findIndex((guest) => guest.mobno === mobno);
              if (guestIndex !== -1) {
                updatedGuests[guestIndex] = {
                  ...res.data,
                  ...updatedGuests[guestIndex],
                  mobno: updatedGuests[guestIndex].mobno,
                };
              }
              return { ...prevForm, guests: updatedGuests };
            });
          }
          resolve(res.data);
        },
        () => reject(new Error('Failed to fetch guests'))
      );
    });
  };

  const guestQueries: any = useQueries({
    queries: guestForm.guests.map((guest: any) => ({
      queryKey: ['verifyGuests', guest.mobno],
      queryFn: () => verifyGuest(guest.mobno),
      enabled: guest.mobno?.length === 10,
      retry: false,
    })),
  });

  return (
    <View>
      {guestForm.guests.map((guest: any, index: number) => {
        const {
          data,
          isLoading: isVerifyGuestsLoading,
          isError: isVerifyGuestsError,
        } = guest.mobno?.length === 10
          ? guestQueries[index]
          : { data: null, isLoading: false, isError: false };

        return (
          <View key={index} className="mt-8">
            <View className="flex flex-row justify-between">
              <Text className="font-psemibold text-base text-black underline">
                Details for Guest - {index + 1}
              </Text>
              {index !== 0 && (
                <TouchableOpacity className="mr-3 bg-white" onPress={() => removeGuestForm(index)}>
                  <Image source={icons.remove} className="h-5 w-5" resizeMode="contain" />
                </TouchableOpacity>
              )}
            </View>

            <FormField
              text="Phone Number"
              value={guest.mobno}
              handleChangeText={(e: string) => handleGuestFormChange(index, 'mobno', e)}
              otherStyles="mt-7"
              inputStyles="font-pmedium text-base"
              keyboardType="number-pad"
              placeholder="Enter Guest Phone Number"
              maxLength={10}
              containerStyles="bg-gray-100"
              additionalText={data?.issuedto}
            />

            {!data && !isVerifyGuestsLoading && guest.mobno?.length === 10 && (
              <View>
                <FormField
                  text="Guest Name"
                  value={guest.name}
                  autoCorrect={false}
                  handleChangeText={(e: string) => handleGuestFormChange(index, 'name', e)}
                  otherStyles="mt-4"
                  inputStyles="font-pmedium text-base"
                  containerStyles="bg-gray-100"
                  keyboardType="default"
                  placeholder="Guest Name"
                />

                <CustomSelectBottomSheet
                  className="mt-7"
                  label="Gender"
                  placeholder="Select Gender"
                  options={dropdowns.GENDER_LIST}
                  selectedValue={guest.gender}
                  onValueChange={(val) => handleGuestFormChange(index, 'gender', val)}
                />

                <CustomSelectBottomSheet
                  className="mt-7"
                  label="Guest Type"
                  placeholder="Select Guest Type"
                  options={dropdowns.GUEST_TYPE_LIST}
                  selectedValue={guest.type}
                  onValueChange={(val) => handleGuestFormChange(index, 'type', val)}
                />
              </View>
            )}
            {children(index)}
          </View>
        );
      })}
      <TouchableOpacity
        className="mt-4 w-full flex-row items-center justify-start gap-x-1"
        onPress={addGuestForm}>
        <Image
          source={icons.addon}
          tintColor={colors.black}
          className="h-4 w-4"
          resizeMode="contain"
        />
        <Text className="text-base text-black underline">Add More Guests</Text>
      </TouchableOpacity>
    </View>
  );
};

export default GuestForm;
