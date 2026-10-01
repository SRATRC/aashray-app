import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Easing,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/stores';
// @ts-ignore
import QRCodeStyled from 'react-native-qrcode-styled';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const QrModal = () => {
  const user = useAuthStore((state) => state.user);
  /**
   * Whether the Modal is on screen — which is NOT the same as whether it is
   * open. Closing keeps it mounted until the exit animation finishes.
   *
   * The old code drove `visible` straight off an `isOpen` flag, so closing tore
   * the modal down on the same frame and the exit `timing` ran against a
   * detached view. With `useNativeDriver` the value lives on the native side,
   * and that orphaned animation never wrote 0 back to the JS value: it stayed
   * at 1. Every open after the first sprang from 1 to 1, which is exactly no
   * animation at all.
   */
  const [isMounted, setIsMounted] = useState(false);
  const modalAnimation = useState(() => new Animated.Value(0))[0];

  const qrSize = Math.min(screenWidth, screenHeight) * 0.7;
  const pieceSize = Math.max(8, Math.floor(qrSize / 35));

  // Belt and braces: seed the value here too, so the entrance starts from the
  // bottom even if a previous exit was interrupted.
  const animateIn = useCallback(() => {
    modalAnimation.setValue(0);
    Animated.timing(modalAnimation, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [modalAnimation]);

  // Runs once the Modal is actually on screen, so the spring never plays
  // against a view that has not attached yet.
  useEffect(() => {
    if (isMounted) animateIn();
  }, [isMounted, animateIn]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Already mounted means an exit is still running — restart the entrance
    // rather than leaving it to finish closing.
    if (isMounted) {
      animateIn();
      return;
    }
    setIsMounted(true);
  };

  const closeModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      // Only unmount when the exit actually completed. Reopening mid-exit
      // cancels this, and tearing the modal down then would close it under the
      // user's finger.
      if (finished) setIsMounted(false);
    });
  };

  /**
   * 48pt of travel, not a full screen height.
   *
   * The card carries a 30pt shadow, and it used to spring the whole height of
   * the display with a 1.05 overshoot. Every frame of that re-rasterized the
   * shadow over a blurred backdrop, across ~900pt, on a slow spring — which is
   * what read as chunky. Opacity does most of the entrance now and the movement
   * is short enough to stay cheap.
   */
  const modalTranslateY = useMemo(
    () => modalAnimation.interpolate({ inputRange: [0, 1], outputRange: [48, 0] }),
    [modalAnimation]
  );

  const modalScale = useMemo(
    () => modalAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }),
    [modalAnimation]
  );

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
        visible={isMounted}
        statusBarTranslucent={true}
        onRequestClose={closeModal}
        presentationStyle="overFullScreen" // Add this to prevent interference
        animationType="none" // We handle our own animations
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 100 : 40}
          tint="dark"
          // No blur method on Android on purpose. The scrim below already
          // darkens to 82%, so a real-time blur would re-capture the view
          // hierarchy every frame to produce something almost entirely hidden.
          style={styles.overlay}>
          {/* iOS gets its darkness from the blur itself. Android cannot rely on
              that, so a scrim does the work there and the modal stays legible
              whether or not the blur actually ran. */}
          {Platform.OS === 'android' ? (
            <View pointerEvents="none" style={styles.androidScrim} />
          ) : null}
          <SafeAreaView style={styles.safeArea}>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  opacity: modalAnimation,
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
  androidScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
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
