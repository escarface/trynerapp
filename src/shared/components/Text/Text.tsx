import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { typography, colors } from '@/core/theme';

export type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body'
  | 'bodyLarge'
  | 'bodyBold'
  | 'bodySmall'
  | 'callout'
  | 'label'
  | 'caption'
  | 'overline'
  | 'button'
  | 'metricSmall';

export type TextColor = 'primary' | 'secondary' | 'tertiary' | 'error' | 'success' | 'warning';

export interface TextProps extends RNTextProps {
  /** Typography variant */
  variant?: TextVariant;
  /** Text color semantic */
  color?: TextColor;
  /** Children content */
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'primary',
  style,
  children,
  ...props
}) => {
  const textStyles = [styles[variant], styles[`color_${color}`], style];

  return (
    <RNText style={textStyles} {...props}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  // Typography variants
  display: typography.display,
  h1: typography.h1,
  h2: typography.h2,
  h3: typography.h3,
  h4: typography.h4,
  body: typography.body,
  bodyLarge: typography.bodyLarge,
  bodyBold: typography.bodyBold,
  bodySmall: typography.bodySmall,
  callout: typography.callout,
  label: typography.label,
  caption: typography.caption,
  overline: typography.overline,
  button: typography.button,
  metricSmall: typography.metricSmall,

  // Color variants
  color_primary: {
    color: colors.neutral.text,
  },
  color_secondary: {
    color: colors.neutral.textSecondary,
  },
  color_tertiary: {
    color: colors.neutral.textTertiary,
  },
  color_error: {
    color: colors.error[500],
  },
  color_success: {
    color: colors.success[500],
  },
  color_warning: {
    color: colors.warning[500],
  },
});

export default Text;
