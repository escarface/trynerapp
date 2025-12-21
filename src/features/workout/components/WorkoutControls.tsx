/**
 * WorkoutControls - Workout Control Buttons
 * TrynerApp - Workout Feature
 *
 * Control buttons for workout session (pause/resume/stop).
 *
 * Features:
 * - Pause/Resume toggle
 * - Stop with confirmation
 * - Disabled states during actions
 *
 * Usage:
 * ```typescript
 * <WorkoutControls
 *   isPaused={false}
 *   onPause={() => {}}
 *   onResume={() => {}}
 *   onStop={() => {}}
 * />
 * ```
 */

import React, { useState } from 'react';
import { StyleSheet, View, Alert, Text as RNText } from 'react-native';
import Button from '@/shared/components/Button';
import { spacing } from '@/core/theme';

interface WorkoutControlsProps {
  /** Whether workout is currently paused */
  isPaused: boolean;

  /** Callback when pause button pressed */
  onPause: () => void;

  /** Callback when resume button pressed */
  onResume: () => void;

  /** Callback when stop button pressed */
  onStop: () => void;

  /** Disable all buttons (e.g., during transitions) */
  disabled?: boolean;
}

export const WorkoutControls: React.FC<WorkoutControlsProps> = ({
  isPaused,
  onPause,
  onResume,
  onStop,
  disabled = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePauseResume = () => {
    if (isPaused) {
      onResume();
    } else {
      onPause();
    }
  };

  const handleStop = () => {
    Alert.alert(
      'Finalizar Set',
      '¿Estás seguro de que quieres finalizar este set?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Finalizar',
          style: 'destructive',
          onPress: () => {
            setIsProcessing(true);
            onStop();
            // Reset processing state after a brief delay
            setTimeout(() => setIsProcessing(false), 500);
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        {/* Pause/Resume button */}
        <View style={styles.buttonContainer}>
          <Button
            title={isPaused ? 'Reanudar' : 'Pausar'}
            variant="secondary"
            size="large"
            onPress={handlePauseResume}
            disabled={disabled || isProcessing}
            leftIcon={<RNText style={styles.icon}>{isPaused ? '▶️' : '⏸️'}</RNText>}
          />
        </View>

        {/* Stop button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Finalizar"
            variant="outline"
            size="large"
            onPress={handleStop}
            disabled={disabled || isProcessing}
            leftIcon={<RNText style={styles.icon}>⏹️</RNText>}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  buttonContainer: {
    flex: 1,
  },

  icon: {
    fontSize: 18,
  },
});

export default WorkoutControls;
