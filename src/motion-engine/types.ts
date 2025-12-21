/**
 * Motion Engine - TypeScript Type Definitions
 * TrynerApp - Real-time Squat Detection System
 */

// ============= SENSOR DATA =============

/**
 * Raw accelerometer reading from expo-sensors
 */
export interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

/**
 * Processed sensor data with filtered values and magnitude
 */
export interface ProcessedSensorData extends AccelerometerData {
  magnitude: number;              // √(x² + y² + z²)
  filteredX: number;
  filteredY: number;
  filteredZ: number;
  filteredMagnitude: number;
}

// ============= REP DETECTION =============

/**
 * Current phase of rep detection state machine
 */
export type RepPhase = 'idle' | 'descending' | 'bottom' | 'ascending' | 'completed';

/**
 * Detected repetition with validation status
 */
export interface DetectedRep {
  repNumber: number;
  timestamp: number;
  duration: number;              // Milliseconds
  depth: number;                 // Peak-to-valley magnitude change (G)
  isValid: boolean;              // Passed all validation checks
  features: RepFeatures;
  score?: RepScore;              // Optional: added after scoring
}

// ============= REP FEATURES =============

/**
 * Features extracted from a single repetition
 * Used for scoring and validation
 */
export interface RepFeatures {
  // Timing
  descendDuration: number;       // ms
  ascendDuration: number;        // ms
  totalDuration: number;         // ms

  // Movement Quality
  depthScore: number;            // 0-100: Full range of motion
  stabilityScore: number;        // 0-100: Movement smoothness
  rangeScore: number;            // 0-100: Consistent range across reps

  // Raw measurements
  peakMagnitude: number;         // G
  valleyMagnitude: number;       // G
  magnitudeChange: number;       // G (peak - valley)
  zAxisChange: number;           // G (vertical drop, negative value)
}

// ============= SCORING =============

/**
 * Overall repetition quality score
 */
export interface RepScore {
  overall: number;               // 0-100: Overall quality
  depth: number;                 // 0-100: Range of motion score
  stability: number;             // 0-100: Movement smoothness score
  consistency: number;           // 0-100: Rep-to-rep consistency score
  technique: 'excellent' | 'optimal' | 'good' | 'acceptable' | 'poor';
}

// ============= MOTION ENGINE STATE =============

/**
 * Motion Engine operational states
 */
export type MotionEngineState = 'idle' | 'starting' | 'active' | 'paused' | 'stopped';

/**
 * Motion Engine current status
 */
export interface MotionEngineStatus {
  state: MotionEngineState;
  isRunning: boolean;
  repCount: number;
  lastRepTimestamp: number | null;
  currentPhase: RepPhase;
  averageScore: number;
  sessionStartTime: number | null;
}

// ============= CONFIGURATION =============

/**
 * Squat detection configuration (HIGH SPECIFICITY)
 * All thresholds optimized for perfect technique only
 */
export interface SquatDetectionConfig {
  // Depth thresholds
  minDepthThreshold: number;           // Minimum magnitude change (G) - default: 0.8
  minZAxisChange: number;              // Minimum vertical drop (G) - default: -0.6

  // Timing constraints
  minRepDuration: number;              // Min rep time in ms - default: 800
  maxRepDuration: number;              // Max rep time in ms - default: 5000

  // Peak detection
  peakProminence: number;              // Minimum peak prominence - default: 0.15
  minPeakDistance: number;             // Min samples between peaks - default: 30

  // Quality thresholds (for high specificity)
  minStabilityScore: number;           // Min stability to count rep (0-100) - default: 65
  minDepthScore: number;               // Min depth to count rep (0-100) - default: 70

  // Signal processing
  lowPassAlpha: number;                // Low-pass filter coefficient - default: 0.22
  samplingRate: number;                // Target Hz - default: 60
  bufferSize: number;                  // Samples to keep in buffer - default: 240
}

/**
 * Motion Engine configuration
 */
export interface MotionEngineConfig {
  exerciseType: 'squat' | 'pushup' | 'pullup';  // MVP: only squat supported
  detectionConfig: SquatDetectionConfig;
  enableDebugMode: boolean;
}

// ============= CALLBACKS =============

/**
 * Motion Engine event callbacks
 */
export interface MotionEngineCallbacks {
  onRepDetected: (rep: DetectedRep) => void;
  onStateChange: (state: MotionEngineState) => void;
  onError: (error: Error) => void;
}

// ============= PEAK DETECTION =============

/**
 * Detected peak or valley in signal
 */
export interface Peak {
  value: number;           // Signal value at peak
  index: number;           // Index in buffer
  timestamp: number;       // Timestamp of peak
  prominence: number;      // Peak prominence (height above surroundings)
}

/**
 * Valley is same structure as Peak but for local minima
 */
export type Valley = Peak;
