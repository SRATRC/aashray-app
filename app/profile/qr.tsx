import { View, ImageBackground, Modal } from 'react-native';
import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { icons, images, colors } from '../../constants';
import QRCodeStyled from 'react-native-qrcode-styled';
import { useGlobalContext } from '../../context/GlobalProvider';
import { router } from 'expo-router';

const QrScreen = () => {
  const { user } = useGlobalContext();

  const closeModal = () => {
    router.back();
  };

  return (
    <Modal
      animationType="slide"
      visible={true}
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
                href: require('../../assets/images/logo.png'),
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
