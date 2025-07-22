import { Platform } from 'react-native';
import { useBottomTabOverflow } from '@/components/TabBarBackground';

/**
 * Custom hook to get the appropriate bottom padding for scrollable content
 * that needs to account for the tab bar on iOS
 */
export const useTabBarPadding = () => {
  const tabBarHeight = useBottomTabOverflow();
  
  return Platform.OS === 'ios' ? tabBarHeight + 20 : 20;
};
