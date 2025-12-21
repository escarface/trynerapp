/**
 * Motion Engine - Configuration Constants
 * TrynerApp - Real-time Squat Detection System
 */

import { SquatDetectionConfig, MotionEngineConfig } from '../types';

// ============= DEFAULT SQUAT DETECTION CONFIG =============

/**
 * Default configuration optimized for TESTING AND DEVELOPMENT
 * More lenient thresholds to ensure reps are detected during development
 *
 * Tuning guide:
 * - Increase minDepthThreshold for stricter depth requirements
 * - Decrease minStabilityScore to be more permissive
 * - Adjust lowPassAlpha: lower = smoother but more lag
 */
export const DEFAULT_SQUAT_CONFIG: SquatDetectionConfig = {
  // Depth thresholds (VERY lenient for testing - real squats show ~0.1-0.2 G change)
  minDepthThreshold: 0.08,           // Minimum magnitude change (G) - VERY LOW for testing
  minZAxisChange: -0.1,              // Minimum vertical drop (G) - VERY LOW for testing

  // Timing constraints (DISABLED for testing)
  minRepDuration: 100,               // Min rep time in ms (0.1 seconds) - Very fast allowed
  maxRepDuration: 60000,             // Max rep time in ms (60 seconds) - Effectively disabled for testing

  // Peak detection (signal processing)
  peakProminence: 0.05,              // Minimum peak height above surroundings - Very sensitive
  minPeakDistance: 15,               // Min samples between peaks (~0.25s at 60Hz)

  // Quality thresholds (DISABLED for testing - accept all reps)
  minStabilityScore: 0,              // Accept any stability
  minDepthScore: 0,                  // Accept any depth

  // Signal processing
  lowPassAlpha: 0.22,                // Low-pass filter coefficient (0-1)
                                     // Lower = smoother but more lag
                                     // Higher = more responsive but noisier
  samplingRate: 60,                  // Target Hz (expo-sensors default)
  bufferSize: 240,                   // Samples to keep (4 seconds at 60Hz)
};

// ============= DEFAULT MOTION ENGINE CONFIG =============

/**
 * Default Motion Engine configuration for squat detection
 */
export const DEFAULT_MOTION_CONFIG: MotionEngineConfig = {
  exerciseType: 'squat',             // MVP: only squat supported
  detectionConfig: DEFAULT_SQUAT_CONFIG,
  enableDebugMode: __DEV__,          // Enable debug mode in development
};

// ============= SCORE QUALITY THRESHOLDS =============

/**
 * Score ranges for technique classification
 */
export const SCORE_THRESHOLDS = {
  excellent: 85,    // ≥85: Excelente
  optimal: 70,      // 70-84: Óptimo
  good: 50,         // 50-69: Bien
  acceptable: 0,    // <50: Mejorable
} as const;

/**
 * Map score to technique label
 */
export function getScoreTechnique(score: number): 'excellent' | 'optimal' | 'good' | 'acceptable' | 'poor' {
  if (score >= SCORE_THRESHOLDS.excellent) return 'excellent';
  if (score >= SCORE_THRESHOLDS.optimal) return 'optimal';
  if (score >= SCORE_THRESHOLDS.good) return 'good';
  if (score >= SCORE_THRESHOLDS.acceptable) return 'acceptable';
  return 'poor';
}

// ============= PHYSICS CONSTANTS =============

/**
 * Physics constants for motion analysis
 */
export const PHYSICS = {
  GRAVITY: 9.81,                     // m/s² (not used in MVP but useful reference)
  SAMPLES_PER_SECOND: 60,            // Hz
  MS_PER_SAMPLE: 1000 / 60,          // ~16.67ms
} as const;

// ============= BUFFER CONSTANTS =============

/**
 * Buffer management constants
 */
export const BUFFER = {
  MAX_SIZE: DEFAULT_SQUAT_CONFIG.bufferSize,  // 240 samples
  DURATION_SECONDS: DEFAULT_SQUAT_CONFIG.bufferSize / DEFAULT_SQUAT_CONFIG.samplingRate,  // 4 seconds
  GRAPH_SAMPLES: 180,                // Show last 3 seconds in graph (optimization)
} as const;

// ============= VALIDATION MESSAGES =============

/**
 * Validation failure reasons (for debugging)
 */
export const VALIDATION_MESSAGES = {
  INSUFFICIENT_DEPTH: 'Profundidad insuficiente',
  INSUFFICIENT_Z_CHANGE: 'Movimiento vertical insuficiente',
  TOO_FAST: 'Repetición demasiado rápida',
  TOO_SLOW: 'Repetición demasiado lenta',
  LOW_STABILITY: 'Movimiento inestable',
  LOW_RANGE: 'Rango de movimiento inconsistente',
} as const;
