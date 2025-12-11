import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/src/constants';
import { ShadowBox } from './ShadowBox';
import HorizontalSeparator from './HorizontalSeparator';
import FormField from './FormField';
import CustomSelectBottomSheet from './CustomSelectBottomSheet';
import CustomModal from './CustomModal';
import CustomAlert from './CustomAlert';
import CustomButton from '@/src/components/CustomButton';
import CustomErrorMessage from '@/src/components/CustomErrorMessage';
import Shimmer from '@/src/components/Shimmer';
import moment from 'moment';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import FormDisplayField from './FormDisplayField';

interface PermanentWifiData {
  id: string;
  status: 'approved' | 'rejected' | 'pending';
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
  onRequestCode: (data: { username: string; deviceType: string }, onSuccess?: () => void) => void;
  onInfoPress: () => void;
  onResetCode?: (id: string) => void;
  isResettingCode?: boolean;
  onDeleteCode?: (id: string) => void;
  isDeletingCode?: boolean;
  isResident?: boolean;
  res_status: string;
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
  onDeleteCode,
  isDeletingCode = false,
  isResident = false,
  res_status,
}) => {
  const copyToClipboard = async (text: string, label: string = 'WiFi code') => {
    await Clipboard.setStringAsync(text);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Toast.show({
      type: 'info',
      text1: `${label} copied to clipboard`,
    });
  };

  const [isFormVisible, setIsFormVisible] = React.useState(false);
  const [username, setUsername] = React.useState('');
  const [deviceType, setDeviceType] = React.useState('');
  const [errors, setErrors] = React.useState<{ username?: string; deviceType?: string }>({});

  const onlyAllowMobile = ['MUMUKSHU', 'GUEST'].includes(res_status);
  useEffect(() => {
    if (onlyAllowMobile) {
      setDeviceType('Mobile');
    }
  }, [onlyAllowMobile]);

  const validateForm = () => {
    let isValid = true;
    const newErrors: { username?: string; deviceType?: string } = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    }

    if (!deviceType) {
      newErrors.deviceType = 'Device Type is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onRequestCode({ username, deviceType }, () => {
        setIsFormVisible(false);
        setUsername('');
        setDeviceType('');
      });
    }
  };

  const deviceTypeOptions = [
    { key: 'Mobile', value: 'Mobile' },
    { key: 'Laptop', value: 'Laptop' },
    { key: 'Tablet', value: 'Tablet' },
    { key: 'Other', value: 'Other' },
  ];

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
          <TouchableOpacity
            onPress={() => {
              CustomAlert.alert(
                'Delete WiFi Code',
                'Are you sure you want to delete your permanent WiFi code? If you do, you won’t be able to access the WiFi with that code anymore.',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {},
                  },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDeleteCode?.(item.id),
                  },
                ]
              );
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            disabled={isDeletingCode}
            className="flex-row items-center"
            activeOpacity={0.7}>
            {isDeletingCode ? (
              <ActivityIndicator size="small" color="red" />
            ) : (
              <>
                <MaterialIcons name="delete" size={14} color="red" />
                <Text className="ml-1 font-pregular text-xs text-red-500">Delete</Text>
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

  const renderWifiItem = (item: PermanentWifiData, index: number) => (
    <View
      key={item.id || index}
      className="mb-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm shadow-gray-200">
      {item.status !== 'approved' && renderStatusBadge(item.status, index)}

      {item.status === 'approved' && item.code && renderApprovedCode(item)}
      {item.status === 'pending' && renderPendingStatus(item)}
      {item.status === 'rejected' && renderRejectedStatus(item)}
    </View>
  );

  const renderForm = () => (
    <CustomModal
      visible={isFormVisible}
      onClose={() => setIsFormVisible(false)}
      title="Request Permanent Code"
      showActionButton={false}
      avoidKeyboard>
      <View className="gap-y-4">
        <FormField
          containerStyles="bg-gray-100"
          text="Username"
          value={username}
          handleChangeText={(text: string) => {
            if (/^[a-zA-Z0-9 ]*$/.test(text)) {
              setUsername(text);
              if (errors.username) setErrors({ ...errors, username: undefined });
            }
          }}
          placeholder="Enter username"
          error={!!errors.username}
          errorMessage={errors.username}
        />

        {!onlyAllowMobile ? (
          <CustomSelectBottomSheet
            label="Device Type"
            options={deviceTypeOptions}
            selectedValue={deviceType}
            onValueChange={(val) => {
              setDeviceType(val as string);
              if (errors.deviceType) setErrors({ ...errors, deviceType: undefined });
            }}
            placeholder="Select Device Type"
          />
        ) : (
          <FormDisplayField text="Device Type" value={'Mobile'} backgroundColor="bg-gray-100" />
        )}
        {errors.deviceType && (
          <Text className="ml-2 mt-1 font-pmedium text-sm text-red-600">{errors.deviceType}</Text>
        )}

        <View className="mt-2 flex-row gap-x-3">
          <View className="flex-1">
            <CustomButton
              text="Cancel"
              handlePress={() => setIsFormVisible(false)}
              containerStyles="bg-gray-100 py-3 min-h-[50px]"
              textStyles="text-black font-pmedium"
            />
          </View>
          <View className="flex-1">
            <CustomButton
              text="Submit Request"
              handlePress={handleSubmit}
              containerStyles="py-3 min-h-[50px]"
              isLoading={isSubmitting}
            />
          </View>
        </View>
      </View>
    </CustomModal>
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
          handlePress={() => setIsFormVisible(true)}
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
        <>
          {renderEmptyState()}
          {renderForm()}
        </>
      ) : (
        <View className="mx-4">
          {data.map((item, index) => renderWifiItem(item, index))}
          {(shouldShowRequestButton() || isResident) && !isFormVisible && (
            <View className="mt-4">
              <CustomButton
                text="Request New Code"
                handlePress={() => setIsFormVisible(true)}
                containerStyles="px-6 py-3 min-h-[50px]"
                textStyles="text-sm font-pmedium text-white"
                isLoading={isSubmitting}
              />
            </View>
          )}
          {renderForm()}
        </View>
      )}
    </View>
  );
};

export default PermanentWifiSection;
