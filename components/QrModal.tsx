import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores';
// @ts-ignore
import QRCodeStyled from 'react-native-qrcode-styled';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const QrModal = () => {
  const { user } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const modalAnimation = useRef(new Animated.Value(0)).current;

  const qrSize = Math.min(screenWidth, screenHeight) * 0.7;
  const pieceSize = Math.max(8, Math.floor(qrSize / 35));

  useEffect(() => {
    if (modalVisible) {
      // Animate modal in
      Animated.spring(modalAnimation, {
        toValue: 1,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } else {
      // Animate modal out
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalVisible(true);
  };

  const closeModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalVisible(false);
  };

  const modalTranslateY = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [screenHeight, 0],
  });

  const modalScale = modalAnimation.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0.9, 1.05, 1],
  });

  return (
    <>
      <View style={styles.buttonContainer}>
        <View style={styles.buttonRing} />
        <TouchableOpacity onPress={handlePress} style={styles.button} activeOpacity={0.8}>
          <View style={styles.buttonInner}>
            <View style={styles.iconContainer}>
              <Ionicons name="qr-code-outline" size={24} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        transparent={true}
        visible={modalVisible}
        statusBarTranslucent={true}
        onRequestClose={closeModal}
        presentationStyle="overFullScreen" // Add this to prevent interference
        animationType="none" // We handle our own animations
      >
        <BlurView intensity={100} tint="dark" style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{ translateY: modalTranslateY }, { scale: modalScale }],
                },
              ]}>
              <Pressable style={styles.pressableContainer} onPress={(e) => e.stopPropagation()}>
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>{user?.issuedto}</Text>
                  <Text style={styles.headerSubtitle}>Card ID: {user?.cardno}</Text>
                </View>

                <View style={styles.qrWrapper}>
                  <QRCodeStyled
                    data={user?.cardno || 'N/A'}
                    style={{
                      width: qrSize,
                      height: qrSize,
                      backgroundColor: '#fff',
                    }}
                    padding={20}
                    pieceSize={pieceSize}
                    color={'#111'}
                    errorCorrectionLevel="H"
                    pieceBorderRadius={4}
                    isPiecesGlued
                    outerEyesOptions={{
                      borderRadius: 16,
                      color: '#111',
                    }}
                    innerEyesOptions={{
                      borderRadius: 12,
                      color: '#111',
                    }}
                  />
                </View>

                <View style={styles.footer}>
                  <Text style={styles.instructionText}>
                    Show this code at the counter for check-in, meals, and other services.
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Ionicons name="close-circle" size={44} color="#9E9E9E" />
            </TouchableOpacity>
          </SafeAreaView>
        </BlurView>
      </Modal>
    </>
  );
};

const colors = {
  primary: '#FFA001',
  background: '#000',
  text: '#fff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  card: '#1a1a1a',
};

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -20 }],
  },
  buttonRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 32,
    backgroundColor: '#FFFCF5',
    borderWidth: 1,
    borderColor: '#EEAA0B',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 32,
    backgroundColor: '#FFA001',
    elevation: 12,
    shadowColor: '#FFA001',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  buttonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFA001',
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.9,
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pressableContainer: {
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  qrWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    padding: 0, // QR code has its own padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  closeButton: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
  },
});
