import { View, Text, Image, TouchableOpacity } from 'react-native';
import { colors, icons } from '../constants';
import { useQueries } from '@tanstack/react-query';
import { useGlobalContext } from '../context/GlobalProvider';
import React from 'react';
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
            setMumukshuForm((prevForm: any) => {
              const updatedMumukshus = [...prevForm.mumukshus];
              const mumukshuIndex = updatedMumukshus.findIndex(
                (mumukshu) => mumukshu.mobno === mobno
              );
              if (mumukshuIndex !== -1) {
                updatedMumukshus[mumukshuIndex] = {
                  ...updatedMumukshus[mumukshuIndex],
                  ...res.data,
                  mobno: mobno,
                };
              }
              return { ...prevForm, mumukshus: updatedMumukshus };
            });
          }
          resolve(res.data);
        },
        () => reject(new Error('Failed to fetch guests'))
      );
    });
  };

  const mumukshuQueries: any = useQueries({
    queries: mumukshuForm.mumukshus.map((mumukshu: any) => ({
      queryKey: ['verifyMumukshus', mumukshu.mobno],
      queryFn: () => verifyMumukshu(mumukshu.mobno),
      enabled: mumukshu.mobno?.length === 10,
      // staleTime: 1000 * 60 * 30,
      retry: false,
    })),
  });

  return (
    <View>
      {mumukshuForm.mumukshus.map((mumukshu: any, index: any) => {
        const {
          data,
          isLoading: isVerifyMumukshusLoading,
          isError: isVerifyMumukshusError,
        } = mumukshu.mobno?.length === 10
          ? mumukshuQueries[index]
          : { data: null, isLoading: false, isError: false };

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
