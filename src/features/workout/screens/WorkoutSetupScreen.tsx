/**
 * WorkoutSetupScreen - Workout Configuration
 * TrynerApp - Workout Feature
 *
 * Allows user to configure workout parameters before starting.
 *
 * Features:
 * - Exercise selection (MVP: only Squats)
 * - Sets configuration
 * - Reps per set configuration
 * - Start workout button
 */

import React, { useState, useRef } from 'react';
import { StyleSheet, View, Animated, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Screen from '@/shared/components/Screen';
import Text from '@/shared/components/Text';
import Button from '@/shared/components/Button';
import { colors, spacing, borderRadius } from '@/core/theme';
import { useWorkoutSessionStore } from '../stores/workoutSessionStore';
import { useAuthStore } from '@/features/auth/store/authStore';

export const WorkoutSetupScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { configureWorkout } = useWorkoutSessionStore();

  const [sets, setSets] = useState(3);
  const [repsPerSet, setRepsPerSet] = useState(10);

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        speed: 12,
        bounciness: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleStartWorkout = () => {
    if (!user) {
      Alert.alert('Error', 'Usuario no autenticado');
      return;
    }

    // Configure workout session
    configureWorkout({
      exerciseId: 'squat-001', // MVP: hardcoded Squats
      exerciseName: 'Sentadillas',
      totalSets: sets,
      targetRepsPerSet: repsPerSet,
      userId: user.id,
    });

    // Navigate to PreWorkout countdown
    navigation.navigate('PreWorkout' as never);
  };

  const incrementSets = () => setSets((prev) => Math.min(prev + 1, 10));
  const decrementSets = () => setSets((prev) => Math.max(prev - 1, 1));

  const incrementReps = () => setRepsPerSet((prev) => Math.min(prev + 5, 50));
  const decrementReps = () => setRepsPerSet((prev) => Math.max(prev - 5, 5));

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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>💪</Text>
          </View>
          <Text variant="h1" style={styles.title}>
            Configurar Workout
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Ajusta tus series y repeticiones
          </Text>
        </View>

        {/* Exercise Card (MVP: only Squats) */}
        <View style={styles.exerciseCard}>
          <Text variant="label" style={styles.exerciseLabel}>
            EJERCICIO
          </Text>
          <Text variant="h3" style={styles.exerciseName}>
            🏋️ Sentadillas
          </Text>
          <Text variant="bodySmall" style={styles.exerciseDescription}>
            Detección automática con acelerómetro
          </Text>
        </View>

        {/* Sets Configuration */}
        <View style={styles.configSection}>
          <Text variant="label" style={styles.configLabel}>
            SERIES
          </Text>
          <View style={styles.configRow}>
            <Button
              title="-"
              variant="secondary"
              size="medium"
              onPress={decrementSets}
              style={styles.counterButton}
            />
            <View style={styles.valueContainer}>
              <Text variant="scoreLarge" style={styles.configValue}>
                {sets}
              </Text>
            </View>
            <Button
              title="+"
              variant="secondary"
              size="medium"
              onPress={incrementSets}
              style={styles.counterButton}
            />
          </View>
        </View>

        {/* Reps Configuration */}
        <View style={styles.configSection}>
          <Text variant="label" style={styles.configLabel}>
            REPETICIONES POR SERIE
          </Text>
          <View style={styles.configRow}>
            <Button
              title="-"
              variant="secondary"
              size="medium"
              onPress={decrementReps}
              style={styles.counterButton}
            />
            <View style={styles.valueContainer}>
              <Text variant="scoreLarge" style={styles.configValue}>
                {repsPerSet}
              </Text>
            </View>
            <Button
              title="+"
              variant="secondary"
              size="medium"
              onPress={incrementReps}
              style={styles.counterButton}
            />
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Text variant="bodyLarge" style={styles.summaryText}>
            Total: <Text variant="bodyBold">{sets} series × {repsPerSet} reps = {sets * repsPerSet} reps</Text>
          </Text>
        </View>

        {/* Start Button */}
        <Button
          title="Iniciar Workout"
          variant="primary"
          size="large"
          fullWidth
          onPress={handleStartWorkout}
          style={styles.startButton}
        />

        {/* Info */}
        <View style={styles.infoBox}>
          <Text variant="caption" style={styles.infoText}>
            💡 Coloca tu teléfono en el bolsillo del pantalón para mejor detección
          </Text>
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
    marginBottom: spacing.xxl,
  },

  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  icon: {
    fontSize: 48,
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

  exerciseCard: {
    backgroundColor: colors.neutral.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    borderWidth: 2,
    borderColor: colors.primary[500],
  },

  exerciseLabel: {
    color: colors.primary[500],
    marginBottom: spacing.sm,
  },

  exerciseName: {
    color: colors.neutral[900],
    marginBottom: spacing.xs,
  },

  exerciseDescription: {
    color: colors.neutral.textSecondary,
  },

  configSection: {
    marginBottom: spacing.xl,
  },

  configLabel: {
    color: colors.neutral.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },

  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },

  counterButton: {
    width: 60,
    height: 60,
  },

  valueContainer: {
    minWidth: 120,
    alignItems: 'center',
  },

  configValue: {
    color: colors.primary[500],
  },

  summary: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xxl,
    alignItems: 'center',
  },

  summaryText: {
    color: colors.neutral[900],
    textAlign: 'center',
  },

  startButton: {
    marginBottom: spacing.lg,
  },

  infoBox: {
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },

  infoText: {
    color: colors.neutral.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default WorkoutSetupScreen;
