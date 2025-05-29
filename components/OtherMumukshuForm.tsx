import { View, Text, Image, TouchableOpacity } from 'react-native';
import { colors, icons } from '../constants';
import { useQueries } from '@tanstack/react-query';
import { useGlobalContext } from '../context/GlobalProvider';
import React, { useEffect } from 'react';
import FormField from './FormField';
import handleAPICall from '../utils/HandleApiCall';

interface OtherMumukshuFormProps {
  mumukshuForm: any;
  setMumukshuForm: any;
  handleMumukshuFormChange: any;
  addMumukshuForm: any;
  removeMumukshuForm: any;
  children?: any;
}

const OtherMumukshuForm: React.FC<OtherMumukshuFormProps> = ({
  mumukshuForm,
  setMumukshuForm,
  handleMumukshuFormChange,
  addMumukshuForm,
  removeMumukshuForm,
  children = () => null,
}) => {
  const { user } = useGlobalContext();

  const verifyMumukshu = async (mobno: any) => {
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
            resolve(res.data);
          } else {
            reject(new Error('Mumukshu not found'));
          }
        },
        () => {}, // on finally callback
        () => reject(new Error('Failed to fetch mumukshus'))
      );
    });
  };

  const mumukshuQueries: any = useQueries({
    queries: mumukshuForm.mumukshus.map((mumukshu: any) => ({
      queryKey: ['verifyMumukshus', mumukshu.mobno],
      queryFn: () => verifyMumukshu(mumukshu.mobno),
      enabled: mumukshu.mobno?.length === 10 && mumukshu.mobno !== '',
      retry: false,
    })),
  });

  // Update form when query data changes
  useEffect(() => {
    mumukshuQueries.forEach((query: any, index: number) => {
      if (query.data && mumukshuForm.mumukshus[index]) {
        const currentMumukshu = mumukshuForm.mumukshus[index];
        const shouldUpdate =
          !currentMumukshu.cardno || currentMumukshu.cardno !== query.data.cardno;

        if (shouldUpdate) {
          setMumukshuForm((prevForm: any) => {
            const updatedMumukshus = [...prevForm.mumukshus];
            updatedMumukshus[index] = {
              ...updatedMumukshus[index],
              ...query.data,
              mobno: mumukshuForm.mumukshus[index].mobno,
            };
            return { ...prevForm, mumukshus: updatedMumukshus };
          });
        }
      }
    });
  }, [mumukshuQueries.map((q) => q.data), mumukshuForm.mumukshus.length]);

  // Helper function to get API error message
  const getErrorMessage = (error: any) => {
    if (error?.message) {
      return error.message;
    }
    return 'Unable to verify this phone number';
  };

  return (
    <View>
      {mumukshuForm.mumukshus.map((mumukshu: any, index: any) => {
        const {
          data,
          isLoading: isVerifyMumukshusLoading,
          isError: isVerifyMumukshusError,
          error,
        } = mumukshu.mobno?.length === 10
          ? mumukshuQueries[index]
          : { data: null, isLoading: false, isError: false, error: null };

        // Only show API errors, not validation errors
        const shouldShowError = isVerifyMumukshusError;

        const errorMessage = shouldShowError ? getErrorMessage(error) : undefined;

        return (
          <View key={index} className="mt-8">
            <View className="flex flex-row justify-between">
              <Text className="font-psemibold text-base text-black underline">
                Details for Mumukshu - {index + 1}
              </Text>
              {index !== 0 && (
                <TouchableOpacity
                  className="mr-3 bg-white"
                  onPress={() => removeMumukshuForm(index)}>
                  <Image source={icons.remove} className="h-5 w-5" resizeMode="contain" />
                </TouchableOpacity>
              )}
            </View>

            <FormField
              text="Phone Number"
              value={mumukshu.mobno}
              handleChangeText={(e: any) => handleMumukshuFormChange(index, 'mobno', e)}
              otherStyles="mt-7"
              inputStyles="font-pmedium text-base"
              keyboardType="number-pad"
              placeholder="Enter Mumukshu's Phone Number"
              maxLength={10}
              containerStyles="bg-gray-100"
              additionalText={data?.issuedto}
              error={shouldShowError}
              errorMessage={errorMessage}
              isLoading={isVerifyMumukshusLoading}
            />
            {children(index)}
          </View>
        );
      })}
      <TouchableOpacity
        className="mt-4 w-full flex-row items-center justify-start gap-x-1"
        onPress={addMumukshuForm}>
        <Image
          source={icons.addon}
          tintColor={colors.black}
          className="h-4 w-4"
          resizeMode="contain"
        />
        <Text className="text-base text-black underline">Add More Mumukshu's</Text>
      </TouchableOpacity>
    </View>
  );
};

export default OtherMumukshuForm;
