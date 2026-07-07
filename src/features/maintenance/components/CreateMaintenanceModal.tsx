// src/features/maintenance/components/CreateMaintenanceModal.tsx
import { useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCreateMaintenanceRequest } from '../api';
import { DEPARTMENT_LIST, type MaintenanceForm } from '../types';

import CustomAlert from '@/components/CustomAlert';
import CustomButton from '@/components/CustomButton';
import CustomSelectBottomSheet from '@/components/CustomSelectBottomSheet';
import FormField from '@/components/FormField';
import PageHeader from '@/components/PageHeader';
import { useAuthStore } from '@/stores';

const EMPTY_FORM: MaintenanceForm = {
  department: '',
  work_detail: '',
  area_of_work: '',
};

interface CreateMaintenanceModalProps {
  visible: boolean;
  onClose: () => void;
}

const CreateMaintenanceModal = ({ visible, onClose }: CreateMaintenanceModalProps) => {
  const { user } = useAuthStore();
  const [form, setForm] = useState<MaintenanceForm>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutate: createMaintenanceRequest } = useCreateMaintenanceRequest(user.cardno);

  const handleClose = () => {
    setForm(EMPTY_FORM);
    onClose();
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    if (
      form.department.trim() === '' ||
      form.work_detail.trim() === '' ||
      form.area_of_work.trim() === ''
    ) {
      setIsSubmitting(false);
      CustomAlert.alert('Please fill all fields');
      return;
    }

    createMaintenanceRequest(form, {
      onSuccess: () => {
        setForm(EMPTY_FORM);
        onClose();
      },
      onError: (error: any) => {
        CustomAlert.alert('Error', error.message);
      },
      onSettled: () => {
        setIsSubmitting(false);
      },
    });
  };

  return (
    <Modal
      animationType="slide"
      visible={visible}
      presentationStyle="pageSheet"
      statusBarTranslucent
      onRequestClose={handleClose}>
      <SafeAreaView className="h-full w-full bg-white">
        <KeyboardAwareScrollView
          bottomOffset={62}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled">
          <PageHeader title="Maintenance Request" iconName="times" onPress={handleClose} />

          <View className="mt-6 flex-1 px-4">
            <Text className="font-pregular text-base text-gray-500">
              JSDV {user.issuedto}, please register your maintenance request
            </Text>

            <CustomSelectBottomSheet
              className="mt-7"
              label="Department"
              placeholder="Select Department"
              options={DEPARTMENT_LIST}
              selectedValue={form.department}
              onValueChange={(val: any) => setForm({ ...form, department: val })}
            />

            <FormField
              text="Detail of Work"
              value={form.work_detail}
              handleChangeText={(e: any) => setForm({ ...form, work_detail: e })}
              multiline
              numberOfLines={4}
              otherStyles="mt-7"
              inputStyles="font-pmedium text-base text-black"
              containerStyles="bg-gray-100"
              placeholder="Work Description"
            />

            <FormField
              text="Place where work is needed"
              value={form.area_of_work}
              handleChangeText={(e: any) => setForm({ ...form, area_of_work: e })}
              otherStyles="mt-7"
              inputStyles="font-pmedium text-base text-black"
              containerStyles="bg-gray-100"
              placeholder="Place where work is needed"
            />

            <CustomButton
              text="Submit"
              handlePress={handleSubmit}
              containerStyles="min-h-[62px] mt-7"
              isLoading={isSubmitting}
              isDisabled={
                form.department === '' || form.work_detail === '' || form.area_of_work === ''
              }
            />
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default CreateMaintenanceModal;
