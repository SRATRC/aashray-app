import { View, Text, Image, TouchableOpacity } from 'react-native';
import { colors, icons, dropdowns } from '../constants';
import { useQueries } from '@tanstack/react-query';
import { useGlobalContext } from '../context/GlobalProvider';
import React, { useEffect } from 'react';
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
            resolve(res.data);
          } else {
            reject(new Error('Guest not found'));
          }
        },
        () => {}, // on finally callback
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

  // Update form when query data changes
  useEffect(() => {
    guestQueries.forEach((query: any, index: number) => {
      if (query.data && guestForm.guests[index]) {
        const currentGuest = guestForm.guests[index];
        const shouldUpdate = !currentGuest.cardno || currentGuest.cardno !== query.data.cardno;

        if (shouldUpdate) {
          setGuestForm((prevForm: any) => {
            const updatedGuests = [...prevForm.guests];
            updatedGuests[index] = {
              ...query.data,
              ...updatedGuests[index],
              mobno: updatedGuests[index].mobno,
            };
            return { ...prevForm, guests: updatedGuests };
          });
        }
      }
    });
  }, [guestQueries.map((q) => q.data), guestForm.guests.length]);

  // Helper function to get API error message
  const getErrorMessage = (error: any) => {
    if (error?.message) {
      return error.message;
    }
    return 'Unable to verify this phone number';
  };

  return (
    <View>
      {guestForm.guests.map((guest: any, index: number) => {
        const {
          data,
          isLoading: isVerifyGuestsLoading,
          isError: isVerifyGuestsError,
          error,
        } = guest.mobno?.length === 10
          ? guestQueries[index]
          : { data: null, isLoading: false, isError: false, error: null };

        // Only show API errors, not validation errors
        const shouldShowError = isVerifyGuestsError;

        const errorMessage = shouldShowError ? getErrorMessage(error) : undefined;

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
              error={shouldShowError}
              errorMessage={errorMessage}
              isLoading={isVerifyGuestsLoading}
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
