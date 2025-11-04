import { View, ImageBackground, Modal } from 'react-native';
import { images, colors } from '@/src/constants';
import { useAuthStore } from '@/src/stores';
import { router } from 'expo-router';
import React from 'react';
import QRCodeStyled from 'react-native-qrcode-styled';
import PageHeader from '@/src/components/PageHeader';

const QrScreen = () => {
  const { user } = useAuthStore();

  const closeModal = () => {
    router.back();
  };

  return (
    <Modal
      animationType="slide"
      visible={true}
      statusBarTranslucent={true}
      presentationStyle="pageSheet"
      onRequestClose={closeModal}>
      <PageHeader title={'QR Code'} />
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
                borderRadius: 12,
                color: colors.black_200,
              }}
              outerEyesOptions={{
                borderRadius: 12,
                color: colors.orange,
              }}
              logo={{
                href: require('@/src/assets/images/logo.png'),
                padding: 4,
              }}
            />
          </View>
        </ImageBackground>
      </View>
    </Modal>
  );
};

export default QrScreen;
