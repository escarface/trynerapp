/**
 * WorkoutStats - Workout Statistics Display
 * TrynerApp - Workout Feature
 *
 * Displays key workout metrics in stat cards.
 *
 * Features:
 * - Three cards: Reps, Time, Score
 * - Real-time updates
 * - Formatted time display (MM:SS)
 *
 * Usage:
 * ```typescript
 * <WorkoutStats
 *   reps={12}
 *   duration={154000}
 *   score={85}
 * />
 * ```
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import StatCard from '@/shared/components/StatCard';
import { colors, spacing } from '@/core/theme';

interface WorkoutStatsProps {
  /** Total reps completed */
  reps: number;

  /** Duration in milliseconds */
  duration: number;

  /** Average score (0-100) */
  score: number;
}

export const WorkoutStats: React.FC<WorkoutStatsProps> = ({
  reps,
  duration,
  score,
}) => {
  // Sanitize values to prevent NaN
  const safeReps = React.useMemo(() => {
    return typeof reps === 'number' && isFinite(reps) ? Math.max(0, Math.floor(reps)) : 0;
  }, [reps]);

  const safeDuration = React.useMemo(() => {
    return typeof duration === 'number' && isFinite(duration) ? Math.max(0, duration) : 0;
  }, [duration]);

  const safeScore = React.useMemo(() => {
    if (typeof score !== 'number' || !isFinite(score)) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.floor(score)));
  }, [score]);

  // Format duration as MM:SS
  const formattedTime = useMemo(() => {
    const totalSeconds = Math.floor(safeDuration / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [safeDuration]);

  // Determine score color based on value
  const scoreColor = useMemo(() => {
    if (safeScore >= 85) return colors.success[500]; // Excellent
    if (safeScore >= 70) return colors.warning[500]; // Optimal
    if (safeScore >= 50) return colors.primary[500]; // Good
    return colors.neutral[500]; // Needs improvement
  }, [safeScore]);

  return (
    <View style={styles.container}>
      <StatCard
        icon="💪"
        value={safeReps}
        label="Reps"
        accentColor={colors.primary[500]}
      />

      <StatCard
        icon="⏱️"
        value={formattedTime}
        label="Tiempo"
        accentColor={colors.neutral[600]}
      />

      <StatCard
        icon="🔥"
        value={safeScore}
        label="Score"
        accentColor={scoreColor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
});

export default WorkoutStats;
