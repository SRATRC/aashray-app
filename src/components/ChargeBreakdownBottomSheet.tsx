import React, { forwardRef, ReactNode } from 'react';
import { View, Text } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import CustomButton from './CustomButton';

export interface ChargeBreakdownItem {
  charge: number;
  availableCredits?: number;
  [key: string]: any; // Allow any additional properties
}

interface ChargeBreakdownBottomSheetProps {
  title: string;
  items: ChargeBreakdownItem[];
  subtitle?: string;
  itemRenderer?: (item: ChargeBreakdownItem, index: number) => ReactNode;
  totalCharge?: number;
  emptyMessage?: string;
  snapPoints?: string[];
}

const ChargeBreakdownBottomSheet = forwardRef<BottomSheetModal, ChargeBreakdownBottomSheetProps>(
  (
    {
      title,
      items,
      subtitle = 'Charges per Mumukshu:',
      itemRenderer,
      totalCharge,
      emptyMessage = 'No charge details available.',
      snapPoints = ['50%'],
    },
    ref
  ) => {
    // Calculate total charge if not provided
    const calculatedTotalCharge =
      totalCharge !== undefined
        ? totalCharge
        : items.reduce((total, item) => total + item.charge, 0);

    // Default item renderer
    const defaultItemRenderer = (item: ChargeBreakdownItem, index: number) => (
      <View
        key={index}
        className={`flex-row items-center justify-between py-2 ${
          index !== items.length - 1 ? 'border-b border-gray-200' : ''
        }`}>
        <View className="flex-1">
          {Object.entries(item).map(([key, value]) => {
            // Skip rendering charge and availableCredits in the left section
            if (key === 'charge' || key === 'availableCredits') return null;

            return (
              <Text key={key} className="font-pmedium text-sm text-gray-900">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </Text>
            );
          })}
        </View>
        <View className="items-end">
          <Text className="font-psemibold text-base text-gray-900">₹{item.charge}</Text>
          {item.availableCredits && item.availableCredits > 0 && (
            <Text className="font-pregular text-xs text-green-600">
              Credits: ₹{item.availableCredits}
            </Text>
          )}
        </View>
      </View>
    );

    const renderItem = itemRenderer || defaultItemRenderer;

    return (
      <BottomSheetModal
        snapPoints={snapPoints}
        ref={ref}
        backdropComponent={(backdropProps: BottomSheetBackdropProps) => (
          <BottomSheetBackdrop appearsOnIndex={0} disappearsOnIndex={-1} {...backdropProps} />
        )}
        index={0}
        enablePanDownToClose={true}>
        <BottomSheetScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 32,
          }}>
          <Text className="mb-4 font-psemibold text-xl text-black">{title}</Text>

          {items && items.length > 0 ? (
            <View className="gap-y-3">
              <View className="rounded-lg bg-gray-50 p-3">
                {subtitle && (
                  <Text className="mb-3 font-pmedium text-sm text-gray-700">{subtitle}</Text>
                )}
                {items.map((item, index) => renderItem(item, index))}
              </View>

              <View className="rounded-lg bg-blue-50 p-3">
                <View className="flex-row items-center justify-between">
                  <Text className="font-psemibold text-sm text-blue-900">Total Charge</Text>
                  <Text className="font-pbold text-lg text-blue-900">₹{calculatedTotalCharge}</Text>
                </View>
              </View>

              <CustomButton
                text="Close"
                handlePress={() => {
                  if (ref && typeof ref !== 'function' && ref.current) {
                    ref.current.dismiss();
                  }
                }}
                containerStyles="min-h-[44px] mt-2"
                textStyles="font-psemibold text-sm text-white"
              />
            </View>
          ) : (
            <Text className="font-pregular text-sm text-gray-600">{emptyMessage}</Text>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

export default ChargeBreakdownBottomSheet;
