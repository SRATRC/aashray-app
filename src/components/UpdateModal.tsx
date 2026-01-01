import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
  Image,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;

export interface UpdateInfo {
  latestVersion: string;
  mandatory: boolean;
  releaseNotes?: string;
}

interface UpdateModalProps {
  visible: boolean;
  info: UpdateInfo;
  onUpdateNow: () => void;
  onDismiss?: () => void;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ visible, info, onUpdateNow, onDismiss }) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 20,
          stiffness: 90,
          mass: 1,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Icon entrance animation
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.spring(iconScale, {
            toValue: 1,
            damping: 8,
            stiffness: 100,
            useNativeDriver: true,
          }),
          Animated.timing(iconRotate, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Reset animations
      translateY.setValue(SHEET_HEIGHT);
      iconScale.setValue(0.8);
      iconRotate.setValue(0);
      backdropOpacity.setValue(0);
      contentOpacity.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    if (info.mandatory) return;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  const iconRotation = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '0deg'],
  });

  const renderContent = () => (
    <Animated.View
      style={{
        flex: 1,
        opacity: contentOpacity,
      }}>
      {/* App Icon with elegant shadow */}
      <View style={{ alignItems: 'center', marginTop: 32 }}>
        <Animated.View
          style={{
            transform: [{ scale: iconScale }, { rotate: iconRotation }],
          }}>
          <View
            style={{
              shadowColor: colors.orange,
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.35,
              shadowRadius: Platform.OS === 'android' ? 64 : 24,
              elevation: Platform.OS === 'android' ? 32 : 0,
              backgroundColor: 'white',
              borderRadius: 24,
            }}>
            <Image
              source={require('@/src/assets/images/icon.png')}
              style={{
                width: 100,
                height: 100,
                borderRadius: 24,
              }}
            />
          </View>
        </Animated.View>
      </View>

      {/* Title */}
      <View style={{ alignItems: 'center', marginTop: 32, paddingHorizontal: 24 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Bold',
            fontSize: 28,
            color: colors.black_100,
            textAlign: 'center',
            letterSpacing: -0.5,
          }}>
          Update Available
        </Text>

        {/* Version Badge */}
        <View
          style={{
            marginTop: 12,
            paddingHorizontal: 16,
            paddingVertical: 6,
            backgroundColor: colors.secondary_50,
            borderRadius: 100,
            borderWidth: 1,
            borderColor: colors.orange + '40',
          }}>
          <Text
            style={{
              fontFamily: 'Poppins-SemiBold',
              fontSize: 14,
              color: colors.secondary_100,
            }}>
            Version {info.latestVersion}
          </Text>
        </View>

        {/* Subtitle */}
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 16,
            color: colors.gray_500,
            textAlign: 'center',
            marginTop: 16,
            lineHeight: 24,
          }}>
          {info.mandatory
            ? 'A new version is required to continue using the app.'
            : 'A new version is available with improvements and bug fixes.'}
        </Text>
      </View>

      {/* Release Notes */}
      {info.releaseNotes && (
        <View
          style={{
            marginTop: 24,
            marginHorizontal: 24,
            flex: 1,
          }}>
          <Text
            style={{
              fontFamily: 'Poppins-SemiBold',
              fontSize: 14,
              color: colors.gray_600,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
            What's New
          </Text>

          <View
            style={{
              flex: 1,
              backgroundColor: colors.gray_100,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.gray_200,
            }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 8 }}>
              <Text
                style={{
                  fontFamily: 'Poppins-Regular',
                  fontSize: 15,
                  color: colors.gray_700,
                  lineHeight: 24,
                }}>
                {info.releaseNotes}
              </Text>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Spacer when no release notes */}
      {!info.releaseNotes && <View style={{ flex: 1 }} />}

      {/* Action Buttons */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 16,
          paddingTop: 24,
        }}>
        {/* Primary Button - Update Now */}
        <TouchableOpacity
          onPress={onUpdateNow}
          activeOpacity={0.9}
          style={{
            borderRadius: 16,
            overflow: 'hidden',
            shadowColor: colors.orange,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 10,
          }}>
          <View style={{ height: 56 }}>
            <Svg style={{ position: 'absolute' }} width="100%" height="100%">
              <Defs>
                <LinearGradient id="buttonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={colors.orange} />
                  <Stop offset="100%" stopColor={colors.secondary_100} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#buttonGradient)" />
            </Svg>
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
              }}>
              <Ionicons name="arrow-up-circle" size={22} color="white" style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontFamily: 'Poppins-SemiBold',
                  fontSize: 17,
                  color: 'white',
                  letterSpacing: 0.3,
                }}>
                Update Now
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Secondary Button - Later (only for optional updates) */}
        {!info.mandatory && onDismiss && (
          <TouchableOpacity
            onPress={handleClose}
            activeOpacity={0.7}
            style={{
              marginTop: 12,
              paddingVertical: 16,
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontFamily: 'Poppins-Medium',
                fontSize: 16,
                color: colors.gray_500,
              }}>
              Remind Me Later
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  // iOS uses native pageSheet presentation
  if (Platform.OS === 'ios') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={!info.mandatory ? handleClose : undefined}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'white',
          }}>
          {/* Handle Bar */}
          <View
            style={{
              alignItems: 'center',
              paddingTop: 12,
            }}>
            <View
              style={{
                width: 40,
                height: 5,
                backgroundColor: colors.gray_200,
                borderRadius: 3,
              }}
            />
          </View>

          {renderContent()}
        </View>
      </Modal>
    );
  }

  // Android uses custom animated bottom sheet
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={!info.mandatory ? handleClose : undefined}>
      {/* Backdrop */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          opacity: backdropOpacity,
        }}>
        <Pressable style={{ flex: 1 }} onPress={!info.mandatory ? handleClose : undefined} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: SHEET_HEIGHT,
          backgroundColor: 'white',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          transform: [{ translateY }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 25,
        }}>
        {/* Handle Bar */}
        <View
          style={{
            alignItems: 'center',
            paddingTop: 12,
          }}>
          <View
            style={{
              width: 40,
              height: 5,
              backgroundColor: colors.gray_200,
              borderRadius: 3,
            }}
          />
        </View>

        {renderContent()}
      </Animated.View>
    </Modal>
  );
};

export default UpdateModal;
