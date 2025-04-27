import React, { useState, useCallback } from 'react';
import { View, Image, Modal, ImageBackground, Text } from 'react-native';
import { icons, images, colors } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
import { Tabs } from 'expo-router';
// @ts-ignore
import QRCodeStyled from 'react-native-qrcode-styled';
import PageHeader from '../../components/PageHeader';

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

interface QRModalProps {
  isVisible: boolean;
  onClose: () => void;
  user: any;
}

const QRModal: React.FC<QRModalProps> = React.memo(({ isVisible, onClose, user }) => {
  // Add safety check for user data
  const isUserValid = user && user.cardno;

  return (
    <Modal
      animationType="slide"
      visible={isVisible}
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <PageHeader title={'QR Code'} icon={icons.cross} onPress={onClose} />
      <View className="mt-10 h-full">
        {!isUserValid ? (
          // Show a loading or error state if user data isn't ready
          <View className="h-full items-center justify-center">
            <Text className="text-center font-pmedium text-base">Loading user information...</Text>
          </View>
        ) : (
          <ImageBackground
            source={images.ticketbg}
            resizeMode="contain"
            className="items-center justify-center">
            <View className="h-[70%] items-center justify-center">
              <QRCodeStyled
                data={user.cardno}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 20,
                  overflow: 'hidden',
                }}
                padding={20}
                pieceSize={10}
                color={colors.black_200}
                errorCorrectionLevel={'H'}
                innerEyesOptions={{
                  borderRadius: 0,
                  color: colors.black_200,
                }}
                outerEyesOptions={{
                  borderRadius: 0,
                  color: colors.black_200,
                }}
                logo={{
                  href: require('../../assets/images/logo.png'),
                }}
              />
            </View>
          </ImageBackground>
        )}
      </View>
    </Modal>
  );
});

const TabsLayout: React.FC = () => {
  const { user } = useGlobalContext();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const openModal = useCallback(() => {
    if (user && user.cardno) {
      setIsModalVisible(true);
    } else {
      console.warn('User data not available yet');
    }
  }, [user]);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarShowLabel: true,
          tabBarActiveTintColor: '#FFA001',
          tabBarInactiveTintColor: '#BFBFBF',
          tabBarStyle: {
            backgroundColor: '#FFFCF5',
            borderTopColor: '#EEAA0B',
            borderTopWidth: 1,
          },
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
            title: 'QR Code',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.qrcode} color={color} focused={focused} />
            ),
          }}
          listeners={() => ({
            tabPress: (e) => {
              e.preventDefault();
              openModal();
            },
          })}
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

      <QRModal
        isVisible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
        }}
        user={user}
      />
    </>
  );
};

export default TabsLayout;
