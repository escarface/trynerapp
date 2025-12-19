import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
  Animated,
  Platform,
} from 'react-native';
import { colors, typography, spacing, borderRadius, borderWidth } from '@/core/theme';

export interface InputProps extends TextInputProps {
  /** Input label */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Icon to display on the left */
  leftIcon?: React.ReactNode;
  /** Icon to display on the right */
  rightIcon?: React.ReactNode;
  /** Container style override */
  containerStyle?: ViewStyle;
  /** Whether the input is required */
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  required = false,
  style,
  editable = true,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  const shadowAnim = useRef(new Animated.Value(0)).current;

  const hasError = Boolean(error);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(borderColorAnim, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(shadowAnim, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isFocused]);

  const animatedBorderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.neutral.border, hasError ? colors.error[500] : colors.primary[500]],
  });

  const animatedShadowOpacity = shadowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });

  const inputContainerStyles = [
    styles.inputContainer,
    !editable && styles.inputContainerDisabled,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <Animated.View
        style={[
          inputContainerStyles,
          {
            borderColor: animatedBorderColor,
            borderWidth: isFocused ? borderWidth.medium : borderWidth.thin,
            ...Platform.select({
              ios: {
                shadowColor: hasError ? colors.error[500] : colors.primary[500],
                shadowOpacity: animatedShadowOpacity,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 8,
              },
              android: {
                elevation: isFocused ? 3 : 0,
              },
            }),
          },
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.neutral.placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={editable}
          {...props}
        />

        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </Animated.View>

      {(error || helperText) && (
        <Text style={[styles.helperText, hasError && styles.errorText]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  label: {
    ...typography.label,
    color: colors.neutral.text,
    marginBottom: spacing.xs,
  },

  required: {
    color: colors.error[500],
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: colors.neutral.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },

  inputContainerDisabled: {
    backgroundColor: colors.neutral.backgroundSecondary,
    opacity: 0.6,
  },

  input: {
    flex: 1,
    ...typography.body,
    color: colors.neutral.text,
    padding: 0,
  },

  iconLeft: {
    marginRight: spacing.sm,
  },

  iconRight: {
    marginLeft: spacing.sm,
  },

  helperText: {
    ...typography.caption,
    color: colors.neutral.textTertiary,
    marginTop: spacing.xs,
  },

  errorText: {
    color: colors.error[500],
    fontWeight: '500',
  },
});

// Specialized Input components
export const PasswordInput: React.FC<Omit<InputProps, 'secureTextEntry'>> = (props) => {
  const [showPassword, setShowPassword] = useState(false);

  const EyeIcon = () => (
    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
      <Text style={{ color: colors.neutral.textSecondary, fontSize: 20 }}>
        {showPassword ? '👁️' : '👁️‍🗨️'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Input
      {...props}
      secureTextEntry={!showPassword}
      rightIcon={<EyeIcon />}
      autoCapitalize="none"
      autoCorrect={false}
    />
  );
};

export default Input;
