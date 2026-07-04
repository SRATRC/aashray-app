import { ChevronLeft, X, Eye, EyeOff, Phone, Copy, Check } from 'lucide-react-native';

export const icons = {
  'chevron-left': ChevronLeft,
  close: X,
  eye: Eye,
  'eye-off': EyeOff,
  phone: Phone,
  copy: Copy,
  check: Check,
} as const;

export type IconName = keyof typeof icons;
