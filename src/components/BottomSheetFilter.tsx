import React, { forwardRef } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetFlatList,
} from '@gorhom/bottom-sheet';

interface BottomSheetFilterProps {
  data: any;
  title: any;
  onSelect: any;
}

const BottomSheetFilter = forwardRef<BottomSheetModal, BottomSheetFilterProps>(
  ({ data, title, onSelect }, ref) => {
    const handleSelect = (selectedItem: any) => {
      onSelect(selectedItem);
    };

    return (
      <BottomSheetModal
        snapPoints={['40%']}
        ref={ref}
        backdropComponent={(backdropProps: BottomSheetBackdropProps) => (
          <BottomSheetBackdrop appearsOnIndex={0} disappearsOnIndex={-1} {...backdropProps} />
        )}
        index={0}>
        <BottomSheetFlatList
          data={data}
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingTop: 16,
            paddingBottom: 48,
          }}
          keyExtractor={(item: any) =>
            typeof item === 'string' ? item : item.key || JSON.stringify(item)
          }
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleSelect(item)}>
              <Text className="py-2">
                {typeof item === 'string' ? item : item.value || item.key}
              </Text>
            </TouchableOpacity>
          )}
          ListHeaderComponent={
            <Text className="mb-4 font-psemibold text-xl text-black">{title}</Text>
          }
        />
      </BottomSheetModal>
    );
  }
);

export default BottomSheetFilter;
