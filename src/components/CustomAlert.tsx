import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, Dimensions } from 'react-native';

interface AlertButton {
  text?: string;
  onPress?: () => void | Promise<void>;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
}

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: AlertOptions;
}

class CustomAlertService {
  private static changeListener: ((state: AlertState) => void) | null = null;
  private static currentState: AlertState = {
    visible: false,
    title: '',
  };

  static setChangeListener(listener: (state: AlertState) => void) {
    this.changeListener = listener;
  }

  static alert(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
  ) {
    this.currentState = {
      visible: true,
      title,
      message,
      buttons,
      options,
    };
    this.changeListener?.(this.currentState);
  }

  static close() {
    this.currentState = {
      ...this.currentState,
      visible: false,
    };
    this.changeListener?.(this.currentState);
  }
}

export const CustomAlert = () => {
  const [state, setState] = useState<AlertState>({
    visible: false,
    title: '',
  });

  useEffect(() => {
    CustomAlertService.setChangeListener(setState);
    return () => CustomAlertService.setChangeListener(() => {});
  }, []);

  const handleClose = () => {
    if (state.options?.cancelable !== false) {
      CustomAlertService.close();
      state.options?.onDismiss?.();
    }
  };

  const handleButtonPress = async (btn: AlertButton) => {
    if (btn.onPress) {
      await btn.onPress();
    }
    CustomAlertService.close();
  };

  if (!state.visible) return null;

  // Default button if none provided
  const buttons = state.buttons && state.buttons.length > 0 ? state.buttons : [{ text: 'OK', style: 'default' }];

  return (
    <Modal
      transparent
      animationType="fade"
      visible={state.visible}
      onRequestClose={handleClose}
      statusBarTranslucent={true}>
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
        <View
          className="w-full max-w-[340px] rounded-xl bg-white p-6"
          style={{
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
          }}>
          
          {/* Content */}
          <View className="mb-8">
            <Text className="mb-2 text-left font-psemibold text-xl text-gray-900">
              {state.title}
            </Text>
            
            {state.message && (
              <Text className="text-left font-pregular text-base text-gray-600 leading-6">
                {state.message}
              </Text>
            )}
          </View>

          {/* Buttons */}
          <View className="flex-row justify-end gap-3 flex-wrap">
            {buttons.map((btn, index) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              
              // Cancel / Secondary: Text Button
              if (isCancel) {
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleButtonPress(btn)}
                    activeOpacity={0.6}
                    className="px-4 py-2 rounded-lg"
                  >
                    <Text className="font-pmedium text-base text-gray-500">
                      {btn.text || 'Cancel'}
                    </Text>
                  </TouchableOpacity>
                );
              }

              // Primary / Destructive: Solid Button
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleButtonPress(btn)}
                  activeOpacity={0.8}
                  className={`
                    px-5 py-2 rounded-lg items-center justify-center
                    ${isDestructive ? 'bg-red-500' : 'bg-secondary'}
                  `}
                >
                  <Text className="font-psemibold text-base text-white">
                    {btn.text || 'OK'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default {
  alert: CustomAlertService.alert.bind(CustomAlertService),
  close: CustomAlertService.close.bind(CustomAlertService),
};
