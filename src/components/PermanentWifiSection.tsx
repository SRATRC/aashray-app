import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/src/constants';
import { ShadowBox } from './ShadowBox';
import HorizontalSeparator from './HorizontalSeparator';
import CustomAlert from './CustomAlert';
import CustomButton from '@/src/components/CustomButton';
import CustomErrorMessage from '@/src/components/CustomErrorMessage';
import Shimmer from '@/src/components/Shimmer';
import moment from 'moment';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

import * as Clipboard from 'expo-clipboard';
import CustomSelectBottomSheet, { CustomSelectBottomSheetRef } from './CustomSelectBottomSheet';

interface PermanentWifiData {
  id: string;
  status: 'approved' | 'rejected' | 'pending' | 'reset';
  code?: string;
  requested_at?: string;
  reviewed_at?: string;
  admin_comments?: string;
  username?: string;
  ssid?: string;
  res_status: string;
}

interface PermanentWifiSectionProps {
  data: PermanentWifiData[] | null;
  isLoading: boolean;
  isError: boolean;
  isSubmitting: boolean;
  onRequestCode: (data: { deviceType: string }, onSuccess?: () => void) => void;
  onInfoPress: () => void;
  onResetCode?: (id: string) => void;
  isResettingCode?: boolean;
  isResidentOrSevakutir?: boolean;
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
  isResidentOrSevakutir = false,
}) => {
  const copyToClipboard = async (text: string, label: string = 'WiFi code') => {
    await Clipboard.setStringAsync(text);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Toast.show({
      type: 'info',
      text1: `${label} copied to clipboard`,
    });
  };

  const [deviceType, setDeviceType] = React.useState('');
  const bottomSheetRef = React.useRef<CustomSelectBottomSheetRef>(null);

  const deviceTypeOptions = [
    { key: 'Mobile', value: 'Mobile' },
    { key: 'Laptop', value: 'Laptop' },
    { key: 'Tablet', value: 'Tablet' },
    { key: 'Other', value: 'Other' },
  ];

  const handleRequestNewCode = () => {
    if (!isResidentOrSevakutir) {
      onRequestCode({ deviceType: 'Mobile' }, () => {
        setDeviceType('');
      });
    } else {
      bottomSheetRef.current?.open();
    }
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
      reset: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
        label: 'Reset Processing',
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
          <Text className={`font-pmedium text-xs ${config.text}`}>{config.label}</Text>
        </View>
        {data && data.length > 1 && typeof index === 'number' && (
          <Text className="font-pregular text-xs text-gray-400">Request #{index + 1}</Text>
        )}
      </View>
    );
  };

  const renderApprovedCode = (item: PermanentWifiData) => (
    <View className="gap-y-3">
      <View className="flex-row items-center justify-between">
        <Text className="font-pregular text-xs text-gray-500">WiFi Code</Text>
        <View className="rounded-full bg-green-50 px-2 py-0.5">
          <Text className="font-pmedium text-[10px] text-green-700">Active</Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => item.code && copyToClipboard(item.code, 'WiFi code')}>
          <Text className="font-pbold text-3xl tracking-wider text-black">{item.code}</Text>
        </TouchableOpacity>
      </View>

      {/* Username and SSID info */}
      {(item.username || item.ssid) && (
        <View className="flex-row flex-wrap gap-x-4 gap-y-2">
          {item.username && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => item.username && copyToClipboard(item.username, 'Username')}>
              <Text className="font-pregular text-[10px] text-gray-500">Username</Text>
              <Text className="font-pmedium text-sm text-black">{item.username}</Text>
            </TouchableOpacity>
          )}
          {item.ssid && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => item.ssid && copyToClipboard(item.ssid, 'SSID')}>
              <Text className="font-pregular text-[10px] text-gray-500">SSID</Text>
              <Text className="font-pmedium text-sm text-black">{item.ssid}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <HorizontalSeparator />

      <View className="mt-1 flex-row items-center justify-between">
        <Text className="font-pregular text-xs text-gray-400">
          Approved on <Text className="text-gray-600">{formatDate(item.reviewed_at)}</Text>
        </Text>
        <View className="flex flex-row gap-x-2">
          <TouchableOpacity
            onPress={() => {
              CustomAlert.alert(
                'Reset WiFi Code',
                "Are you sure you want to reset your permanent WiFi code? A new code request will be sent to the admin, and you'll need to reconnect your device with the new code.",
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {},
                  },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => onResetCode?.(item.id),
                  },
                ]
              );
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            disabled={isResettingCode}
            className="flex-row items-center"
            activeOpacity={0.7}>
            {isResettingCode ? (
              <ActivityIndicator size="small" color={colors.gray_500} />
            ) : (
              <>
                <MaterialIcons name="refresh" size={14} color={colors.gray_400} />
                <Text className="ml-1 font-pregular text-xs text-gray-400">Reset</Text>
              </>
            )}
          </TouchableOpacity>
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

  const renderResetStatus = (item: PermanentWifiData) => (
    <View className="gap-y-3">
      <Text className="font-pmedium text-black">
        Your WiFi code is currently being reset. Admins will verify and re-approve it shortly.
      </Text>
      <View className="flex-row items-center">
        <Text className="font-pregular text-sm text-gray-500">Requested on:</Text>
        <Text className="ml-2 font-pmedium text-sm text-black">
          {formatDate(item.requested_at)}
        </Text>
      </View>
    </View>
  );

  const renderWifiItem = (item: PermanentWifiData, index: number) => (
    <View
      key={item.id || index}
      className="mb-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm shadow-gray-200">
      {item.status !== 'approved' && renderStatusBadge(item.status, index)}

      {item.status === 'approved' && item.code && renderApprovedCode(item)}
      {item.status === 'pending' && renderPendingStatus(item)}
      {item.status === 'rejected' && renderRejectedStatus(item)}
      {item.status === 'reset' && renderResetStatus(item)}
    </View>
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
          handlePress={handleRequestNewCode}
          containerStyles="px-6 py-3 min-h-[50px]"
          textStyles="text-sm font-pmedium text-white"
          isLoading={isSubmitting}
        />
      </View>
    </ShadowBox>
  );

  return (
    <View className="flex-1">
      {/* Section Header */}
      <View className="mb-6 flex-row items-center px-4">
        <View className="flex-1">
          <Text className="font-psemibold text-lg text-black">Permanent WiFi Code</Text>
          <Text className="font-pregular text-sm text-gray-500">
            Long-term access without expiration
          </Text>
        </View>

        <TouchableOpacity onPress={onInfoPress} className="p-1.5" activeOpacity={0.7}>
          <Ionicons name="help-circle-outline" size={28} color={colors.orange} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <Shimmer.Container className="mx-4">
          <Shimmer.Box height={150} borderRadius={12} />
        </Shimmer.Container>
      ) : isError ? (
        <ShadowBox className="mx-4 rounded-2xl bg-white p-6">
          <CustomErrorMessage
            errorTitle="An Error Occurred"
            errorMessage="Failed to load permanent WiFi code. Please try again later."
          />
        </ShadowBox>
      ) : !data || data.length === 0 ? (
        <>{renderEmptyState()}</>
      ) : (
        <View className="mx-4">
          {data.map((item, index) => renderWifiItem(item, index))}
          {(shouldShowRequestButton() || isResidentOrSevakutir) && (
            <View className="mt-4">
              <CustomButton
                text="Request New Code"
                handlePress={handleRequestNewCode}
                containerStyles="px-6 py-3 min-h-[50px]"
                textStyles="text-sm font-pmedium text-white"
                isLoading={isSubmitting}
              />
            </View>
          )}
        </View>
      )}
      <CustomSelectBottomSheet
        ref={bottomSheetRef}
        options={deviceTypeOptions}
        onValueChange={(value) => {
          const selectedType = value.toString();
          setDeviceType(selectedType);
          onRequestCode({ deviceType: selectedType }, () => {
            setDeviceType('');
          });
        }}
        label="Which device will be using this code?"
        placeholder="Select Device Type"
        style={{ position: 'absolute', opacity: 0, height: 0, width: 0 }}
      />
    </View>
  );
};

export default PermanentWifiSection;
