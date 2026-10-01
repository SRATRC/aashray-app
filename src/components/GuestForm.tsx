import React, { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { colors, icons, dropdowns } from '../constants';
import { useQueries } from '@tanstack/react-query';
import { useAuthStore } from '@/src/stores';
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
  /**
   * A primitive derived from anything the per-row `children` extras read BESIDES
   * the row itself (a locations list, a package list). Rows are memoized and
   * deliberately ignore the `children` function's identity — so when only such
   * outside state changes, this key changing is what re-renders them. Callers
   * whose extras depend only on the row can omit it.
   */
  extrasKey?: unknown;
}

interface GuestRowProps {
  guest: any;
  index: number;
  queryData: any;
  isLoading: boolean;
  isError: boolean;
  error: any;
  handleGuestFormChange: any;
  removeGuestForm: any;
  children: any;
  extrasKey?: unknown;
}

const getErrorMessage = (error: any) => error?.message || 'Unable to verify this phone number';

const GuestRow = React.memo<GuestRowProps>(
  ({
    guest,
    index,
    queryData,
    isLoading: isVerifyGuestsLoading,
    isError: isVerifyGuestsError,
    error,
    handleGuestFormChange,
    removeGuestForm,
    children,
  }) => {
    const guestData = queryData?.data;
    const isNewGuest = queryData?.isNewGuest;
    const shouldShowError = isVerifyGuestsError;
    const errorMessage = shouldShowError ? getErrorMessage(error) : undefined;
    const shouldShowAdditionalFields =
      (isNewGuest || (!guestData && !isVerifyGuestsLoading && !isVerifyGuestsError)) &&
      guest.mobno?.length === 10;

    return (
      <View className="mt-8">
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
          additionalText={guestData?.issuedto}
          error={shouldShowError}
          errorMessage={errorMessage}
          isLoading={isVerifyGuestsLoading}
        />

        {isNewGuest && (
          <View className="mt-2 rounded bg-blue-50 p-2">
            <Text className="text-sm text-blue-700">
              Guest not found. Please fill in the details to create a new guest.
            </Text>
          </View>
        )}

        {shouldShowAdditionalFields && (
          <View>
            <FormField
              text="Guest Name"
              value={guest.name}
              autoCorrect={false}
              handleChangeText={(e: string) => handleGuestFormChange(index, 'name', e)}
              otherStyles="mt-4"
              inputStyles="font-pmedium text-base"
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
  },
  (previous, next) =>
    previous.guest === next.guest &&
    previous.index === next.index &&
    previous.queryData === next.queryData &&
    previous.isLoading === next.isLoading &&
    previous.isError === next.isError &&
    previous.error === next.error &&
    previous.handleGuestFormChange === next.handleGuestFormChange &&
    previous.removeGuestForm === next.removeGuestForm &&
    // `children` is deliberately NOT compared (it is a fresh closure every
    // render); extrasKey stands in for whatever outside state it reads.
    previous.extrasKey === next.extrasKey
);

const GuestForm: React.FC<GuestFormProps> = ({
  guestForm,
  setGuestForm,
  handleGuestFormChange,
  addGuestForm,
  removeGuestForm,
  children = () => null,
  extrasKey,
}) => {
  const user = useAuthStore((state) => state.user);

  const verifyGuest = async (
    mobno: string
  ): Promise<{ data?: any; isNewGuest?: boolean; error?: string }> => {
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
            resolve({ data: res.data });
          } else {
            // Guest not found - this is a valid scenario for creating new guest
            resolve({ isNewGuest: true });
          }
        },
        () => {}, // on finally callback
        (errorDetails: any) => reject(new Error(errorDetails?.message))
      );
    });
  };

  const guestQueries: any = useQueries({
    queries: guestForm.guests.map((guest: any, index: number) => ({
      queryKey: ['verifyGuests', guest.mobno, index],
      queryFn: () => verifyGuest(guest.mobno),
      enabled: guest.mobno?.length === 10,
      retry: false,
    })),
  });

  // Update form when query data changes
  useEffect(() => {
    guestQueries.forEach((query: any, index: number) => {
      if (query.data?.data && guestForm.guests[index]) {
        const currentGuest = guestForm.guests[index];
        const shouldUpdate = !currentGuest.cardno || currentGuest.cardno !== query.data.data.cardno;

        if (shouldUpdate) {
          setGuestForm((prevForm: any) => {
            const updatedGuests = [...prevForm.guests];
            // The fetched record wins (same order OtherMumukshuForm uses): the
            // row's template still carries empty strings for name/gender, and
            // spreading the row last clobbered the verified guest's data with
            // them. Only the phone number stays as typed — it is what found
            // the record.
            updatedGuests[index] = {
              ...updatedGuests[index],
              ...query.data.data,
              mobno: updatedGuests[index].mobno,
            };
            return { ...prevForm, guests: updatedGuests };
          });
        }
      }
    });
    // Keyed on a primitive: a mapped array literal is a new reference every
    // render, which made this effect run after every keystroke.
  }, [guestQueries.map((q: any) => q.data?.data?.cardno).join(','), guestForm.guests.length]);

  return (
    <View>
      {guestForm.guests.map((guest: any, index: number) => {
        const query = guest.mobno?.length === 10 ? guestQueries[index] : undefined;

        return (
          <GuestRow
            key={index}
            guest={guest}
            index={index}
            queryData={query?.data}
            isLoading={query?.isLoading ?? false}
            isError={query?.isError ?? false}
            error={query?.error}
            handleGuestFormChange={handleGuestFormChange}
            removeGuestForm={removeGuestForm}
            children={children}
            extrasKey={extrasKey}
          />
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
