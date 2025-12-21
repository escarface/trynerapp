/**
 * RepCounter - Animated Rep Counter
 * TrynerApp - Workout Feature
 *
 * Large animated counter display for real-time rep tracking.
 *
 * Features:
 * - Zero re-renders with Reanimated shared values
 * - Tabular numerals for aligned digits
 *
 * Usage:
 * ```typescript
 * <RepCounter repCount={repCount} /> // repCount is SharedValue<number>
 * ```
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { colors, typography, spacing } from '@/core/theme';
import Text from '@/shared/components/Text';

interface RepCounterProps {
  /** Shared value for rep count (zero re-renders) */
  repCount: ReturnType<typeof useSharedValue<number>>;

  /** Optional label text */
  label?: string;

  /** Optional size variant */
  size?: 'large' | 'medium';
}

export const RepCounter: React.FC<RepCounterProps> = ({
  repCount,
  label = 'REPS',
  size = 'large',
}) => {
  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.counter,
          size === 'large' ? styles.counterLarge : styles.counterMedium,
        ]}
      >
        {repCount.value}
      </Animated.Text>

      <Text variant="label" style={styles.label}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },

  counter: {
    ...typography.counterHero,
    color: colors.primary[500],
    textAlign: 'center',
    lineHeight: undefined, // Let system calculate optimal line height
  },

  counterLarge: {
    fontSize: 140,
    fontWeight: '800',
  },

  counterMedium: {
    fontSize: 96,
    fontWeight: '700',
  },

  label: {
    color: colors.neutral.textSecondary,
    marginTop: spacing.sm,
    letterSpacing: 1.2,
  },
});

export default RepCounter;
