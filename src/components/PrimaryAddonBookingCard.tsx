import { View, Text } from 'react-native';
import { ShadowBox } from './ShadowBox';
import React from 'react';

interface PrimaryAddonBookingCardProps {
  containerStyles: any;
  title: any;
  children?: any;
  items?: any[];
  renderItem?: (item: any, index: number) => React.ReactNode;
}

const PrimaryAddonBookingCard: React.FC<PrimaryAddonBookingCardProps> = ({
  containerStyles,
  title,
  children,
  items,
  renderItem,
}) => {
  return (
    <View className={`w-full px-4 ${containerStyles}`}>
      <Text className="font-psemibold text-xl text-secondary">{title}</Text>

      {items && renderItem ? (
        items.map((item, index) => (
          <ShadowBox
            key={index}
            className={`flex flex-col rounded-2xl bg-white ${index === 0 ? 'mt-4' : 'mt-4'}`}>
            {renderItem(item, index)}
          </ShadowBox>
        ))
      ) : (
        <ShadowBox className="mt-4 flex flex-col rounded-2xl bg-white">{children}</ShadowBox>
      )}
    </View>
  );
};

export default PrimaryAddonBookingCard;
