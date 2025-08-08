import React from 'react';
import { Modal, View, Text, TouchableOpacity, Platform } from 'react-native';
import CustomButton from './CustomButton';

export interface UpdateInfo {
  latestVersion: string;
  mandatory: boolean;
  releaseNotes?: string;
}

interface UpdateModalProps {
  visible: boolean;
  info: UpdateInfo | null;
  onUpdateNow: () => void;
  onDismiss?: () => void; // only for optional updates
}

const UpdateModal: React.FC<UpdateModalProps> = ({ visible, info, onUpdateNow, onDismiss }) => {
  const isMandatory = !!info?.mandatory;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={() => {
        // Only allow dismiss if not mandatory
        if (!isMandatory && onDismiss) onDismiss();
      }}
      statusBarTranslucent>
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <View className="w-full max-w-[360px] rounded-2xl bg-white p-6">
          <Text className="mb-2 font-psemibold text-2xl text-gray-900">Update available</Text>
          {info?.latestVersion ? (
            <Text className="mb-3 font-pmedium text-gray-700">Version {info.latestVersion} is now available.</Text>
          ) : null}
          {!!info?.releaseNotes && (
            <View className="mb-4 rounded-lg bg-gray-50 p-3">
              <Text className="mb-1 font-psemibold text-gray-800">What's new</Text>
              <Text className="font-pregular text-gray-700">{info.releaseNotes}</Text>
            </View>
          )}
          {isMandatory ? (
            <>
              <Text className="mb-4 font-pregular text-red-600">This update is required to continue using the app.</Text>
              <CustomButton
                text="Update now"
                handlePress={onUpdateNow}
                containerStyles="mt-2 w-full py-3"
              />
            </>
          ) : (
            <View className="mt-2 flex-row gap-x-3">
              <View className="flex-1">
                <CustomButton
                  text="Later"
                  handlePress={() => onDismiss && onDismiss()}
                  variant="outline"
                  containerStyles="py-3"
                />
              </View>
              <View className="flex-1">
                <CustomButton
                  text="Update now"
                  handlePress={onUpdateNow}
                  containerStyles="py-3"
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default UpdateModal;

