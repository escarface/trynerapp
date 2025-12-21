/**
 * PreWorkoutScreen - Countdown Before Workout
 * TrynerApp - Workout Feature
 *
 * 3-2-1 countdown screen before starting active workout.
 *
 * Flow:
 * 1. Show countdown: 3 → 2 → 1 → GO!
 * 2. Auto-navigate to ActiveWorkoutScreen
 */

import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import Screen from '@/shared/components/Screen';
import Text from '@/shared/components/Text';
import Button from '@/shared/components/Button';
import { colors, spacing } from '@/core/theme';
import { useWorkoutSessionStore } from '../stores/workoutSessionStore';

export const PreWorkoutScreen = () => {
  const navigation = useNavigation();
  const { config, startSession } = useWorkoutSessionStore();
  const [countdown, setCountdown] = useState(3);

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Countdown effect
  useEffect(() => {
    // Animate countdown number
    scaleAnim.setValue(0);
    fadeAnim.setValue(1);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        speed: 20,
        bounciness: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();

    // Haptic feedback on each count
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Decrement countdown
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle navigation when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      // GO! - navigate to active workout
      startSession();
      navigation.navigate('ActiveWorkout' as never);
    }
  }, [countdown, navigation, startSession]);

  const handleCancel = () => {
    navigation.goBack();
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

  return (
    <Screen safeAreaEdges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Workout Info */}
        <View style={styles.header}>
          <Text variant="h3" style={styles.exerciseName}>
            {config.exerciseName}
          </Text>
          <Text variant="bodyLarge" style={styles.workoutDetails}>
            {config.totalSets} sets × {config.targetRepsPerSet} reps
          </Text>
        </View>

        {/* Countdown Display */}
        <View style={styles.countdownContainer}>
          <Text variant="label" style={styles.getReadyText}>
            PREPÁRATE
          </Text>

          {countdown > 0 ? (
            <Animated.View
              style={[
                styles.countdownCircle,
                {
                  transform: [{ scale: scaleAnim }],
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ]}
            >
              <Animated.Text
                style={[
                  styles.countdownNumber,
                  {
                    opacity: fadeAnim,
                  },
                ]}
              >
                {countdown}
              </Animated.Text>
            </Animated.View>
          ) : (
            <View style={styles.goContainer}>
              <Text style={styles.goText}>GO!</Text>
            </View>
          )}
        </View>

        {/* Cancel Button */}
        <View style={styles.footer}>
          <Button
            title="Cancelar"
            variant="ghost"
            onPress={handleCancel}
            disabled={countdown === 0}
          />
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },

  header: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },

  exerciseName: {
    color: colors.neutral[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },

  workoutDetails: {
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },

  countdownContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  getReadyText: {
    color: colors.neutral.textSecondary,
    marginBottom: spacing.xxl,
    letterSpacing: 2,
  },

  countdownCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.primary[50],
    borderWidth: 8,
    borderColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },

  countdownNumber: {
    fontSize: 120,
    fontWeight: '800',
    color: colors.primary[500],
  },

  goContainer: {
    paddingHorizontal: spacing.xxl,
  },

  goText: {
    fontSize: 96,
    fontWeight: '800',
    color: colors.success[500],
    textAlign: 'center',
  },

  footer: {
    paddingBottom: spacing.lg,
  },
});

export default PreWorkoutScreen;
