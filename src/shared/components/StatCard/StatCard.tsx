import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import Text from '../Text/Text';
import { colors, spacing, borderRadius } from '@/core/theme';

export interface StatCardProps {
  /** Icon or emoji to display */
  icon: string;
  /** Value to display */
  value: string | number;
  /** Label for the stat */
  label: string;
  /** Color accent for the card */
  accentColor?: string;
  /** Custom style */
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  accentColor = colors.primary[500],
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Icon Circle */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: `${accentColor}15`,
          },
        ]}
      >
        <Text style={[styles.icon, { color: accentColor }]}>{icon}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text variant="metricSmall" style={styles.value}>
          {value}
        </Text>
        <Text variant="caption" style={styles.label}>
          {label}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.neutral[900],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  icon: {
    fontSize: 24,
  },

  statsContainer: {
    flex: 1,
  },

  value: {
    color: colors.neutral[900],
    marginBottom: spacing.xs,
  },

  label: {
    color: colors.neutral.textTertiary,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default StatCard;
