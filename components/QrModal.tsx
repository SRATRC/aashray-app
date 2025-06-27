import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalContext } from '../context/GlobalProvider';
import { colors } from '@/constants';
// @ts-ignore
import QRCodeStyled from 'react-native-qrcode-styled';
import * as Haptics from 'expo-haptics';

export const QrModal = () => {
  const { user } = useGlobalContext();
  const [modalVisible, setModalVisible] = useState(false);
  const scaleAnimation = new Animated.Value(0);
  const fadeAnimation = new Animated.Value(0);
  const pulseAnimation = new Animated.Value(1);
  const shimmerAnimation = new Animated.Value(0);
  const buttonScale = new Animated.Value(1);
  const buttonRotate = new Animated.Value(0);
  const buttonGlow = new Animated.Value(0.3);

  useEffect(() => {
    // Button idle animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonGlow, {
          toValue: 0.6,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(buttonGlow, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subtle rotation
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonRotate, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        }),
        Animated.timing(buttonRotate, {
          toValue: 0,
          duration: 10000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    if (modalVisible) {
      Animated.parallel([
        Animated.spring(scaleAnimation, {
          toValue: 1,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for the indicator
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Shimmer animation
      Animated.loop(
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [modalVisible]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => setModalVisible(true), 150);
  };

  const closeModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalVisible(false);
  };

  return (
    <>
      <Animated.View style={[styles.buttonContainer, { transform: [{ scale: buttonScale }] }]}>
        <View style={styles.buttonRing} />

        <TouchableOpacity onPress={handlePress} style={styles.button} activeOpacity={0.8}>
          <View style={styles.buttonInner}>
            <View style={styles.iconContainer}>
              <Ionicons name="qr-code-outline" size={24} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        statusBarTranslucent={true}
        navigationBarTranslucent={true}
        onRequestClose={closeModal}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnimation }]}>
          <Pressable style={styles.overlayPressable} onPress={closeModal}>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{ scale: scaleAnimation }],
                },
              ]}>
              <Pressable onPress={(e) => e.stopPropagation()}>
                {/* BlurView backdrop */}
                <BlurView intensity={80} tint="dark" style={styles.modalBackdrop}>
                  <View style={styles.modalContent}>
                    <SafeAreaView style={styles.modalInner}>
                      {/* Header */}
                      <View style={styles.header}>
                        <View style={styles.headerTitleContainer}>
                          <Text style={styles.headerTitle}>Your QR Code</Text>
                          <Text style={styles.headerSubtitle}>Card #{user?.cardno}</Text>
                        </View>
                        <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                          <BlurView intensity={40} tint="light" style={styles.closeButtonBlur}>
                            <View style={styles.closeButtonInner}>
                              <Ionicons name="close" size={24} color="#fff" />
                            </View>
                          </BlurView>
                        </TouchableOpacity>
                      </View>

                      {/* QR Code Container */}
                      <View style={styles.content}>
                        <View style={styles.qrContainer}>
                          <View style={styles.qrWrapper}>
                            <View style={styles.qrInnerWrapper}>
                              <QRCodeStyled
                                data={user?.cardno}
                                style={[styles.qrCode, { width: 500, height: 500 }]}
                                color="#000000"
                                backgroundColor="#ffffff"
                                pieceBorderRadius={4}
                                isPiecesGlued={false}
                                outerEyesOptions={{
                                  topLeft: { borderRadius: 12 },
                                  topRight: { borderRadius: 12 },
                                  bottomLeft: { borderRadius: 12 },
                                }}
                                innerEyesOptions={{
                                  borderRadius: 4,
                                }}
                              />
                            </View>
                          </View>
                        </View>

                        {/* Instruction */}
                        <View style={styles.instructionContainer}>
                          <BlurView intensity={30} tint="light" style={styles.instructionBlur}>
                            <View style={styles.instructionInner}>
                              <Animated.View
                                style={[
                                  styles.pulseIndicator,
                                  { transform: [{ scale: pulseAnimation }] },
                                ]}
                              />
                              <Text style={styles.instruction}>Hold steady near the scanner</Text>
                            </View>
                          </BlurView>
                        </View>
                      </View>
                    </SafeAreaView>
                  </View>
                </BlurView>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    top: -32,
    left: '50%',
    marginLeft: -40,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOuterGlow: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 160, 1, 0.3)',
    backgroundColor: 'rgba(255, 160, 1, 0.05)',
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
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  overlayPressable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 450,
  },
  modalBackdrop: {
    borderRadius: 32,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalContent: {
    backgroundColor: 'rgba(18, 18, 18, 0.4)',
    borderRadius: 31,
    margin: 1,
  },
  modalInner: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
    fontWeight: '500',
  },
  closeButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  closeButtonBlur: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  closeButtonInner: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  qrContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  qrWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 15,
    position: 'relative',
    overflow: 'hidden',
  },
  qrInnerWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 25,
    padding: 16,
  },
  qrCode: {
    borderRadius: 16,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ skewX: '-20deg' }],
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.secondary_200,
    borderWidth: 3,
    opacity: 0.8,
  },
  cornerTopLeft: {
    top: -10,
    left: -10,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: -10,
    right: -10,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: -10,
    left: -10,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: -10,
    right: -10,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  instructionContainer: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  instructionBlur: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  instructionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  pulseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
    marginRight: 12,
    shadowColor: '#4ade80',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  instruction: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    letterSpacing: -0.3,
  },
});
