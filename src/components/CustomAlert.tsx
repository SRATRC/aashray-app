import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';

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
  /** Identifies which alert() call this state belongs to, so a close aimed at
   * an earlier alert cannot dismiss a newer one shown in the meantime. */
  id?: number;
}

class CustomAlertService {
  private static changeListener: ((state: AlertState) => void) | null = null;
  private static nextId = 0;
  private static currentState: AlertState = {
    visible: false,
    title: '',
  };

  static setChangeListener(listener: (state: AlertState) => void) {
    this.changeListener = listener;
  }

  static alert(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) {
    this.nextId += 1;
    this.currentState = {
      visible: true,
      title,
      message,
      buttons,
      options,
      id: this.nextId,
    };
    this.changeListener?.(this.currentState);
  }

  /**
   * Close the alert identified by `token`, or whatever is open when no token
   * is given. A button's onPress may itself call alert() — the follow-up
   * confirmation pattern — and the token stops the original button's cleanup
   * close from tearing down that replacement alert.
   */
  static close(token?: number) {
    if (token !== undefined && token !== this.currentState.id) return;
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
    // Capture which alert this button belongs to before awaiting: onPress can
    // open a new alert, and this close must not dismiss that one.
    const token = state.id;
    if (btn.onPress) {
      await btn.onPress();
    }
    CustomAlertService.close(token);
  };

  if (!state.visible) return null;

  // Default button if none provided
  const buttons: AlertButton[] =
    state.buttons && state.buttons.length > 0 ? state.buttons : [{ text: 'OK', style: 'default' }];

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
              <Text className="text-left font-pregular text-base leading-6 text-gray-600">
                {state.message}
              </Text>
            )}
          </View>

          {/* Buttons */}
          <View className="flex-row flex-wrap justify-end gap-3">
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
                    className="rounded-lg px-4 py-2">
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
                    items-center justify-center rounded-lg px-5 py-2
                    ${isDestructive ? 'bg-red-500' : 'bg-secondary'}
                  `}>
                  <Text className="font-psemibold text-base text-white">{btn.text || 'OK'}</Text>
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
