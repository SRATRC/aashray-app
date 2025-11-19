import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/src/constants';
import { ShadowBox } from './ShadowBox';
import CustomButton from '@/src/components/CustomButton';
import CustomErrorMessage from '@/src/components/CustomErrorMessage';
import CustomModal from '@/src/components/CustomModal';
import moment from 'moment';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

interface PermanentWifiData {
  id: string;
  status: 'approved' | 'rejected' | 'pending';
  code?: string;
  requested_at?: string;
  reviewed_at?: string;
  admin_comments?: string;
}

interface PermanentWifiSectionProps {
  data: PermanentWifiData[] | null;
  isLoading: boolean;
  isError: boolean;
  isSubmitting: boolean;
  onRequestCode: () => void;
  onInfoPress: () => void;
  onResetCode?: (id: string) => void;
  isResettingCode?: boolean;
  allowRequest?: boolean;
}

const PermanentWifiSection: React.FC<PermanentWifiSectionProps> = ({
  data,
  isLoading,
  isError,
  isSubmitting,
  onRequestCode,
  onInfoPress,
  onResetCode,
  isResettingCode = false,
  allowRequest = true,
}) => {
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedCodeId, setSelectedCodeId] = useState<string>('');
  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Toast.show({
      type: 'info',
      text1: 'WiFi code copied to clipboard',
      swipeable: false,
    });
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      approved: {
        bg: 'bg-green-50',
        text: 'text-green-600',
        border: 'border-green-200',
        label: 'Approved',
      },
      rejected: {
        bg: 'bg-red-50',
        text: 'text-red-600',
        border: 'border-red-200',
        label: 'Rejected',
      },
      pending: {
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        border: 'border-amber-200',
        label: 'Pending Review',
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const shouldShowRequestButton = () => {
    if (!data || data.length === 0) return true;
    return data.every((item) => item.status === 'rejected');
  };

  const formatDate = (dateString?: string) => {
    return dateString ? moment(dateString).format('Do MMMM, YYYY') : 'N/A';
  };

  const renderStatusBadge = (status: string, index?: number) => {
    const config = getStatusConfig(status);
    return (
      <View className="mb-4 flex-row items-center justify-between">
        <View
          className={`flex-row items-center rounded-full px-3 py-1 ${config.bg} ${config.border} border`}>
          <Text className={`font-pmedium text-sm ${config.text}`}>{config.label}</Text>
        </View>
        {data && data.length > 1 && typeof index === 'number' && (
          <Text className="font-pregular text-xs text-gray-400">Request #{index + 1}</Text>
        )}
      </View>
    );
  };

  const renderApprovedCode = (item: PermanentWifiData) => (
    <View className="gap-y-2">
      <View className="rounded-xl py-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="font-pregular text-sm text-gray-600">Permanent WiFi Code</Text>
            <Text className="font-psemibold text-lg text-black">{item.code}</Text>
          </View>
          <View className="flex-row gap-x-2">
            <ShadowBox
              onPress={() => {
                setSelectedCodeId(item.id);
                setShowResetModal(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              interactive
              isDisabled={isResettingCode}
              className="h-10 w-10 items-center justify-center rounded-full bg-white">
              {isResettingCode ? (
                <ActivityIndicator size="small" color={colors.orange} />
              ) : (
                <MaterialIcons name="refresh" size={20} color={colors.gray_400} />
              )}
            </ShadowBox>
            <ShadowBox
              onPress={() => item.code && copyToClipboard(item.code)}
              interactive
              className="h-10 w-10 items-center justify-center rounded-full bg-white">
              <Ionicons name="copy-outline" size={20} color={colors.gray_400} />
            </ShadowBox>
          </View>
        </View>
      </View>

      <View className="flex-row items-center">
        <Text className="font-pregular text-sm text-gray-500">Approved on:</Text>
        <Text className="ml-2 font-pmedium text-sm text-black">{formatDate(item.reviewed_at)}</Text>
      </View>

      <View className="flex-row items-center">
        <Text className="font-pregular text-sm text-gray-500">Validity:</Text>
        <View className="ml-2 rounded-full bg-green-100 px-2 py-1">
          <Text className="font-pmedium text-xs text-green-700">Permanent</Text>
        </View>
      </View>
    </View>
  );

  const renderPendingStatus = (item: PermanentWifiData) => (
    <View className="gap-y-3">
      <Text className="font-pmedium text-black">
        Your permanent WiFi code request is being reviewed.
      </Text>
      <View className="flex-row items-center">
        <Text className="font-pregular text-sm text-gray-500">Requested on:</Text>
        <Text className="ml-2 font-pmedium text-sm text-black">
          {formatDate(item.requested_at)}
        </Text>
      </View>
    </View>
  );

  const renderRejectedStatus = (item: PermanentWifiData) => (
    <View className="gap-y-3">
      <Text className="font-pmedium text-black">
        Your permanent WiFi code request was rejected.
      </Text>
      <View className="flex-row items-center">
        <Text className="font-pregular text-sm text-gray-500">Requested on:</Text>
        <Text className="ml-2 font-pmedium text-sm text-black">
          {formatDate(item.requested_at)}
        </Text>
      </View>
      {item.reviewed_at && (
        <View className="flex-row items-center">
          <Text className="font-pregular text-sm text-gray-500">Rejected on:</Text>
          <Text className="ml-2 font-pmedium text-sm text-black">
            {formatDate(item.reviewed_at)}
          </Text>
        </View>
      )}
      {item.admin_comments && (
        <View className="mt-2 rounded-lg bg-red-50 p-3">
          <Text className="font-pregular text-sm text-gray-600">Admin Comments:</Text>
          <Text className="font-pmedium text-sm text-red-700">{item.admin_comments}</Text>
        </View>
      )}
    </View>
  );

  const renderWifiItem = (item: PermanentWifiData, index: number) => (
    <ShadowBox key={item.id || index} className="mb-4 rounded-2xl bg-white p-6">
      {renderStatusBadge(item.status, index)}

      {item.status === 'approved' && item.code && renderApprovedCode(item)}
      {item.status === 'pending' && renderPendingStatus(item)}
      {item.status === 'rejected' && renderRejectedStatus(item)}
    </ShadowBox>
  );

  const renderEmptyState = () => (
    <ShadowBox className="mx-4 rounded-2xl bg-white p-6">
      <View className="items-center">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <Text className="text-2xl">📶</Text>
        </View>
        <Text className="mb-2 text-center font-pmedium text-black">No Permanent Code Yet</Text>
        <Text className="mb-6 text-center font-pregular text-sm text-gray-500">
          Request a permanent WiFi code for long-term access
        </Text>
        <CustomButton
          text="Request Permanent Code"
          handlePress={onRequestCode}
          containerStyles="px-6 py-3 min-h-[50px]"
          textStyles="text-sm font-pmedium text-white"
          isLoading={isSubmitting}
        />
      </View>
    </ShadowBox>
  );

  const renderEmptyStateNoRequest = () => (
    <ShadowBox className="mx-4 rounded-2xl bg-white p-6">
      <View className="items-center">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <Text className="text-2xl">📶</Text>
        </View>
        <Text className="mb-2 text-center font-pmedium text-black">No Permanent Code Yet</Text>
        <Text className="mb-6 text-center font-pregular text-sm text-gray-500">
          You do not have a permanent WiFi code.
        </Text>
      </View>
    </ShadowBox>
  );

  const renderRequestButton = () => {
    const allRejected = data?.every((item) => item.status === 'rejected') || false;

    return (
      <ShadowBox className="mt-4 rounded-2xl bg-white p-6">
        <View className="items-center">
          <Text className="mb-4 text-center font-pmedium text-black">
            {allRejected ? 'Request New Permanent Code' : 'Request Permanent Code'}
          </Text>
          <CustomButton
            text={allRejected ? 'Request Again' : 'Request Permanent Code'}
            handlePress={onRequestCode}
            containerStyles="px-6 py-3 min-h-[50px]"
            textStyles="text-sm font-pmedium text-white"
            isLoading={isSubmitting}
          />
        </View>
      </ShadowBox>
    );
  };

  return (
    <View>
      {/* Section Header */}
      <View className="mb-6 flex-row items-center px-4">
        <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-purple-100">
          <Text className="font-psemibold text-purple-600">🔒</Text>
        </View>
        <View className="flex-1">
          <Text className="font-psemibold text-lg text-black">Permanent WiFi Code</Text>
          <Text className="font-pregular text-sm text-gray-500">
            Long-term access without expiration
          </Text>
        </View>

        <TouchableOpacity onPress={onInfoPress} className="p-1.5" activeOpacity={0.7}>
          <Ionicons name="help-circle-sharp" size={28} color={colors.orange} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <ShadowBox className="mx-4 items-center justify-center rounded-2xl bg-white p-8">
          <ActivityIndicator size="large" color={colors.orange} />
          <Text className="mt-3 font-pregular text-sm text-gray-600">
            Loading permanent code...
          </Text>
        </ShadowBox>
      ) : isError ? (
        <ShadowBox className="mx-4 rounded-2xl bg-white p-6">
          <CustomErrorMessage />
        </ShadowBox>
      ) : !data || data.length === 0 ? (
        allowRequest ? (
          renderEmptyState()
        ) : (
          renderEmptyStateNoRequest()
        )
      ) : (
        <View className="mx-4">
          {data.map((item, index) => renderWifiItem(item, index))}
          {shouldShowRequestButton() && allowRequest && renderRequestButton()}
        </View>
      )}

      {/* Reset Confirmation Modal */}
      <CustomModal
        visible={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset WiFi Code"
        scrollable={false}
        btnOnPress={() => {
          setShowResetModal(false);
          onResetCode?.(selectedCodeId);
        }}>
        <View className="px-1">
          <View className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <Text className="font-pregular text-sm leading-6 text-orange-700">
              Are you sure you want to reset your permanent WiFi code? A new code request will be
              sent to the admin, and you'll need to reconnect your device with the new code.
            </Text>
          </View>
        </View>
      </CustomModal>
    </View>
  );
};

export default PermanentWifiSection;
