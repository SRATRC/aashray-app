import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { AntDesign, Feather, FontAwesome, FontAwesome6, Ionicons } from '@expo/vector-icons';
import { QrModal } from '@/components/QrModal';
import { HapticTab } from '@/components/HapticTab';
import BlurTabBarBackground from '@/components/TabBarBackground';

const TabsLayout: React.FC = () => {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarShowLabel: true,
          tabBarActiveTintColor: '#FFA001',
          tabBarInactiveTintColor: '#9E9E9E',
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
            tabBarIcon: ({ color }) => <FontAwesome6 name="house" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="book-now"
          options={{
            title: 'Book Now',
            headerShown: false,
            tabBarIcon: ({ color }) => <AntDesign name="pluscircle" size={24} color={color} />,
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
            tabBarIcon: ({ color }) => <Ionicons name="bookmark" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerShown: false,
            tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
};

export default TabsLayout;
