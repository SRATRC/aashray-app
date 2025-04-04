import { View, Image, Modal, ImageBackground, TouchableOpacity, Text, Switch } from 'react-native';
import { Tabs } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { icons, images, colors } from '../../constants';
import { useGlobalContext } from '../../context/GlobalProvider';
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
  settings: any;
  setSettings: any;
}

const QRModal: React.FC<QRModalProps> = React.memo(
  ({ isVisible, onClose, user, setSettings, settings }) => {
    const [isStyledQR, setIsStyledQR] = useState(settings?.qrStyle);

    console.log(JSON.stringify(settings));

    return (
      <Modal
        animationType="slide"
        visible={isVisible}
        presentationStyle="pageSheet"
        onRequestClose={onClose}>
        <PageHeader title={'QR Code'} icon={icons.cross} onPress={onClose} />
        <View className="mt-10 h-full">
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
                  borderRadius: isStyledQR ? 12 : 0,
                  color: colors.black_200,
                }}
                outerEyesOptions={{
                  borderRadius: isStyledQR ? 12 : 0,
                  color: isStyledQR ? colors.orange : colors.black_200,
                }}
                logo={{
                  href: require('../../assets/images/logo.png'),
                  visible: isStyledQR,
                }}
              />
            </View>
          </ImageBackground>
        </View>
        <View className="absolute bottom-20 w-full px-8">
          <View className="flex-row items-center justify-center p-2">
            <Text className="mr-3 text-sm">Basic QR</Text>
            <Switch
              value={isStyledQR}
              onValueChange={(newValue) => {
                setIsStyledQR(newValue);
                setSettings((prev: any) => {
                  return { ...prev, qrStyle: newValue };
                });
              }}
              trackColor={{ false: '#e0e0e0', true: colors.orange }}
              thumbColor="#ffffff"
            />
            <Text className="ml-3 text-sm">Styled QR</Text>
          </View>
        </View>
      </Modal>
    );
  }
);

const TabsLayout: React.FC = () => {
  const { user, settings, setSettings } = useGlobalContext();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const openModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

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
        settings={settings}
        setSettings={setSettings}
      />
    </>
  );
};

export default TabsLayout;
