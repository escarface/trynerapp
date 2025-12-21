/**
 * ActiveWorkoutScreen - Real-time Workout Execution
 * TrynerApp - Workout Feature
 *
 * SIMPLIFIED VERSION: Uses React state directly from useMotionEngine
 * No Reanimated shared values to prevent Expo Go crashes.
 *
 * Features:
 * - Live rep counter
 * - Accelerometer visualization
 * - Real-time stats
 * - Workout controls (pause/stop)
 */

import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Animated, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Screen from '@/shared/components/Screen';
import Text from '@/shared/components/Text';
import { AccelerometerGraph } from '../components/AccelerometerGraph';
import { WorkoutStats } from '../components/WorkoutStats';
import { WorkoutControls } from '../components/WorkoutControls';
import { useMotionEngine } from '@/motion-engine';
import { useWorkoutSessionStore } from '../stores/workoutSessionStore';
import { colors, spacing } from '@/core/theme';

export const ActiveWorkoutScreen = () => {
  const navigation = useNavigation();
  const {
    config,
    currentSet,
    completeSet,
    nextSet,
    endSession,
    isSessionComplete,
  } = useWorkoutSessionStore();

  const [isPaused, setIsPaused] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [currentSetReps, setCurrentSetReps] = useState<any[]>([]);
  const [currentSetStartTime, setCurrentSetStartTime] = useState(Date.now());

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Motion engine - now returns React state directly (no shared values)
  const {
    repCount,
    currentPhase,
    lastRepScore,
    isActive,
    accelerometerData,
    start,
    pause,
    resume,
    stop,
    getStatus,
  } = useMotionEngine({
    onRepDetected: (rep) => {
      try {
        setCurrentSetReps((prev) => {
          // Limit to last 50 reps to prevent memory issues
          const newArray = prev.length >= 50 ? prev.slice(-49) : prev.slice();
          newArray.push({
            repNumber: rep.repNumber,
            score: rep.score?.overall || 0,
            depth: rep.depth,
            duration: rep.duration,
          });
          return newArray;
        });
      } catch (error) {
        console.error('[ActiveWorkout] Error adding rep to set:', error);
      }
    },
    onError: (error) => {
      console.error('[ActiveWorkout] Motion engine error:', error);
      Alert.alert('Error', 'Problema con el acelerómetro. Por favor reinicia el workout.');
    },
  });

  // Track if we've logged first data
  const hasLoggedDataSyncRef = useRef(false);

  // Log first accelerometer data received
  useEffect(() => {
    if (!hasLoggedDataSyncRef.current && accelerometerData.length > 0 && __DEV__) {
      console.log(`[ActiveWorkout] ✅ First accelerometer data received: ${accelerometerData.length} samples`);
      hasLoggedDataSyncRef.current = true;
    }
  }, [accelerometerData]);

  // Check if target reps reached
  useEffect(() => {
    if (config && repCount >= config.targetRepsPerSet) {
      handleSetComplete();
    }
  }, [repCount, config]);

  // Start motion engine on mount
  useEffect(() => {
    if (__DEV__) {
      console.log('[ActiveWorkout] 🎬 Component mounted, initializing workout...');
    }
    let mounted = true;
    let interval: NodeJS.Timeout | null = null;

    const initializeWorkout = async () => {
      try {
        if (__DEV__) {
          console.log('[ActiveWorkout] Calling start()...');
        }
        await start();
        if (__DEV__) {
          console.log('[ActiveWorkout] ✅ start() completed');
        }

        if (!mounted) {
          if (__DEV__) {
            console.log('[ActiveWorkout] Component unmounted during start, aborting');
          }
          return;
        }

        // Start animations AFTER successful start
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

        // Update duration every second
        interval = setInterval(() => {
          if (mounted) {
            setSessionDuration(Date.now() - currentSetStartTime);
          }
        }, 1000);

        if (__DEV__) {
          console.log('[ActiveWorkout] ✅ Initialization complete');
        }
      } catch (error) {
        console.error('[ActiveWorkout] ❌ Failed to start:', error);
        Alert.alert(
          'Error del Acelerómetro',
          `No se pudo iniciar la detección de movimiento:\n\n${(error as Error).message}`,
          [
            {
              text: 'Volver',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    };

    initializeWorkout();

    return () => {
      if (__DEV__) {
        console.log('[ActiveWorkout] 🧹 Component unmounting, cleaning up...');
      }
      mounted = false;
      stop();
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  const handlePause = () => {
    pause();
    setIsPaused(true);
  };

  const handleResume = () => {
    resume();
    setIsPaused(false);
  };

  const handleSetComplete = () => {
    stop();

    // Calculate set metrics
    const duration = Date.now() - currentSetStartTime;
    const scores = currentSetReps
      .filter((rep) => rep.score)
      .map((rep) => rep.score);
    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      : 0;

    // Save set data
    completeSet({
      setNumber: currentSet,
      reps: currentSetReps,
      repsCompleted: currentSetReps.length,
      duration,
      averageScore,
      timestamp: Date.now(),
    });

    // Check if all sets completed
    if (isSessionComplete()) {
      endSession();
      navigation.navigate('WorkoutSummary' as never);
    } else {
      // Show rest screen or move to next set
      Alert.alert(
        'Set Completado',
        `¡Bien hecho! Has completado ${currentSetReps.length} reps.\n\n¿Listo para el siguiente set?`,
        [
          {
            text: 'Descansar',
            onPress: () => {
              handleNextSet();
            },
          },
          {
            text: 'Siguiente Set',
            onPress: handleNextSet,
          },
        ]
      );
    }
  };

  const handleNextSet = async () => {
    nextSet();
    setCurrentSetReps([]);
    setCurrentSetStartTime(Date.now());

    // Restart motion engine
    try {
      await start();
    } catch (error) {
      console.error('[ActiveWorkout] Error restarting:', error);
    }
  };

  const handleStop = () => {
    stop();
    endSession();
    navigation.navigate('WorkoutSummary' as never);
  };

  // Handle missing config in useEffect to avoid setState during render
  useEffect(() => {
    if (!config) {
      navigation.goBack();
    }
  }, [config, navigation]);

  if (!config) {
    return null;
  }

  const status = getStatus();

  return (
    <Screen scroll safeAreaEdges={['top']}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Set Progress */}
        <View style={styles.header}>
          <Text variant="label" style={styles.setProgress}>
            SET {currentSet} / {config.totalSets}
          </Text>
          <Text variant="bodyLarge" style={styles.exerciseName}>
            {config.exerciseName}
          </Text>
        </View>

        {/* Rep Counter - Simple display using React state */}
        <View style={styles.repCounterContainer}>
          <Text style={styles.repCounterText}>{repCount}</Text>
          <Text variant="label" style={styles.repCounterLabel}>REPS</Text>
        </View>

        {/* Accelerometer Graph */}
        <AccelerometerGraph
          data={accelerometerData}
          showFiltered={true}
          height={180}
        />

        {/* Workout Stats */}
        <WorkoutStats
          reps={repCount}
          duration={sessionDuration}
          score={status.averageScore}
        />

        {/* Workout Controls */}
        <WorkoutControls
          isPaused={isPaused}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
        />

        {/* Phase Indicator (Debug) */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text variant="caption" style={styles.debugText}>
              Phase: {currentPhase} | Active: {isActive ? 'Yes' : 'No'}
            </Text>
          </View>
        )}
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
    marginBottom: spacing.lg,
  },

  setProgress: {
    color: colors.primary[500],
    marginBottom: spacing.xs,
    letterSpacing: 1.5,
  },

  exerciseName: {
    color: colors.neutral[900],
    textAlign: 'center',
  },

  repCounterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },

  repCounterText: {
    fontSize: 140,
    fontWeight: '800',
    color: colors.primary[500],
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    lineHeight: 150,
  },

  repCounterLabel: {
    color: colors.neutral.textSecondary,
    marginTop: spacing.sm,
    letterSpacing: 1.2,
  },

  debugInfo: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.neutral[100],
    borderRadius: 8,
  },

  debugText: {
    color: colors.neutral[700],
    textAlign: 'center',
  },
});

export default ActiveWorkoutScreen;
