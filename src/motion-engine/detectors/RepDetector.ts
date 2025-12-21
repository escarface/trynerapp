/**
 * Rep Detector - Abstract Base Class
 * TrynerApp - Motion Engine
 *
 * Base class for exercise-specific repetition detectors.
 * Subclasses implement detection logic for specific exercises:
 * - SquatDetector
 * - PushupDetector (future)
 * - PullupDetector (future)
 *
 * State Machine:
 * idle → descending → bottom → ascending → completed → idle
 */

import { ProcessedSensorData, DetectedRep, RepPhase } from '../types';

export abstract class RepDetector {
  protected currentPhase: RepPhase = 'idle';
  protected repCount: number = 0;

  // State tracking for current rep in progress
  protected repStartTime: number = 0;
  protected descendStartTime: number = 0;
  protected bottomTime: number = 0;
  protected ascendStartTime: number = 0;

  // Signal tracking
  protected peakMagnitude: number = 0;
  protected valleyMagnitude: number = Infinity;
  protected peakZValue: number = 0;
  protected valleyZValue: number = 0;

  /**
   * Process new sensor data and detect repetition
   *
   * Subclasses must implement exercise-specific detection logic
   *
   * @param data - Processed sensor data
   * @returns Detected rep if completed, null otherwise
   */
  abstract detect(data: ProcessedSensorData): DetectedRep | null;

  /**
   * Validate if detected rep meets quality thresholds
   *
   * Subclasses implement exercise-specific validation rules
   *
   * @param rep - Detected rep to validate
   * @returns True if rep is valid
   */
  protected abstract validateRep(rep: DetectedRep): boolean;

  /**
   * Get current detection phase
   */
  getCurrentPhase(): RepPhase {
    return this.currentPhase;
  }

  /**
   * Get total rep count
   */
  getRepCount(): number {
    return this.repCount;
  }

  /**
   * Reset detector state (for new workout session or set)
   */
  reset(): void {
    this.currentPhase = 'idle';
    this.repCount = 0;
    this.resetRepState();
  }

  /**
   * Reset state for current rep in progress
   */
  protected resetRepState(): void {
    this.repStartTime = 0;
    this.descendStartTime = 0;
    this.bottomTime = 0;
    this.ascendStartTime = 0;
    this.peakMagnitude = 0;
    this.valleyMagnitude = Infinity;
    this.peakZValue = 0;
    this.valleyZValue = 0;
  }

  /**
   * Transition to new phase
   * @param newPhase - Phase to transition to
   */
  protected transitionToPhase(newPhase: RepPhase): void {
    this.currentPhase = newPhase;
  }

  /**
   * Check if enough time has passed for valid rep duration
   *
   * @param startTime - Rep start timestamp
   * @param endTime - Rep end timestamp
   * @param minDuration - Minimum duration (ms)
   * @param maxDuration - Maximum duration (ms)
   * @returns True if duration is within valid range
   */
  protected isValidDuration(
    startTime: number,
    endTime: number,
    minDuration: number,
    maxDuration: number
  ): boolean {
    const duration = endTime - startTime;
    return duration >= minDuration && duration <= maxDuration;
  }

  /**
   * Calculate rep duration
   * @param startTime - Start timestamp
   * @param endTime - End timestamp
   * @returns Duration in milliseconds
   */
  protected calculateDuration(startTime: number, endTime: number): number {
    return endTime - startTime;
  }

  /**
   * Update peak magnitude tracking
   * @param magnitude - Current magnitude value
   */
  protected updatePeakMagnitude(magnitude: number): void {
    if (magnitude > this.peakMagnitude) {
      this.peakMagnitude = magnitude;
    }
  }

  /**
   * Update valley magnitude tracking
   * @param magnitude - Current magnitude value
   */
  protected updateValleyMagnitude(magnitude: number): void {
    if (magnitude < this.valleyMagnitude) {
      this.valleyMagnitude = magnitude;
    }
  }

  /**
   * Update Z-axis peak/valley tracking
   * @param z - Current Z-axis value
   */
  protected updateZAxisTracking(z: number): void {
    if (z > this.peakZValue) {
      this.peakZValue = z;
    }
    if (z < this.valleyZValue) {
      this.valleyZValue = z;
    }
  }

  /**
   * Calculate magnitude change (depth of movement)
   * @returns Magnitude difference between peak and valley
   */
  protected calculateMagnitudeChange(): number {
    // Guard against Infinity (initial value before valley is found)
    if (!isFinite(this.valleyMagnitude)) {
      return 0;
    }
    return this.peakMagnitude - this.valleyMagnitude;
  }

  /**
   * Calculate Z-axis change (vertical drop)
   * @returns Z-axis difference (negative = downward movement)
   */
  protected calculateZAxisChange(): number {
    return this.valleyZValue - this.peakZValue;
  }
}
