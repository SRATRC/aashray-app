import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants';
import Toast from 'react-native-toast-message';
import CustomButton from '@/src/components/CustomButton';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { ShadowBox } from './ShadowBox';

interface TemporaryWifiCode {
  id?: string;
  password: string;
  created_at?: string;
  expires_at?: string;
}

interface TemporaryWifiSectionProps {
  codes: TemporaryWifiCode[] | null;
  isLoading: boolean;
  isGenerating: boolean;
  maxCodes?: number;
  onGenerateCode: () => void;
}

const TemporaryWifiSection: React.FC<TemporaryWifiSectionProps> = ({
  codes,
  isLoading,
  isGenerating,
  maxCodes = 3,
  onGenerateCode,
}) => {
  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Toast.show({
      type: 'info',
      text1: 'WiFi code copied to clipboard',
      swipeable: false,
    });
  };

  const validCodes = codes?.filter(Boolean) || [];
  const isAtMaxLimit = validCodes.length >= maxCodes;

  const renderCodeItem = (code: TemporaryWifiCode, index: number) => (
    <View
      key={code.id || index}
      className="mx-4 mt-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm shadow-gray-200">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="font-pregular text-xs text-gray-500">Temporary Code</Text>
          <Text className="font-psemibold text-xl text-black">{code.password}</Text>
        </View>
        <TouchableOpacity
          onPress={() => copyToClipboard(code.password)}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-50"
          activeOpacity={0.7}>
          <Ionicons name="copy-outline" size={20} color={colors.orange} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <ShadowBox className="mx-4 rounded-2xl bg-white p-6">
      <View className="items-center">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <Text className="text-2xl">📱</Text>
        </View>
        <Text className="mb-2 text-center font-pmedium text-black">No Temporary Codes Yet</Text>
        <Text className="mb-6 text-center font-pregular text-sm text-gray-500">
          Generate temporary WiFi codes for short-term access
        </Text>
        <CustomButton
          text="Generate New Code"
          handlePress={onGenerateCode}
          containerStyles="px-6 py-3 min-h-[50px]"
          textStyles="text-sm font-pmedium text-white"
          isLoading={isGenerating}
        />
      </View>
    </ShadowBox>
  );

  const renderLoadingState = () => (
    <View className="items-center justify-center py-8">
      <ActivityIndicator size="large" color={colors.orange} />
      <Text className="mt-3 font-pregular text-sm text-gray-600">Loading codes...</Text>
    </View>
  );

  const renderGenerateButton = () => (
    <View className="mx-4 mt-4">
      <CustomButton
        text="Generate WiFi Code"
        handlePress={onGenerateCode}
        containerStyles="px-6 py-3 min-h-[50px]"
        textStyles="text-sm font-pmedium text-white"
        isLoading={isGenerating}
        isDisabled={isAtMaxLimit}
      />
    </View>
  );

  return (
    <View>
      {/* Section Header */}
      <View className="mt-2 flex-row items-center p-4">
        <View className="flex-1">
          <Text className="font-psemibold text-lg text-black">Temporary WiFi Codes</Text>
          <Text className="font-pregular text-sm text-gray-500">
            {validCodes.length > 0
              ? `${validCodes.length}/${maxCodes} codes generated`
              : 'Generate temporary codes'}
          </Text>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        renderLoadingState()
      ) : validCodes.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {/* Render all temporary codes */}
          {validCodes.map((code, index) => renderCodeItem(code, index))}

          {/* Generate button */}
          {renderGenerateButton()}
        </>
      )}
    </View>
  );
};

export default TemporaryWifiSection;
