/**
 * WorkoutSummaryScreen - Post-Workout Summary
 * TrynerApp - Workout Feature
 *
 * Displays workout summary and saves to database.
 *
 * Features:
 * - Overall score (CircularProgress)
 * - Total reps, duration, average score
 * - Per-set breakdown
 * - Save to database
 * - Navigate back to home
 */

import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ScrollView, Animated, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Screen from '@/shared/components/Screen';
import Text from '@/shared/components/Text';
import Button from '@/shared/components/Button';
import StatCard from '@/shared/components/StatCard';
import CircularProgress from '@/shared/components/CircularProgress';
import { colors, spacing } from '@/core/theme';
import { useWorkoutSessionStore } from '../stores/workoutSessionStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
  createWorkoutSession,
  createExerciseSet,
  endWorkoutSession,
} from '@/core/database/workoutOperations';

export const WorkoutSummaryScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const {
    config,
    completedSets,
    sessionId,
    getTotalReps,
    getSessionDuration,
    getAverageScore,
    reset,
  } = useWorkoutSessionStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        speed: 12,
        bounciness: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-save workout to database
    saveWorkout();
  }, []);

  const saveWorkout = async () => {
    if (!config || !user || isSaved) return;

    setIsSaving(true);

    try {
      // Create workout session in DB
      const dbSessionId = await createWorkoutSession(user.id, config.exerciseId);

      // Save each completed set
      for (const set of completedSets) {
        await createExerciseSet({
          sessionId: dbSessionId.id,
          exerciseId: config.exerciseId,
          setNumber: set.setNumber,
          repsCompleted: set.repsCompleted,
          targetReps: config.targetRepsPerSet,
          duration: set.duration,
          score: set.averageScore,
          stabilityScore: 0, // MVP: Simplified scoring
          rangeScore: 0,
          consistencyScore: 0,
          rawData: set.reps, // Store all rep details
        });
      }

      // End session with total score
      await endWorkoutSession(dbSessionId.id, getAverageScore());

      setIsSaved(true);
      console.log('[WorkoutSummary] Workout saved successfully');
    } catch (error) {
      console.error('[WorkoutSummary] Error saving workout:', error);
      Alert.alert('Error', 'No se pudo guardar el workout. Por favor intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinish = () => {
    reset();
    navigation.navigate('Home' as never);
  };

  // Handle missing config in useEffect to avoid setState during render
  useEffect(() => {
    if (!config) {
      navigation.goBack();
    }
  }, [config, navigation]);

  if (!config) {
    // No workout configured - return null and let useEffect handle navigation
    return null;
  }

  const totalReps = getTotalReps();
  const duration = getSessionDuration();
  const averageScore = getAverageScore();

  // Format duration
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <Screen scroll safeAreaEdges={['top', 'bottom']}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Celebration Header */}
        <View style={styles.header}>
          <Text style={styles.celebration}>🎉</Text>
          <Text variant="h2" style={styles.title}>
            ¡Workout Completado!
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {config.exerciseName}
          </Text>
        </View>

        {/* Overall Score */}
        <View style={styles.scoreSection}>
          <CircularProgress value={averageScore} size={180} strokeWidth={14} />
        </View>

        {/* Overall Stats */}
        <View style={styles.statsRow}>
          <StatCard
            icon="💪"
            value={totalReps}
            label="Total Reps"
            accentColor={colors.primary[500]}
          />
          <StatCard
            icon="⏱️"
            value={formattedDuration}
            label="Tiempo"
            accentColor={colors.neutral[600]}
          />
          <StatCard
            icon="📊"
            value={completedSets.length}
            label="Sets"
            accentColor={colors.success[500]}
          />
        </View>

        {/* Set Breakdown */}
        <View style={styles.breakdown}>
          <Text variant="label" style={styles.breakdownTitle}>
            DESGLOSE POR SET
          </Text>

          {completedSets.map((set) => (
            <View key={set.setNumber} style={styles.setCard}>
              <View style={styles.setHeader}>
                <Text variant="bodyBold" style={styles.setNumber}>
                  Set {set.setNumber}
                </Text>
                <View style={styles.setBadge}>
                  <Text variant="caption" style={styles.setBadgeText}>
                    {set.repsCompleted} reps
                  </Text>
                </View>
              </View>

              <View style={styles.setStats}>
                <View style={styles.setStat}>
                  <Text variant="caption" style={styles.setStatLabel}>
                    Score
                  </Text>
                  <Text variant="metricSmall" style={styles.setStatValue}>
                    {set.averageScore}
                  </Text>
                </View>
                <View style={styles.setStat}>
                  <Text variant="caption" style={styles.setStatLabel}>
                    Tiempo
                  </Text>
                  <Text variant="metricSmall" style={styles.setStatValue}>
                    {Math.floor(set.duration / 1000)}s
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {isSaving && (
            <Text variant="caption" style={styles.savingText}>
              Guardando workout...
            </Text>
          )}

          <Button
            title="Finalizar"
            variant="primary"
            size="large"
            fullWidth
            onPress={handleFinish}
            disabled={isSaving}
          />
        </View>
      </Animated.View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },

  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },

  celebration: {
    fontSize: 64,
    marginBottom: spacing.md,
  },

  title: {
    color: colors.neutral[900],
    marginBottom: spacing.xs,
    textAlign: 'center',
  },

  subtitle: {
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },

  scoreSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },

  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },

  breakdown: {
    marginBottom: spacing.xxl,
  },

  breakdownTitle: {
    color: colors.neutral.textSecondary,
    marginBottom: spacing.md,
    letterSpacing: 1.5,
  },

  setCard: {
    backgroundColor: colors.neutral.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },

  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  setNumber: {
    color: colors.neutral[900],
  },

  setBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
  },

  setBadgeText: {
    color: colors.primary[700],
    fontWeight: '600',
  },

  setStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },

  setStat: {
    flex: 1,
  },

  setStatLabel: {
    color: colors.neutral.textTertiary,
    marginBottom: spacing.xs / 2,
  },

  setStatValue: {
    color: colors.neutral[900],
  },

  actions: {
    gap: spacing.sm,
  },

  savingText: {
    color: colors.neutral.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});

export default WorkoutSummaryScreen;
