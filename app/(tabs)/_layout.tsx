import React from 'react';
import { View, Image, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { icons } from '@/constants';
import { QrModal } from '@/components/QrModal';
import { HapticTab } from '@/components/HapticTab';
import BlurTabBarBackground from '@/components/TabBarBackground';

interface TabIconProps {
  icon: any;
  color: string;
  name?: string;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = React.memo(({ icon, color }) => {
  return (
    <View className="items-center justify-center gap-2">
      <Image source={icon} resizeMode="contain" tintColor={color} className="h-6 w-6" />
    </View>
  );
});

const TabsLayout: React.FC = () => {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarShowLabel: true,
          tabBarActiveTintColor: '#FFA001',
          tabBarInactiveTintColor: '#BFBFBF',
          tabBarButton: HapticTab,
          tabBarBackground: BlurTabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {
              backgroundColor: '#FFFCF5',
              borderTopColor: '#EEAA0B',
              borderTopWidth: 1,
            },
          }),
        }}>
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.home} color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="book-now"
          options={{
            title: 'Book Now',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.plus} color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="qrModal"
          options={{
            tabBarButton: QrModal,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
            },
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: 'Bookings',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.bookmark} color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.profile} color={color} focused={focused} />
            ),
          }}
        />
      </Tabs>
    </>
  );
};

export default TabsLayout;
