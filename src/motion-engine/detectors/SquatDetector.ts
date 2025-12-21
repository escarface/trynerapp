/**
 * Squat Detector - High Specificity Rep Detection
 * TrynerApp - Motion Engine
 *
 * Detects squat repetitions using accelerometer data with HIGH SPECIFICITY.
 * Only counts reps with perfect technique to avoid false positives.
 *
 * Detection Strategy:
 * - Magnitude peaks = standing position (upright)
 * - Z-axis valleys = bottom position (dropped down)
 * - Strict thresholds ensure only full-depth, controlled squats count
 *
 * State Machine:
 * idle → descending (magnitude drops) → bottom (Z-axis valley) →
 * ascending (magnitude rises) → completed (peak reached) → idle
 */

import { ProcessedSensorData, DetectedRep, SquatDetectionConfig } from '../types';
import { RepDetector } from './RepDetector';
import { RepFeatureExtractor } from '../extractors/RepFeatureExtractor';
import { VALIDATION_MESSAGES } from '../core/constants';

export class SquatDetector extends RepDetector {
  private config: SquatDetectionConfig;
  private featureExtractor: RepFeatureExtractor;

  // Thresholds for phase transitions
  private readonly MAGNITUDE_DROP_THRESHOLD = 0.30; // G drop to enter descending
  private readonly MAGNITUDE_RISE_THRESHOLD = 0.15; // G rise to enter ascending

  constructor(config: SquatDetectionConfig) {
    super();
    this.config = config;
    this.featureExtractor = new RepFeatureExtractor();
  }

  /**
   * Detect squat repetition from sensor data
   *
   * Implements state machine logic with strict validation
   *
   * @param data - Processed sensor data
   * @returns DetectedRep if completed, null otherwise
   */
  detect(data: ProcessedSensorData): DetectedRep | null {
    const { filteredMagnitude, filteredZ, timestamp } = data;

    // Update peak tracking always (for idle detection)
    this.updatePeakMagnitude(filteredMagnitude);

    // IMPORTANT: Only update valley during descending/bottom phases
    // During ascending, we want the valley to stay fixed so we can measure recovery
    if (this.currentPhase === 'descending' || this.currentPhase === 'bottom') {
      this.updateValleyMagnitude(filteredMagnitude);
      this.updateZAxisTracking(filteredZ);
    }

    // In idle phase, update Z tracking for baseline
    if (this.currentPhase === 'idle') {
      this.updateZAxisTracking(filteredZ);
    }

    // Debug logging only in non-idle states, ~every 2 seconds
    if (__DEV__ && this.currentPhase !== 'idle' && Math.random() < 0.008) {
      console.log(`[SquatDetector] 📊 ${this.currentPhase.toUpperCase()} | Mag: ${filteredMagnitude.toFixed(2)} | Valley: ${this.valleyMagnitude.toFixed(2)}`);
    }

    // State machine
    switch (this.currentPhase) {
      case 'idle':
        return this.handleIdlePhase(data);

      case 'descending':
        return this.handleDescendingPhase(data);

      case 'bottom':
        return this.handleBottomPhase(data);

      case 'ascending':
        return this.handleAscendingPhase(data);

      case 'completed':
        // Should not reach here (completed transitions to idle immediately)
        this.transitionToPhase('idle');
        return null;

      default:
        return null;
    }
  }

  /**
   * IDLE PHASE: Waiting for user to start descending
   * Transition: Magnitude drops significantly → DESCENDING
   */
  private handleIdlePhase(data: ProcessedSensorData): DetectedRep | null {
    const { filteredMagnitude, timestamp } = data;

    // Check if user starts descending (magnitude drops)
    const magnitudeChange = this.peakMagnitude - filteredMagnitude;

    if (magnitudeChange > this.MAGNITUDE_DROP_THRESHOLD) {
      // Start of descent detected
      console.log(`[SquatDetector] 🔽 IDLE → DESCENDING | Drop: ${magnitudeChange.toFixed(2)} G`);
      this.resetRepState(); // Reset peak/valley tracking for new rep FIRST
      this.repStartTime = timestamp; // Now set timestamps after reset
      this.descendStartTime = timestamp;
      this.updatePeakMagnitude(filteredMagnitude); // Re-initialize peak
      this.transitionToPhase('descending');
    }

    return null;
  }

  /**
   * DESCENDING PHASE: User is going down
   * Transition: Z-axis valley detected (bottom position) → BOTTOM
   */
  private handleDescendingPhase(data: ProcessedSensorData): DetectedRep | null {
    const { filteredMagnitude, timestamp } = data;

    // Timeout: If we've been in descending for too long (5 seconds), reset to idle
    const timeInDescending = timestamp - this.descendStartTime;
    if (timeInDescending > 5000) {
      console.log(`[SquatDetector] ⏰ DESCENDING timeout (${(timeInDescending / 1000).toFixed(1)}s) → IDLE`);
      this.transitionToPhase('idle');
      this.resetRepState();
      return null;
    }

    // Check if we've hit bottom (magnitude starts rising)
    const magnitudeRise = filteredMagnitude - this.valleyMagnitude;
    if (magnitudeRise > this.MAGNITUDE_RISE_THRESHOLD) {
      console.log(`[SquatDetector] ⬇️ DESCENDING → BOTTOM | Rise: ${magnitudeRise.toFixed(2)} G | Valley: ${this.valleyMagnitude.toFixed(2)}`);
      this.bottomTime = timestamp;
      this.transitionToPhase('bottom');
    }

    return null;
  }

  /**
   * BOTTOM PHASE: User is at bottom, starting to ascend
   * Transition: Magnitude rising → ASCENDING
   */
  private handleBottomPhase(data: ProcessedSensorData): DetectedRep | null {
    const { timestamp } = data;

    // Immediate transition to ascending (bottom is brief)
    console.log(`[SquatDetector] 🔄 BOTTOM → ASCENDING`);
    this.ascendStartTime = timestamp;
    this.transitionToPhase('ascending');

    return null;
  }

  /**
   * ASCENDING PHASE: User is rising back up
   * Transition: Magnitude returns to peak (standing) → COMPLETED
   */
  private handleAscendingPhase(data: ProcessedSensorData): DetectedRep | null {
    const { filteredMagnitude, timestamp } = data;

    // Timeout: If we've been in ascending for too long (5 seconds), reset to idle
    const timeInAscending = timestamp - this.ascendStartTime;
    if (timeInAscending > 5000) {
      console.log(`[SquatDetector] ⏰ ASCENDING timeout (${(timeInAscending / 1000).toFixed(1)}s) → IDLE`);
      this.transitionToPhase('idle');
      this.resetRepState();
      return null;
    }

    // Check if we've returned to standing (magnitude peak)
    const magnitudeRecovery = filteredMagnitude - this.valleyMagnitude;

    if (magnitudeRecovery >= this.config.minDepthThreshold) {
      console.log(`[SquatDetector] 🔼 ASCENDING → COMPLETED | Recovery: ${magnitudeRecovery.toFixed(3)} G`);

      // Rep completed - create DetectedRep object
      const rep = this.createDetectedRep(timestamp);

      // Validate rep quality (minimal validation for testing)
      if (this.validateRep(rep)) {
        this.repCount++;
        console.log(`[SquatDetector] ✅ REP #${this.repCount} COUNTED! (duration: ${rep.duration}ms, depth: ${rep.depth.toFixed(2)}G)`);
        this.transitionToPhase('idle');
        this.resetRepState();
        return rep;
      } else {
        // Rep failed validation - reject and reset
        console.log(`[SquatDetector] ❌ Rep rejected: ${this.getValidationFailureReason(rep)}`);
        this.transitionToPhase('idle');
        this.resetRepState();
        return null;
      }
    }

    return null;
  }

  /**
   * Create DetectedRep object from current state
   */
  private createDetectedRep(timestamp: number): DetectedRep {
    const duration = this.calculateDuration(this.repStartTime, timestamp);
    const depth = this.calculateMagnitudeChange();

    // Extract features for scoring
    const features = this.featureExtractor.extract({
      descendStartTime: this.descendStartTime,
      bottomTime: this.bottomTime,
      ascendStartTime: this.ascendStartTime,
      completionTime: timestamp,
      peakMagnitude: this.peakMagnitude,
      valleyMagnitude: this.valleyMagnitude,
      peakZValue: this.peakZValue,
      valleyZValue: this.valleyZValue,
    });

    return {
      repNumber: this.repCount + 1,
      timestamp,
      duration,
      depth,
      isValid: false, // Will be set by validateRep()
      features,
    };
  }

  /**
   * Validate rep against thresholds
   *
   * All checks must pass for rep to count:
   * ✅ Sufficient depth (magnitude change)
   * ✅ Sufficient Z-axis drop (vertical movement)
   * ✅ Duration within valid range
   * ✅ Stability score above threshold
   * ✅ Depth score above threshold
   *
   * @param rep - Detected rep to validate
   * @returns True if rep meets all quality criteria
   */
  protected validateRep(rep: DetectedRep): boolean {
    const { features, duration, depth } = rep;

    console.log(`[SquatDetector] 🔍 Validating rep:
      Depth: ${depth.toFixed(2)} (min: ${this.config.minDepthThreshold})
      Z-change: ${features.zAxisChange.toFixed(2)} (min: ${this.config.minZAxisChange})
      Duration: ${duration}ms (min: ${this.config.minRepDuration}, max: ${this.config.maxRepDuration})
      Stability: ${features.stabilityScore.toFixed(0)} (min: ${this.config.minStabilityScore})
      Depth Score: ${features.depthScore.toFixed(0)} (min: ${this.config.minDepthScore})`);

    // 1. Check depth (magnitude change)
    if (depth < this.config.minDepthThreshold) {
      console.log(`[SquatDetector] ❌ Failed: Depth ${depth.toFixed(2)} < ${this.config.minDepthThreshold}`);
      return false;
    }

    // 2. Check Z-axis change (vertical drop)
    // Use Math.abs() for clearer comparison (both values are negative)
    const zChange = Math.abs(features.zAxisChange);
    const minZChange = Math.abs(this.config.minZAxisChange);
    if (zChange < minZChange) {
      // Not enough vertical drop
      console.log(`[SquatDetector] ❌ Failed: Z-change ${zChange.toFixed(2)} < ${minZChange.toFixed(2)}`);
      return false;
    }

    // 3. Check duration
    if (!this.isValidDuration(
      this.repStartTime,
      rep.timestamp,
      this.config.minRepDuration,
      this.config.maxRepDuration
    )) {
      console.log(`[SquatDetector] ❌ Failed: Duration ${duration}ms outside range [${this.config.minRepDuration}, ${this.config.maxRepDuration}]`);
      return false;
    }

    // 4. Check stability score
    if (features.stabilityScore < this.config.minStabilityScore) {
      console.log(`[SquatDetector] ❌ Failed: Stability ${features.stabilityScore.toFixed(0)} < ${this.config.minStabilityScore}`);
      return false;
    }

    // 5. Check depth score (consistency of range)
    if (features.depthScore < this.config.minDepthScore) {
      console.log(`[SquatDetector] ❌ Failed: Depth Score ${features.depthScore.toFixed(0)} < ${this.config.minDepthScore}`);
      return false;
    }

    // All checks passed
    console.log(`[SquatDetector] ✅ All validation checks passed!`);
    rep.isValid = true;
    return true;
  }

  /**
   * Get human-readable validation failure reason (for debugging)
   */
  private getValidationFailureReason(rep: DetectedRep): string {
    const { features, duration, depth } = rep;

    if (depth < this.config.minDepthThreshold) {
      return VALIDATION_MESSAGES.INSUFFICIENT_DEPTH;
    }
    if (Math.abs(features.zAxisChange) < Math.abs(this.config.minZAxisChange)) {
      return VALIDATION_MESSAGES.INSUFFICIENT_Z_CHANGE;
    }
    if (duration < this.config.minRepDuration) {
      return VALIDATION_MESSAGES.TOO_FAST;
    }
    if (duration > this.config.maxRepDuration) {
      return VALIDATION_MESSAGES.TOO_SLOW;
    }
    if (features.stabilityScore < this.config.minStabilityScore) {
      return VALIDATION_MESSAGES.LOW_STABILITY;
    }
    if (features.depthScore < this.config.minDepthScore) {
      return VALIDATION_MESSAGES.LOW_RANGE;
    }

    return 'Unknown validation failure';
  }

  /**
   * Update configuration (for runtime tuning)
   */
  setConfig(config: Partial<SquatDetectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): SquatDetectionConfig {
    return { ...this.config };
  }
}
