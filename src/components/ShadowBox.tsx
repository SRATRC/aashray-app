import { TouchableOpacity, Platform, View, ActivityIndicator } from 'react-native';
import type { TouchableOpacityProps, ViewProps } from 'react-native';

type ShadowIntensity = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'neomorphic';
type Variant = 'default' | 'card' | 'button' | 'input' | 'neomorphic';

interface BaseShadowBoxProps {
  children: React.ReactNode;
  intensity?: ShadowIntensity;
  variant?: Variant;
  isDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

interface ShadowBoxTouchableProps
  extends BaseShadowBoxProps,
    Omit<TouchableOpacityProps, 'children'> {
  interactive?: true;
  onPress: TouchableOpacityProps['onPress'];
}

interface ShadowBoxViewProps extends BaseShadowBoxProps, Omit<ViewProps, 'children'> {
  interactive?: false;
  onPress?: never;
}

type ShadowBoxProps = ShadowBoxTouchableProps | ShadowBoxViewProps;

const shadowClasses: Record<ShadowIntensity, string> = {
  none: '',
  sm: Platform.OS === 'ios' ? 'shadow-sm shadow-gray-100' : 'shadow-md shadow-gray-300',
  md: Platform.OS === 'ios' ? 'shadow-md shadow-gray-200' : 'shadow-lg shadow-gray-400',
  lg: Platform.OS === 'ios' ? 'shadow-lg shadow-gray-200' : 'shadow-2xl shadow-gray-400',
  xl: Platform.OS === 'ios' ? 'shadow-xl shadow-gray-300' : 'shadow-2xl shadow-gray-500',
  neomorphic: Platform.OS === 'ios' ? 'shadow-md shadow-gray-300' : 'shadow-lg shadow-gray-400',
};

const variantClasses: Record<Variant, string> = {
  default: '',
  card: 'rounded-2xl p-4',
  button: 'rounded-xl px-6 py-3',
  input: 'rounded-lg p-3',
  neomorphic: 'rounded-2xl p-4 bg-gray-50 border border-gray-200',
};

export function ShadowBox({
  children,
  intensity = 'lg',
  variant = 'default',
  isDisabled = false,
  isLoading = false,
  className = '',
  interactive,
  ...props
}: ShadowBoxProps) {
  // A caller that didn't explicitly pass `interactive` gets true for the
  // "button" variant (styled as a button should be tappable by default) and
  // false otherwise — the root cause of a prior bug where ShadowButton
  // silently rendered as a non-touchable View. An explicit interactive={true
  // | false} from the caller always wins.
  const isInteractive = interactive ?? variant === 'button';
  const shadowClass = shadowClasses[intensity];
  const variantClass = variantClasses[variant];
  const disabledClass = isDisabled ? 'opacity-50' : '';

  const baseClassName = `${variantClass} ${shadowClass} ${disabledClass} ${className}`;

  if (isInteractive && 'onPress' in props) {
    return (
      <TouchableOpacity
        className={baseClassName}
        disabled={isDisabled || isLoading}
        activeOpacity={0.7}
        {...(props as TouchableOpacityProps)}>
        {isLoading ? (
          <View className="items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : (
          children
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View className={baseClassName} {...(props as ViewProps)}>
      {children}
    </View>
  );
}

// Convenience exports for common patterns
export function ShadowCard({
  children,
  className = '',
  interactive,
  variant,
  ...props
}: Omit<ShadowBoxViewProps, 'variant' | 'interactive'> & { interactive?: never; variant?: never }) {
  return (
    <ShadowBox interactive={false} variant="card" className={className} {...props}>
      {children}
    </ShadowBox>
  );
}

export function ShadowButton({
  children,
  className = '',
  ...props
}: Omit<ShadowBoxTouchableProps, 'variant'>) {
  return (
    <ShadowBox {...props} variant="button" interactive={true} className={className}>
      {children}
    </ShadowBox>
  );
}

// New neomorphic component
export function NeomorphicBox({
  children,
  className = '',
  interactive,
  variant,
  intensity,
  ...props
}: Omit<ShadowBoxViewProps, 'variant' | 'interactive' | 'intensity'> & {
  interactive?: never;
  variant?: never;
  intensity?: never;
}) {
  return (
    <ShadowBox
      interactive={false}
      variant="neomorphic"
      intensity="neomorphic"
      className={className}
      {...props}>
      {children}
    </ShadowBox>
  );
}
