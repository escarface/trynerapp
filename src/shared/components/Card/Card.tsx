import React from 'react';
import { View, StyleSheet, ViewProps, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '@/core/theme';

export type CardVariant = 'flat' | 'elevated' | 'outlined';

export interface CardProps extends ViewProps {
  /** Visual variant of the card */
  variant?: CardVariant;
  /** Whether the card is pressable */
  onPress?: () => void;
  /** Children components */
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  onPress,
  children,
  style,
  ...props
}) => {
  const cardStyles = [styles.base, styles[variant], style];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.7}
        {...(props as TouchableOpacityProps)}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.neutral.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },

  flat: {
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },

  elevated: {
    ...shadows.md,
  },

  outlined: {
    borderWidth: 2,
    borderColor: colors.neutral.border,
  },
});

export default Card;
