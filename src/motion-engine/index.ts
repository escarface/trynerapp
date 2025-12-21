/**
 * Motion Engine - Public API Exports
 * TrynerApp - Real-time Squat Detection System
 *
 * Main entry point for Motion Engine module.
 * Import from this file to use the Motion Engine in your app.
 *
 * Example usage:
 * ```typescript
 * import { MotionEngine, DEFAULT_SQUAT_CONFIG } from '@/motion-engine';
 *
 * const engine = new MotionEngine(
 *   { exerciseType: 'squat', detectionConfig: DEFAULT_SQUAT_CONFIG },
 *   {
 *     onRepDetected: (rep) => console.log('Rep detected!', rep),
 *     onStateChange: (state) => console.log('State:', state),
 *     onError: (error) => console.error('Error:', error),
 *   }
 * );
 *
 * await engine.start();
 * ```
 */

// ============= MAIN ENGINE =============
export { MotionEngine } from './core/MotionEngine';

// ============= TYPES =============
export type {
  // Sensor data
  AccelerometerData,
  ProcessedSensorData,

  // Rep detection
  RepPhase,
  DetectedRep,
  RepFeatures,
  RepScore,

  // Configuration
  SquatDetectionConfig,
  MotionEngineConfig,

  // State
  MotionEngineState,
  MotionEngineStatus,

  // Callbacks
  MotionEngineCallbacks,

  // Peak detection
  Peak,
  Valley,
} from './types';

// ============= CONSTANTS =============
export {
  DEFAULT_SQUAT_CONFIG,
  DEFAULT_MOTION_CONFIG,
  SCORE_THRESHOLDS,
  PHYSICS,
  BUFFER,
  VALIDATION_MESSAGES,
  getScoreTechnique,
} from './core/constants';

// ============= COMPONENTS (for advanced usage) =============
// Most users should only import MotionEngine, but these are available
// if you need to build custom detection pipelines

export { SensorAdapter } from './adapters/SensorAdapter';
export { LowPassFilter } from './processors/LowPassFilter';
export { SignalProcessor } from './processors/SignalProcessor';
export { PeakDetector } from './detectors/PeakDetector';
export { RepDetector } from './detectors/RepDetector';
export { SquatDetector } from './detectors/SquatDetector';
export { RepFeatureExtractor } from './extractors/RepFeatureExtractor';
export { ScoringEngine } from './scoring/ScoringEngine';

// ============= REACT HOOKS =============
// React + Reanimated integration hooks (most common usage)

export { useMotionEngine } from './hooks/useMotionEngine';
export { useWorkoutSession } from './hooks/useWorkoutSession';
