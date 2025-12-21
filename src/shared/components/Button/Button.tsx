import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  PressableProps,
  Animated,
  Platform,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/core/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  /** Button text */
  title: string;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Loading state */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Custom style override */
  style?: ViewStyle | ViewStyle[];
  /** Custom text style override */
  textStyle?: TextStyle;
  /** Icon to display before text (React element) */
  leftIcon?: React.ReactNode;
  /** Icon to display after text (React element) */
  rightIcon?: React.ReactNode;
  /** Disable press animation */
  disableAnimation?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'large',
  loading = false,
  fullWidth = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  disableAnimation = false,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disableAnimation || disabled || loading) return;

    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    if (disableAnimation || disabled || loading) return;

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  const buttonStyles = [
    styles.base,
    styles[size],
    styles[variant],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${size}Text`],
    styles[`${variant}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  const getActivityIndicatorColor = () => {
    if (variant === 'primary' || variant === 'secondary') {
      return colors.neutral.white;
    }
    return colors.primary[500];
  };

  return (
    <Pressable
      disabled={disabled || loading}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      <Animated.View
        style={[
          buttonStyles,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={getActivityIndicatorColor()}
            size={size === 'small' ? 'small' : 'large'}
          />
        ) : (
          <>
            {leftIcon && <>{leftIcon}</>}
            <Text style={textStyles}>{title}</Text>
            {rightIcon && <>{rightIcon}</>}
          </>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  // Base styles
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    overflow: 'hidden',
  },

  // Sizes
  large: {
    height: 56,
    paddingHorizontal: spacing.xl,
  },

  medium: {
    height: 48,
    paddingHorizontal: spacing.lg,
  },

  small: {
    height: 40,
    paddingHorizontal: spacing.md,
  },

  fullWidth: {
    width: '100%',
  },

  // Variants with enhanced depth
  primary: {
    backgroundColor: colors.primary[500],
    ...Platform.select({
      ios: {
        shadowColor: colors.primary[700],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  secondary: {
    backgroundColor: colors.neutral[800],
    ...Platform.select({
      ios: {
        shadowColor: colors.neutral[900],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary[500],
  },

  ghost: {
    backgroundColor: 'transparent',
  },

  // Disabled state
  disabled: {
    opacity: 0.4,
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },

  // Text styles
  text: {
    ...typography.button,
    fontWeight: '600',
  },

  largeText: {
    ...typography.buttonLarge,
  },

  mediumText: {
    fontSize: 16,
    fontWeight: '600',
  },

  smallText: {
    ...typography.buttonSmall,
  },

  // Variant text colors
  primaryText: {
    color: colors.neutral.white,
  },

  secondaryText: {
    color: colors.neutral.white,
  },

  outlineText: {
    color: colors.primary[500],
    fontWeight: '600',
  },

  ghostText: {
    color: colors.primary[500],
    fontWeight: '600',
  },

  disabledText: {
    opacity: 1, // Controlled by container opacity
  },
});

export default Button;
