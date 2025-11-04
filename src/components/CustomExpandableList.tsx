import { View, Text, TouchableOpacity, Image, FlatList } from 'react-native';
import React, { useState } from 'react';
import { icons } from '../constants';
import { ShadowBox } from './ShadowBox';
import CustomButton from './CustomButton';

const CustomExpandableList: React.FC<{ data: any }> = ({ data }) => {
  const renderItem = ({ item }: any) => <ExpandableListItem item={item} />;

  return (
    <FlatList
      className="px-4 py-6"
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
    />
  );
};

const ExpandableListItem: React.FC<{ item: any }> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <ShadowBox className="mb-5 rounded-2xl bg-white p-3">
      <TouchableOpacity onPress={toggleExpand} className="flex-row justify-between overflow-hidden">
        <View>
          <Text className="font-psemibold text-secondary">{item.date}</Text>
          <Text className="font-pmedium">{item.title}</Text>
        </View>
        <View className="h-8 w-8 items-center justify-center rounded-md bg-gray-100">
          {expanded ? (
            <Image source={icons.collapseArrow} className="h-4 w-4" resizeMode="contain" />
          ) : (
            <Image source={icons.expandArrow} className="h-4 w-4" resizeMode="contain" />
          )}
        </View>
      </TouchableOpacity>
      {expanded && (
        <View className="mt-3">
          <View className="flex-row gap-x-2">
            <Text className="font-psemibold text-gray-400">Swadhyay Karta:</Text>
            <Text className="font-pregular">{item.speaker}</Text>
          </View>
          <View className="flex-row gap-x-2">
            <Text className="font-psemibold text-gray-400">Charges:</Text>
            <Text className="font-pregular">{item.amount}</Text>
          </View>
          {item.status == 'closed' ? (
            <CustomButton
              text="Add to waitlist"
              handlePress={() => {}}
              containerStyles="mt-3 min-h-[40px]"
              isLoading={isSubmitting}
            />
          ) : (
            <CustomButton
              text="Register"
              handlePress={() => {}}
              containerStyles="mt-3 min-h-[40px]"
              isLoading={isSubmitting}
            />
          )}
        </View>
      )}
    </ShadowBox>
  );
};

export default CustomExpandableList;
