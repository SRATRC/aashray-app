import React, { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { colors, icons } from '../constants';
import { useQueries } from '@tanstack/react-query';
import { useAuthStore } from '@/src/stores';
import FormField from './FormField';
import handleAPICall from '../utils/HandleApiCall';
import { cleanPhoneNumber } from '../utils/phoneUtils';

interface OtherMumukshuFormProps {
  mumukshuForm: any;
  setMumukshuForm: any;
  handleMumukshuFormChange: any;
  addMumukshuForm: any;
  removeMumukshuForm: any;
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

interface MumukshuRowProps {
  mumukshu: any;
  index: number;
  queryData: any;
  isLoading: boolean;
  isError: boolean;
  error: any;
  handleMumukshuFormChange: any;
  removeMumukshuForm: any;
  children: any;
  extrasKey?: unknown;
}

const getErrorMessage = (error: any) => error?.message || 'Unable to verify this phone number';

const MumukshuRow = React.memo<MumukshuRowProps>(
  ({
    mumukshu,
    index,
    queryData,
    isLoading: isVerifyMumukshusLoading,
    isError: isVerifyMumukshusError,
    error,
    handleMumukshuFormChange,
    removeMumukshuForm,
    children,
  }) => {
    const shouldShowError = isVerifyMumukshusError;
    const errorMessage = shouldShowError ? getErrorMessage(error) : undefined;

    return (
      <View className="mt-8">
        <View className="flex flex-row justify-between">
          <Text className="font-psemibold text-base text-black underline">
            Details for Mumukshu - {index + 1}
          </Text>
          {index !== 0 && (
            <TouchableOpacity className="mr-3 bg-white" onPress={() => removeMumukshuForm(index)}>
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
          additionalText={queryData?.issuedto}
          error={shouldShowError}
          errorMessage={errorMessage}
          isLoading={isVerifyMumukshusLoading}
        />
        {children(index)}
      </View>
    );
  },
  (previous, next) =>
    previous.mumukshu === next.mumukshu &&
    previous.index === next.index &&
    previous.queryData === next.queryData &&
    previous.isLoading === next.isLoading &&
    previous.isError === next.isError &&
    previous.error === next.error &&
    previous.handleMumukshuFormChange === next.handleMumukshuFormChange &&
    previous.removeMumukshuForm === next.removeMumukshuForm &&
    // `children` is deliberately NOT compared (it is a fresh closure every
    // render); extrasKey stands in for whatever outside state it reads.
    previous.extrasKey === next.extrasKey
);

const OtherMumukshuForm: React.FC<OtherMumukshuFormProps> = ({
  mumukshuForm,
  setMumukshuForm,
  handleMumukshuFormChange,
  addMumukshuForm,
  removeMumukshuForm,
  children = () => null,
  extrasKey,
}) => {
  const user = useAuthStore((state) => state.user);

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
        (errorDetails: any) => reject(new Error(errorDetails?.message))
      );
    });
  };

  const mumukshuQueries: any = useQueries({
    queries: mumukshuForm.mumukshus.map((mumukshu: any, index: number) => ({
      queryKey: ['verifyMumukshus', mumukshu.mobno, index],
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
              mobno: updatedMumukshus[index].mobno,
            };
            return { ...prevForm, mumukshus: updatedMumukshus };
          });
        }
      }
    });
    // Keyed on a primitive: a mapped array literal is a new reference every
    // render, which made this effect run after every keystroke.
  }, [mumukshuQueries.map((q: any) => q.data?.cardno).join(','), mumukshuForm.mumukshus.length]);

  return (
    <View>
      {mumukshuForm.mumukshus.map((mumukshu: any, index: number) => {
        const query = mumukshu.mobno?.length === 10 ? mumukshuQueries[index] : undefined;

        return (
          <MumukshuRow
            key={index}
            mumukshu={mumukshu}
            index={index}
            queryData={query?.data}
            isLoading={query?.isLoading ?? false}
            isError={query?.isError ?? false}
            error={query?.error}
            handleMumukshuFormChange={handleMumukshuFormChange}
            removeMumukshuForm={removeMumukshuForm}
            children={children}
            extrasKey={extrasKey}
          />
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
